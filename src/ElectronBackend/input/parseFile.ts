// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import zlib from 'zlib';
import { Options, Validator } from 'jsonschema';
import {
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
import { getMessageBoxForInvalidDotOpossumFileError } from '../errorHandling/errorHandling';
import { BrowserWindow } from 'electron';
import { setLoadingState } from '../main/listeners';

const jsonSchemaValidator = new Validator();
const validationOptions: Options = {
  throwError: true,
};

export async function parseOpossumFile(
  opossumfilePath: string,
  mainWindow: BrowserWindow
): Promise<ParsedOpossumInputAndOutput | JsonParsingError> {
  let parsedInputData: unknown;
  let parsedOutputData: unknown = null;
  let error: string | null = null;

  await new Promise<void>((resolve) => {
    fs.readFile(opossumfilePath, (err, data) => {
      if (err) throw err;
      JSZip.loadAsync(data).then(async (zip) => {
        if (!('input.json' in zip.files)) {
          setLoadingState(mainWindow.webContents, false);
          await getMessageBoxForInvalidDotOpossumFileError(
            Object.keys(zip.files)
              .map((fileName) => `'${fileName}'`)
              .join(', '),
            mainWindow
          );
        }

        if ('output.json' in zip.files) {
          await zip.files['output.json'].async('text').then((content) => {
            parsedOutputData = parseOutputJsonContent(content, opossumfilePath);
          });
        }

        zip.files['input.json']
          .async('text')
          .then((content) => {
            parsedInputData = parseAndValidateJson(
              content,
              OpossumInputFileSchema
            );
          })
          .catch((err) => {
            error = err;
          })
          .then(resolve);
      });
    });
  });

  if (error) {
    return {
      message: `Error: ${opossumfilePath} is not a valid input file.\n${error}`,
      type: 'jsonParsingError',
    };
  }
  return {
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
