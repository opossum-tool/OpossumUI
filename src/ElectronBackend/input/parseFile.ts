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

import { INPUT_FILE_NAME, OUTPUT_FILE_NAME } from '../../shared/write-file';
import { getGlobalBackendState } from '../main/globalBackendState';
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
  let parsedInputData: ParsedOpossumInputFile;
  let parsedOutputData: ParsedOpossumOutputFile | null = null;

  const zip: fflate.Unzipped = await readZipAsync(opossumFilePath);

  if (!zip[INPUT_FILE_NAME]) {
    return {
      filesInArchive: Object.keys(zip)
        .map((fileName) => `'${fileName}'`)
        .join(', '),
      type: 'invalidDotOpossumFileError',
    } satisfies InvalidDotOpossumFileError;
  }

  getGlobalBackendState().inputFileRaw = zip[INPUT_FILE_NAME];

  try {
    parsedInputData = JSON.parse(fflate.strFromU8(zip[INPUT_FILE_NAME]));
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

  if (zip[OUTPUT_FILE_NAME]) {
    try {
      const outputJson = fflate.strFromU8(zip[OUTPUT_FILE_NAME]);
      parsedOutputData = parseOutputJsonContent(outputJson, opossumFilePath);
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
  };
}

async function readZipAsync(opossumFilePath: string): Promise<fflate.Unzipped> {
  const originalZipBuffer: Buffer = await new Promise((resolve) => {
    fs.readFile(opossumFilePath, (err, data) => {
      if (err) {
        throw err;
      }
      resolve(data);
    });
  });

  return new Promise((resolve) => {
    fflate.unzip(new Uint8Array(originalZipBuffer), (err, unzipData) => {
      if (err) {
        throw err;
      }
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
      message: `Error: ${resourceFilePath.toString()} is not a valid input file.`,
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
        message: `Error: ${resourceFilePath.toString()} is not a valid input file.\n${err?.toString()}`,
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
    );
  }
}
