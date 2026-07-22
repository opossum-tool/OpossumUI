// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import { type Options, Validator } from 'jsonschema';
import { Readable } from 'stream';
import parser from 'stream-json';
import Asm, { type Assembler } from 'stream-json/assembler.js';

import {
  INPUT_FILE_NAME,
  OUTPUT_FILE_NAME,
} from '../../shared/write-file-utils';
import type {
  InvalidDotOpossumFileError,
  JsonParsingError,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
  UnzipError,
} from '../types/types';
import * as OpossumInputFileSchema from './OpossumInputFileSchema.json';
import * as OpossumOutputFileSchema from './OpossumOutputFileSchema.json';

export interface LoadedArchive {
  input: ParsedOpossumInputFile;
  output: ParsedOpossumOutputFile | null;
  opossumZip: AdmZip;
}

type LoadArchiveError =
  UnzipError | JsonParsingError | InvalidDotOpossumFileError;

const jsonSchemaValidator = new Validator();
const validationOptions: Options = {
  throwError: true,
};

export async function loadOpossumFile(
  opossumFilePath: string,
): Promise<LoadedArchive | LoadArchiveError> {
  let zip: AdmZip;
  let inputBytes: Buffer | null;
  let outputBytes: Buffer | null;
  try {
    zip = new AdmZip(opossumFilePath);
    const inputEntry = zip.getEntry(INPUT_FILE_NAME);
    const outputEntry = zip.getEntry(OUTPUT_FILE_NAME);
    inputBytes = inputEntry ? inputEntry.getData() : null;
    outputBytes = outputEntry ? outputEntry.getData() : null;
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
    parsedInputData = await parseJsonStream<ParsedOpossumInputFile>(
      bytesAsStream(inputBytes),
    );
    jsonSchemaValidator.validate(
      parsedInputData,
      OpossumInputFileSchema,
      validationOptions,
    );
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

  return {
    input: parsedInputData,
    output: parsedOutputData,
    opossumZip: zip,
  };
}

function parseOutputJsonContent(
  fileContent: string,
  filePath: string,
): ParsedOpossumOutputFile {
  try {
    const jsonContent = JSON.parse(fileContent);
    jsonSchemaValidator.validate(
      jsonContent,
      OpossumOutputFileSchema,
      validationOptions,
    );
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
