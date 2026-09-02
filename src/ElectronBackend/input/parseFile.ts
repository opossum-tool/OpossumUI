// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import Ajv, { type ValidateFunction } from 'ajv';
import { Readable } from 'stream';
import parser from 'stream-json';
import Asm, { type Assembler } from 'stream-json/assembler.js';

import type { ReadonlyRule } from '../../shared/shared-types';
import {
  INPUT_FILE_NAME,
  OUTPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from '../../shared/write-file-utils';
import type {
  InvalidDotOpossumFileError,
  JsonParsingError,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
  UnzipError,
} from '../types/types';
import * as OpossumInputFileSchema from './OpossumInputFileSchema.json';
import * as OpossumOutputFileSchema from './OpossumOutputFileSchema.json';
import * as OpossumSplitInfoSchema from './OpossumSplitInfoSchema.json';

const ajv = new Ajv();
const validateInput = ajv.compile<ParsedOpossumInputFile>(
  OpossumInputFileSchema,
);
const validateOutput = ajv.compile<ParsedOpossumOutputFile>(
  OpossumOutputFileSchema,
);
const validateSplitInfo = ajv.compile<{ readonlyRules: Array<ReadonlyRule> }>(
  OpossumSplitInfoSchema,
);

function assertValid<T>(
  validate: ValidateFunction<T>,
  data: unknown,
): asserts data is T {
  if (!validate(data)) {
    throw new Error(ajv.errorsText(validate.errors));
  }
}

export async function parseOpossumFile(
  opossumFilePath: string,
): Promise<
  | ParsedOpossumInputAndOutput
  | UnzipError
  | JsonParsingError
  | InvalidDotOpossumFileError
> {
  let zip: AdmZip;
  let inputBytes: Buffer | null;
  let outputBytes: Buffer | null;
  let readonlyRulesBytes: Buffer | null;
  try {
    zip = new AdmZip(opossumFilePath);
    const inputEntry = zip.getEntry(INPUT_FILE_NAME);
    const outputEntry = zip.getEntry(OUTPUT_FILE_NAME);
    const readonlyRulesEntry = zip.getEntry(SPLIT_INFO_FILE_NAME);
    inputBytes = inputEntry ? inputEntry.getData() : null;
    outputBytes = outputEntry ? outputEntry.getData() : null;
    readonlyRulesBytes = readonlyRulesEntry
      ? readonlyRulesEntry.getData()
      : null;
  } catch (err) {
    return {
      message: `Error: ${opossumFilePath} could not be unzipped.\n Original error message: ${err?.toString()}`,
      type: 'unzipError',
    } satisfies UnzipError;
  }

  if (!inputBytes) {
    return {
      message: '',
      type: 'invalidDotOpossumFileError',
    } satisfies InvalidDotOpossumFileError;
  }

  let parsedInputData: ParsedOpossumInputFile;
  try {
    parsedInputData = await parseJsonBytes<ParsedOpossumInputFile>(inputBytes);
    assertValid(validateInput, parsedInputData);
  } catch (err) {
    return {
      message: `Error: ${opossumFilePath} does not contain a valid input file.\n Original error message: ${err?.toString()}`,
      type: 'jsonParsingError',
    } satisfies JsonParsingError;
  }

  let parsedOutputData: ParsedOpossumOutputFile | null = null;
  if (outputBytes) {
    try {
      parsedOutputData = parseOutputJsonContent(
        outputBytes.toString('utf-8'),
        opossumFilePath,
      );
    } catch (err) {
      return {
        message: `Error: ${opossumFilePath} does not contain a valid output file.\n${err?.toString()}`,
        type: 'jsonParsingError',
      } satisfies JsonParsingError;
    }
  }

  let readonlyRules: Array<ReadonlyRule> = [];
  if (readonlyRulesBytes) {
    try {
      readonlyRules = parseReadonlyRules(readonlyRulesBytes.toString('utf-8'));
    } catch (err) {
      return {
        message: `Error: ${opossumFilePath} does not contain valid split metadata.\n${err?.toString()}`,
        type: 'jsonParsingError',
      } satisfies JsonParsingError;
    }
  }

  return {
    input: parsedInputData,
    output: parsedOutputData,
    readonlyRules,
    opossumZip: zip,
  };
}

export function parseReadonlyRules(content: string): Array<ReadonlyRule> {
  const parsedContent = JSON.parse(content);
  assertValid(validateSplitInfo, parsedContent);
  return parsedContent.readonlyRules;
}

export function parseOutputJsonContent(
  fileContent: string,
  filePath: string,
): ParsedOpossumOutputFile {
  try {
    const jsonContent = JSON.parse(fileContent);
    assertValid(validateOutput, jsonContent);
    return jsonContent;
  } catch (err) {
    throw new Error(
      `Error: ${filePath.toString()} contains an invalid output file.\n Original error message: ${err?.toString()}`,
      { cause: err },
    );
  }
}

// Chunk size for re-streaming an in-memory buffer through `stream-json`.
// `stream-json` decodes each incoming chunk to a JS string, so we keep chunks
// well under V8's ~512 MB string-length cap.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const JSON_STREAM_CHUNK_SIZE = 1 << 20; // 1 MiB

// Keep the native parser below a conservative size so its temporary string
// remains well below V8's maximum string length.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const JSON_PARSE_FAST_PATH_MAX_BYTES = 256 * JSON_STREAM_CHUNK_SIZE;

/**
 * Chunks the array so stream-json doesn't internally build a too long string.
 */
function bytesAsStream(
  bytes: Uint8Array,
  chunkSize: number = JSON_STREAM_CHUNK_SIZE,
): Readable {
  return Readable.from(
    (function* () {
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        yield bytes.subarray(offset, offset + chunkSize);
      }
    })(),
  );
}

/**
 * Uses the native parser for inputs that can safely be materialized as a
 * string, while retaining the chunked parser for larger inputs.
 */
function parseJsonBytes<T>(bytes: Buffer): Promise<T> {
  if (bytes.byteLength <= JSON_PARSE_FAST_PATH_MAX_BYTES) {
    return Promise.resolve(JSON.parse(bytes.toString('utf-8')) as T);
  }

  return parseJsonStream<T>(bytesAsStream(bytes));
}

/**
 * Streaming alternative to `JSON.parse`. Avoids materializing the input as
 * a single JS string, which would hit V8's ~512 MB string-length cap for
 * very large inputs.
 */
function parseJsonStream<T>(stream: Readable): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // `pipe` does not forward `'error'` from source to destination, so we
    // listen on both ends to avoid the promise hanging on source failures.
    stream.on('error', reject);
    const pipeline = stream.pipe(parser());
    pipeline.on('error', reject);
    Asm.connectTo(pipeline, {
      onDone: (asm: Assembler) => resolve(asm.current as T),
    });
  });
}
