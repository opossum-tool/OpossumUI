// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
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
import JSZip from 'jszip';
import log from 'electron-log';

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

export function writeZip(fileData: string): void {
  const filePath =
    'C:\\Users\\Vasily\\Repositories\\OpossumUI_fork\\example-files\\out.zip';
  const writeStream = fs.createWriteStream(filePath);
  const zip = new JSZip();
  zip.file('input.json', fileData);
  zip.file('output.json', fileData);

  log.info('Testing JSZip');

  zip
    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(writeStream)
    .on('end', () => {
      log.info('zip file created!');
      process.exit();
    });
  log.info('end of zip function');
}

export function readZip(): void {
  const filePath =
    'C:\\Users\\Vasily\\Repositories\\OpossumUI_fork\\example-files\\out.zip';
  log.info('reading zip');
  fs.readFile(filePath, function (err, data) {
    if (err) throw err;
    JSZip.loadAsync(data).then(function (zip) {
      log.info(zip);
      //zip.files['input.json'].async("text").then(function (content) {
      //log.info(content);
      //});
    });
  });

  log.info('succesfully finished reading zip');
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

function parseJson(filePath: fs.PathLike): unknown {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    throw new Error(`Error while reading the JSON file ${filePath}.`);
  }
}
