// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import zlib from 'zlib';
import { Options, Validator } from 'jsonschema';
import {
  InvalidDotOpossumFileError,
  JsonParsingError,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../types/types';
import * as OpossumInputFileSchema from './OpossumInputFileSchema.json';
import * as OpossumOutputFileSchema from './OpossumOutputFileSchema.json';
import Asm from 'stream-json/Assembler';
import { Parser, parser } from 'stream-json';
import JSZip from 'jszip';

const jsonSchemaValidator = new Validator();
const validationOptions: Options = {
  throwError: true,
};

export async function parseOpossumFile(
  opossumfilePath: string
): Promise<
  ParsedOpossumInputAndOutput | JsonParsingError | InvalidDotOpossumFileError
> {
  let parsedInputData: unknown;
  let parsedOutputData: unknown = null;
  let jsonParsingError: JsonParsingError | null = null;
  let invalidDotOpossumFileError: InvalidDotOpossumFileError | null = null;

  await new Promise<void>((resolve) => {
    fs.readFile(opossumfilePath, (err, data) => {
      if (err) throw err;
      JSZip.loadAsync(data).then(async (zip) => {
        if (!('input.json' in zip.files)) {
          invalidDotOpossumFileError = {
            filesInArchive: Object.keys(zip.files)
              .map((fileName) => `'${fileName}'`)
              .join(', '),
            type: 'invalidDotOpossumFileError',
          };
          resolve();
        } else {
          const promiseInputJson = zip.files['input.json']
            .async('text')
            .then((content) => {
              parsedInputData = parseAndValidateJson(
                content,
                OpossumInputFileSchema
              );
            })
            .catch((err) => {
              jsonParsingError = {
                message: `Error: ${opossumfilePath} is not a valid input file.\n${err}`,
                type: 'jsonParsingError',
              };
            });

          const promiseOutputJson =
            'output.json' in zip.files
              ? zip.files['output.json']
                  .async('text')
                  .then((content) => {
                    parsedOutputData = parseOutputJsonContent(
                      content,
                      opossumfilePath
                    );
                  })
                  .catch((err) => {
                    jsonParsingError = {
                      message: `Error: ${opossumfilePath} is not a valid input file.\n${err}`,
                      type: 'jsonParsingError',
                    };
                  })
              : new Promise<void>((resolve) => resolve());
          await Promise.all([promiseInputJson, promiseOutputJson]);
          resolve();
        }
      });
    });
  });

  return jsonParsingError
    ? jsonParsingError
    : invalidDotOpossumFileError
    ? invalidDotOpossumFileError
    : {
        input: parsedInputData as ParsedOpossumInputFile,
        output: parsedOutputData as ParsedOpossumOutputFile,
      };
}

export function parseInputJsonFile(
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

export function parseOutputJsonFile(
  attributionFilePath: fs.PathLike
): ParsedOpossumOutputFile {
  const content = fs.readFileSync(attributionFilePath, 'utf-8');
  return parseOutputJsonContent(content, attributionFilePath);
}

export function parseOutputJsonContent(
  fileContent: string,
  filePath: fs.PathLike
): ParsedOpossumOutputFile {
  let outputJsonContent;
  try {
    outputJsonContent = parseAndValidateJson(
      fileContent,
      OpossumOutputFileSchema
    );
  } catch (err) {
    throw new Error(
      `Error: ${filePath} is not a valid attribution file.\n${err}`
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
  schema: typeof OpossumInputFileSchema | typeof OpossumOutputFileSchema
): unknown {
  const jsonContent = JSON.parse(content);
  jsonSchemaValidator.validate(jsonContent, schema, validationOptions);
  return jsonContent;
}
