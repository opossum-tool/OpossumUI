// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import { cloneDeep } from 'lodash';

import { openFileFromCliOrEnvVariableIfProvided } from '../openFileFromCliOrEnvVariableIfProvided';

const mockHandleOpeningFile = jest.fn();
jest.mock('../listeners', () => ({
  handleOpeningFile: (...args: never): void => mockHandleOpeningFile(args),
}));

describe('openFileFromCli', () => {
  let oldProcessArgv: Array<string>;

  beforeAll(() => {
    oldProcessArgv = process.argv;
  });

  afterAll(() => {
    process.argv = oldProcessArgv;
  });

  it.each`
    inputFileName          | extraParameter
    ${'inputFile.opossum'} | ${null}
    ${'inputFile.opossum'} | ${'--dev'}
  `(
    'calls openFile with input file $inputFileName and extraParameter $extraParameter',
    async ({ inputFileName, extraParameter }) => {
      const oldProcessArgv = process.argv;
      process.argv = ['app'];
      if (extraParameter) {
        process.argv.push(extraParameter);
      }
      process.argv.push(inputFileName);

      const updateMenu = jest.fn();
      await openFileFromCliOrEnvVariableIfProvided(
        'mockBrowserWindow' as unknown as BrowserWindow,
        updateMenu,
      );
      expect(mockHandleOpeningFile).toHaveBeenCalledWith([
        'mockBrowserWindow',
        inputFileName,
        updateMenu,
      ]);

      process.argv = oldProcessArgv;
    },
  );

  it.each`
    inputFileName
    ${'inputFile.txt'}
    ${null}
  `(
    'does not call openFile with input file $inputFileName',
    async ({ inputFileName }) => {
      const oldProcessArgv = process.argv;
      process.argv = ['app'];
      if (inputFileName) {
        process.argv.push(inputFileName);
      }

      const updateMenu = jest.fn();
      await openFileFromCliOrEnvVariableIfProvided(
        'mockBrowserWindow' as unknown as BrowserWindow,
        updateMenu,
      );
      expect(mockHandleOpeningFile).not.toHaveBeenCalled();

      process.argv = oldProcessArgv;
    },
  );
});

describe('openFileFromEnvVariable', () => {
  const oldEnvVariables = process.env;
  const oldProcessArgv = process.argv;

  beforeEach(() => {
    process.env = cloneDeep(oldEnvVariables);
    process.argv = cloneDeep(oldProcessArgv);
  });

  afterAll(() => {
    process.env = oldEnvVariables;
    process.argv = oldProcessArgv;
  });

  it('opens a file if env variable provided', async () => {
    const inputFileName = '/path/inputFile.opossum';
    process.env.OPOSSUM_FILE = inputFileName;
    const updateMenu = jest.fn();
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      updateMenu,
    );
    expect(mockHandleOpeningFile).toHaveBeenCalledWith([
      'mockBrowserWindow',
      inputFileName,
      updateMenu,
    ]);
  });

  it('does not call openFile if env is not set', async () => {
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      jest.fn(),
    );
    expect(mockHandleOpeningFile).not.toHaveBeenCalledWith([
      'mockBrowserWindow',
    ]);
  });

  it('does open a file from CLI argument if argument and env variable provided', async () => {
    process.env.OPOSSUM_FILE = '/path/to/file';
    const inputFileName = 'path/to/file/inputfile.opossum';
    process.argv = ['app'];
    process.argv.push(inputFileName);

    const updateMenu = jest.fn();
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      updateMenu,
    );

    expect(mockHandleOpeningFile).toHaveBeenCalledWith([
      'mockBrowserWindow',
      inputFileName,
      updateMenu,
    ]);
  });
});
