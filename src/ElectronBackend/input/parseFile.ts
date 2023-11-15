// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as fflate from 'fflate';
import fs from 'fs';
import { Options, Validator } from 'jsonschema';
import { Parser, parser } from 'stream-json';
import Asm from 'stream-json/Assembler';
import zlib from 'zlib';

import { getGlobalBackendState } from '../main/globalBackendState';
import { INPUT_FILE_NAME, OUTPUT_FILE_NAME } from '../shared-constants';
import {
  InvalidDotOpossumFileError,
  JsonParsingError,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../types/types';
import * as OpossumInputFileSchema from './OpossumInputFileSchema.json';
import * as OpossumOutputFileSchema from './OpossumOutputFileSchema.json';

const jsonSchemaValidator = new Validator();
const validationOptions: Options = {
  throwError: true,
};

export async function parseOpossumFile(
  opossumFilePath: string,
): Promise<
  ParsedOpossumInputAndOutput | JsonParsingError | InvalidDotOpossumFileError
> {
  let parsedInputData: unknown;
  let parsedOutputData: unknown = null;
  let jsonParsingError: JsonParsingError | null = null;
  let invalidDotOpossumFileError: InvalidDotOpossumFileError | null = null;

  const zip: fflate.Unzipped = await readZipAsync(opossumFilePath);
  if (!zip[INPUT_FILE_NAME]) {
    invalidDotOpossumFileError = {
      filesInArchive: Object.keys(zip)
        .map((fileName) => `'${fileName}'`)
        .join(', '),
      type: 'invalidDotOpossumFileError',
    };
  } else {
    getGlobalBackendState().inputFileRaw = zip[INPUT_FILE_NAME];
    const inputJson = fflate.strFromU8(zip[INPUT_FILE_NAME]);
    JSON.parse(inputJson);
    try {
      parsedInputData = parseAndValidateJson(inputJson, OpossumInputFileSchema);
    } catch (err) {
      jsonParsingError = {
        message: `Error: ${opossumFilePath} does not contain a valid input file.\n Original error message: ${err}`,
        type: 'jsonParsingError',
      };
    }

    if (zip[OUTPUT_FILE_NAME]) {
      try {
        const outputJson = fflate.strFromU8(zip[OUTPUT_FILE_NAME]);
        parsedOutputData = parseOutputJsonContent(outputJson, opossumFilePath);
      } catch (err) {
        jsonParsingError = {
          message: `Error: ${opossumFilePath} does not contain a valid output file.\n${err}`,
          type: 'jsonParsingError',
        };
      }
    }
  }

  return jsonParsingError
    ? jsonParsingError
    : invalidDotOpossumFileError
      ? invalidDotOpossumFileError
      : {
          input: parsedInputData as ParsedOpossumInputFile,
          output: parsedOutputData as ParsedOpossumOutputFile,
        };
}

async function readZipAsync(opossumFilePath: string): Promise<fflate.Unzipped> {
  const originalZipBuffer: Buffer = await new Promise((resolve) => {
    fs.readFile(opossumFilePath, (err, data) => {
      if (err) throw err;
      resolve(data);
    });
  });

  return new Promise((resolve) => {
    fflate.unzip(new Uint8Array(originalZipBuffer), (err, unzipData) => {
      if (err) throw err;
      resolve(unzipData);
    });
  });
}

export function parseInputJsonFile(
  resourceFilePath: fs.PathLike,
): Promise<ParsedOpossumInputFile | JsonParsingError> {
  let pipeline: Parser;
  if (resourceFilePath.toString().endsWith('.json.gz')) {
    pipeline = fs
      .createReadStream(resourceFilePath)
      .pipe(zlib.createGunzip())
      .pipe(parser());
  } else {
    pipeline = fs.createReadStream(resourceFilePath).pipe(parser());
  }

  let resolveCallback: (
    result: ParsedOpossumInputFile | JsonParsingError,
  ) => void;
  const promise: Promise<ParsedOpossumInputFile | JsonParsingError> =
    new Promise((resolve) => {
      resolveCallback = (opossumInputData): void => resolve(opossumInputData);
    });

  pipeline.on('error', () => {
    resolveCallback({
      message: `Error: ${resourceFilePath} is not a valid input file.`,
      type: 'jsonParsingError',
    } as JsonParsingError);
  });

  const asm = Asm.connectTo(pipeline);
  asm.on('done', (asm) => {
    const opossumInputData = asm.current;

    try {
      jsonSchemaValidator.validate(
        opossumInputData,
        OpossumInputFileSchema,
        validationOptions,
      );
      resolveCallback(opossumInputData as ParsedOpossumInputFile);
    } catch (err) {
      resolveCallback({
        message: `Error: ${resourceFilePath} is not a valid input file.\n${err}`,
        type: 'jsonParsingError',
      } as JsonParsingError);
    }
  });

  return promise;
}

export function parseOutputJsonFile(
  attributionFilePath: fs.PathLike,
): ParsedOpossumOutputFile {
  const content = fs.readFileSync(attributionFilePath, 'utf-8');
  return parseOutputJsonContent(content, attributionFilePath);
}

export function parseOutputJsonContent(
  fileContent: string,
  filePath: fs.PathLike,
): ParsedOpossumOutputFile {
  let outputJsonContent;
  try {
    outputJsonContent = parseAndValidateJson(
      fileContent,
      OpossumOutputFileSchema,
    );
  } catch (err) {
    throw new Error(
      `Error: ${filePath} contains an invalid output file.\n Original error message: ${err}`,
    );
  }

  const resolvedExternalAttributions = (
    outputJsonContent as Record<string, unknown>
  ).resolvedExternalAttributions;
  return {
    ...(outputJsonContent as Record<string, unknown>),
    resolvedExternalAttributions: resolvedExternalAttributions
      ? new Set(resolvedExternalAttributions as Array<string>)
      : new Set(),
  } as ParsedOpossumOutputFile;
}

function parseAndValidateJson(
  content: string,
  schema: typeof OpossumInputFileSchema | typeof OpossumOutputFileSchema,
): unknown {
  const jsonContent = JSON.parse(content);
  jsonSchemaValidator.validate(jsonContent, schema, validationOptions);
  return jsonContent;
}
