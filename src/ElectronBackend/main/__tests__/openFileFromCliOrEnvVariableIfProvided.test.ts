// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindow } from 'electron';
import fs from 'fs';
import { cloneDeep } from 'lodash-es';
import path from 'path';

import { faker } from '../../../testing/Faker';
import { openFileFromCliOrEnvVariableIfProvided } from '../openFileFromCliOrEnvVariableIfProvided';
import {
  queueMacOsOpenFile,
  resetMacOsOpenFileHandlingForTests,
} from '../openFileRequests';

const mockHandleOpeningFile = vi.fn();
vi.mock('../listeners', () => ({
  handleOpeningFile: (...args: never): void => mockHandleOpeningFile(args),
}));

describe('openFileFromCli', () => {
  let oldProcessArgv: Array<string>;

  beforeEach(() => {
    mockHandleOpeningFile.mockClear();
    resetMacOsOpenFileHandlingForTests();
  });

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

      const updateMenu = vi.fn();
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

      const updateMenu = vi.fn();
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
    mockHandleOpeningFile.mockClear();
    resetMacOsOpenFileHandlingForTests();
  });

  afterAll(() => {
    process.env = oldEnvVariables;
    process.argv = oldProcessArgv;
  });

  it('opens a file if env variable provided', async () => {
    const inputFileName = '/path/inputFile.opossum';
    process.env.OPOSSUM_FILE = inputFileName;
    const updateMenu = vi.fn();
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
      vi.fn(),
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

    const updateMenu = vi.fn();
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

  it('opens a queued macOS startup file before env variables', async () => {
    const inputFileName = '/path/queuedFile.opossum';
    queueMacOsOpenFile(inputFileName);
    process.env.OPOSSUM_FILE = '/path/envFile.opossum';

    const updateMenu = vi.fn();
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

describe('getReopenFilePath option', () => {
  beforeEach(() => {
    process.argv = ['app'];
    mockHandleOpeningFile.mockClear();
    resetMacOsOpenFileHandlingForTests();
  });

  it('reopens the provided file if no other file was provided', async () => {
    const lastFileName = faker.outputPath(`${faker.string.uuid()}.opossum`);
    fs.mkdirSync(path.dirname(lastFileName), { recursive: true });
    fs.writeFileSync(lastFileName, 'opossum');

    const updateMenu = vi.fn();
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      updateMenu,
      { getReopenFilePath: () => lastFileName },
    );

    expect(mockHandleOpeningFile).toHaveBeenCalledWith([
      'mockBrowserWindow',
      lastFileName,
      updateMenu,
    ]);
  });

  it('prefers a CLI provided file over the reopen file', async () => {
    const reopenFileName = '/path/lastFile.opossum';
    const inputFileName = 'path/to/file/inputfile.opossum';
    process.argv.push(inputFileName);

    const updateMenu = vi.fn();
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      updateMenu,
      { getReopenFilePath: () => reopenFileName },
    );

    expect(mockHandleOpeningFile).toHaveBeenCalledWith([
      'mockBrowserWindow',
      inputFileName,
      updateMenu,
    ]);
  });

  it('does not reopen a non-existing file', async () => {
    const updateMenu = vi.fn();
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      updateMenu,
      { getReopenFilePath: () => '/path/lastFile.opossum' },
    );

    expect(mockHandleOpeningFile).not.toHaveBeenCalled();
  });

  it('does not reopen when the option is not set', async () => {
    const updateMenu = vi.fn();
    await openFileFromCliOrEnvVariableIfProvided(
      'mockBrowserWindow' as unknown as BrowserWindow,
      updateMenu,
    );

    expect(mockHandleOpeningFile).not.toHaveBeenCalled();
  });
});
