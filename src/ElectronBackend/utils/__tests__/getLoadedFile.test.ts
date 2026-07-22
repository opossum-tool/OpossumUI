// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { GlobalBackendState } from '../../types/types';
import { getLoadedFilePath, isFileLoaded } from '../getLoadedFile';

describe('getLoadedFilePath', () => {
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
    expect(loadedFilePath).toBeNull();
  });
});

describe('isFileLoaded', () => {
  it('Finds opossum file', () => {
    const opossumFilePath = '/some/path.opossum';
    const globalBackendState: GlobalBackendState = {
      opossumFilePath,
    };

    expect(isFileLoaded(globalBackendState)).toBe(true);
  });

  it('Returns false', () => {
    const globalBackendState: GlobalBackendState = {};

    expect(isFileLoaded(globalBackendState)).toBe(false);
  });
});
