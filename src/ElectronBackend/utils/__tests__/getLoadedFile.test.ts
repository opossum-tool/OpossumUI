// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { LoadedFileFormat } from '../../enums/enums';
import { GlobalBackendState } from '../../types/types';
import {
  getLoadedFilePath,
  getLoadedFileType,
  isFileLoaded,
} from '../getLoadedFile';

describe('getLoadedFilePath', () => {
  it('Finds json file', () => {
    const resourceFilePath = '/some/path.json';
    const attributionFilePath = '/some/other_path.json';
    const globalBackendState: GlobalBackendState = {
      resourceFilePath,
      attributionFilePath,
    };

    const loadedFilePath = getLoadedFilePath(globalBackendState);
    expect(loadedFilePath).toEqual(resourceFilePath);
  });

  it('Finds opossum file', () => {
    const opossumFilePath = '/some/path.opossum';
    const globalBackendState: GlobalBackendState = {
      opossumFilePath,
    };

    const loadedFilePath = getLoadedFilePath(globalBackendState);
    expect(loadedFilePath).toEqual(opossumFilePath);
  });

  it('Returns null if no input file exists', () => {
    const globalBackendState: GlobalBackendState = {};

    const loadedFilePath = getLoadedFilePath(globalBackendState);
    expect(loadedFilePath).toBeNull;
  });
});

describe('isFileLoaded', () => {
  it('Finds json file', () => {
    const resourceFilePath = '/some/path.json';
    const globalBackendState: GlobalBackendState = {
      resourceFilePath,
    };

    expect(isFileLoaded(globalBackendState));
  });

  it('Finds opossum file', () => {
    const opossumFilePath = '/some/path.opossum';
    const globalBackendState: GlobalBackendState = {
      opossumFilePath,
    };

    expect(isFileLoaded(globalBackendState));
  });

  it('Returns false', () => {
    const globalBackendState: GlobalBackendState = {};

    expect(!isFileLoaded(globalBackendState));
  });
});

describe('getLoadedFileType', () => {
  it('Finds json file', () => {
    const resourceFilePath = '/some/path.json';
    const globalBackendState: GlobalBackendState = {
      resourceFilePath,
    };

    const loadedFileType = getLoadedFileType(globalBackendState);
    expect(loadedFileType).toEqual(LoadedFileFormat.Json);
  });

  it('Finds opossum file', () => {
    const opossumFilePath = '/some/path.opossum';
    const globalBackendState: GlobalBackendState = {
      opossumFilePath,
    };

    const loadedFileType = getLoadedFileType(globalBackendState);
    expect(loadedFileType).toEqual(LoadedFileFormat.Opossum);
  });

  it('Throws error if no file exists', () => {
    const globalBackendState: GlobalBackendState = {};

    expect(() => getLoadedFileType(globalBackendState)).toThrow(
      'Tried to get file type when no file is loaded'
    );
  });
});
