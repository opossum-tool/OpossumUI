// SPDX-FileCopyrightText: Tarun Samanta <tarunsamanta77@gmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import path from 'path';

export function getBasePathOfAssets(basePath?: string): string {
  if (basePath) {
    return path.join(basePath, 'public', 'assets');
  }
  return app?.isPackaged
    ? path.join(getAppPath(), 'build', 'assets')
    : path.join(getDevAppRoot(), 'public', 'assets');
}

export function getBasePathOfIcons(basePath?: string): string {
  if (basePath) {
    return path.join(basePath, 'public', 'icons');
  }
  return app?.isPackaged
    ? path.join(getAppPath(), 'build', 'icons')
    : path.join(getDevAppRoot(), 'public', 'icons');
}

export function getPathOfExtraResource(
  ...pathSegments: Array<string>
): string {
  const devRoot = getDevAppRoot();
  return app?.isPackaged
    ? path.join(getPackagedResourcesRoot(), ...pathSegments)
    : path.join(devRoot, ...pathSegments);
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
