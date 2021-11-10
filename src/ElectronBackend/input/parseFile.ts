// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import zlib from 'zlib';
import { Options, Validator } from 'jsonschema';
import {
  JsonParsingError,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../types/types';
import * as OpossumInputFileSchema from './OpossumInputFileSchema.json';
import * as OpossumOutputFileSchema from './OpossumOutputFileSchema.json';
import Asm from 'stream-json/Assembler';
import { Parser, parser } from 'stream-json';

const jsonSchemaValidator = new Validator();
const validationOptions: Options = {
  throwError: true,
};

export function parseOpossumOutputFile(
  attributionFilePath: fs.PathLike
): ParsedOpossumOutputFile {
  const fileContent: unknown = parseJson(attributionFilePath);

  try {
    jsonSchemaValidator.validate(
      fileContent,
      OpossumOutputFileSchema,
      validationOptions
    );
  } catch (err) {
    throw new Error(
      `Error: ${attributionFilePath} is not a valid attribution file.\n${err}`
    );
  }

  const resolvedExternalAttributions = (fileContent as Record<string, unknown>)
    .resolvedExternalAttributions;
  return {
    ...(fileContent as Record<string, unknown>),
    resolvedExternalAttributions: resolvedExternalAttributions
      ? new Set(resolvedExternalAttributions as Array<string>)
      : new Set(),
  } as ParsedOpossumOutputFile;
}

export function parseOpossumInputFile(
  resourceFilePath: fs.PathLike
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
    result: ParsedOpossumInputFile | JsonParsingError
  ) => void;
  const promise: Promise<ParsedOpossumInputFile | JsonParsingError> =
    new Promise((resolve) => {
      resolveCallback = (opossumInputData): void => resolve(opossumInputData);
    });

  pipeline.on('error', () => {
    resolveCallback({
      message: `Error: ${resourceFilePath} is not a valid input file!!!`,
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
        validationOptions
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

function parseJson(filePath: fs.PathLike): unknown {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    throw new Error(`Error while reading the JSON file ${filePath}.`);
  }
}
