// SPDX-FileCopyrightText: Tarun Samanta <tarunsamanta77@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import path from 'path';

export function getBasePathOfAssets(): string {
  return app?.isPackaged
    ? path.join(getAppPath(), 'build', 'assets')
    : path.join(getDevAppRoot(), 'public', 'assets');
}

export function getBasePathOfIcons(): string {
  return app?.isPackaged
    ? path.join(getAppPath(), 'build', 'icons')
    : path.join(getDevAppRoot(), 'public', 'icons');
}

export function getPathOfExtraResource(...pathSegments: Array<string>): string {
  return app?.isPackaged
    ? path.join(getPackagedResourcesRoot(), ...pathSegments)
    : path.join(getDevAppRoot(), ...pathSegments);
}

function getAppPath(): string {
  return app?.getAppPath?.() ?? process.cwd();
}

function getPackagedResourcesRoot(): string {
  return process.resourcesPath ?? path.dirname(getAppPath());
}

function getDevAppRoot(): string {
  const appPath = getAppPath();

  return appPath.endsWith(path.join('build', 'ElectronBackend'))
    ? path.join(appPath, '..', '..')
    : appPath;
}
