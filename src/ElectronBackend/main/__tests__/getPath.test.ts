// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

import {
  getBasePathOfAssets,
  getBasePathOfIcons,
  getPathOfExtraResource,
} from '../getPath';

const electronMock = vi.hoisted(() => ({
  app: {
    getAppPath: vi.fn(() => '/repo'),
    isPackaged: false,
  },
}));

vi.mock('electron', () => electronMock);

describe('getPath helpers', () => {
  beforeEach(() => {
    electronMock.app.getAppPath.mockReturnValue('/repo');
    electronMock.app.isPackaged = false;
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: '/resources',
    });
  });

  it('uses the app path for development assets, icons, and extra resources', () => {
    expect(getBasePathOfAssets()).toBe(path.join('/repo', 'public', 'assets'));
    expect(getBasePathOfIcons()).toBe(path.join('/repo', 'public', 'icons'));
    expect(getPathOfExtraResource('notices', 'notices.html')).toBe(
      path.join('/repo', 'notices', 'notices.html'),
    );
  });

  it('resolves the repo root when development starts from build/ElectronBackend', () => {
    electronMock.app.getAppPath.mockReturnValue('/repo/build/ElectronBackend');

    expect(getBasePathOfAssets()).toBe(path.join('/repo', 'public', 'assets'));
    expect(getBasePathOfIcons()).toBe(path.join('/repo', 'public', 'icons'));
    expect(getPathOfExtraResource('bin', 'opossum-file-cli')).toBe(
      path.join('/repo', 'bin', 'opossum-file-cli'),
    );
  });

  it('uses bundled build paths for packaged assets and resourcesPath for extra resources', () => {
    electronMock.app.isPackaged = true;
    electronMock.app.getAppPath.mockReturnValue('/packaged/app.asar');

    expect(getBasePathOfAssets()).toBe(
      path.join('/packaged/app.asar', 'build', 'assets'),
    );
    expect(getBasePathOfIcons()).toBe(
      path.join('/packaged/app.asar', 'build', 'icons'),
    );
    expect(getPathOfExtraResource('bin', 'opossum-file-cli')).toBe(
      path.join('/resources', 'bin', 'opossum-file-cli'),
    );
  });

  it('falls back to the packaged app parent when resourcesPath is unavailable', () => {
    electronMock.app.isPackaged = true;
    electronMock.app.getAppPath.mockReturnValue('/packaged/resources/app.asar');
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: undefined,
    });

    expect(getPathOfExtraResource('bin', 'opossum-file-cli')).toBe(
      path.join('/packaged', 'resources', 'bin', 'opossum-file-cli'),
    );
  });
});
