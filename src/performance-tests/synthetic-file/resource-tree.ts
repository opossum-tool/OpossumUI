// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const PACKAGE_NAME_WIDTH = 4;
const MODULE_NAME_WIDTH = 4;
const FILE_NAME_WIDTH = 6;

export interface SyntheticPackageLayout {
  readonly packageResourceName: string;
  readonly packageResourcePath: string;
  readonly firstModuleResourceName: string;
  readonly firstModuleResourcePath: string;
  readonly firstFileResourceName: string;
  readonly firstFileResourcePath: string;
}

export interface SyntheticResource {
  readonly ordinal: number;
  readonly path: string;
  readonly isDirectory: boolean;
}

function getSyntheticFileCount(profile: {
  resourceCount: number;
  directoryCount: number;
}): number {
  return profile.resourceCount - profile.directoryCount;
}

function getSyntheticRegularDirectoryCount(profile: {
  directoryCount: number;
  packageCount: number;
  deepDirectoryCount: number;
}): number {
  return (
    profile.directoryCount - profile.packageCount - profile.deepDirectoryCount
  );
}

export function getSyntheticPackageDirectoryCount(
  profile: {
    directoryCount: number;
    packageCount: number;
    deepDirectoryCount: number;
  },
  packageIndex: number,
): number {
  const regularDirectoryCount = getSyntheticRegularDirectoryCount(profile);
  return (
    Math.floor(regularDirectoryCount / profile.packageCount) +
    (packageIndex < regularDirectoryCount % profile.packageCount ? 1 : 0)
  );
}

export function* iterateSyntheticResources(profile: {
  resourceCount: number;
  directoryCount: number;
  packageCount: number;
  deepDirectoryCount: number;
}): Generator<SyntheticResource> {
  const fileCount = getSyntheticFileCount(profile);
  const regularDirectoryCount = getSyntheticRegularDirectoryCount(profile);
  if (regularDirectoryCount < 1 || fileCount < 1 || profile.packageCount < 1) {
    throw new Error('Invalid synthetic file profile');
  }

  let ordinal = 0;
  let fileIndex = 0;
  let regularDirectoriesEmitted = 0;
  const emit = (
    resource: Omit<SyntheticResource, 'ordinal'>,
  ): SyntheticResource => ({
    ...resource,
    ordinal: ordinal++,
  });

  for (
    let packageIndex = 0;
    packageIndex < profile.packageCount;
    packageIndex += 1
  ) {
    const packagePath = `/${getSyntheticPackageName(packageIndex)}`;
    yield emit({ path: packagePath, isDirectory: true });

    if (packageIndex === 0) {
      let deepPath = `${packagePath}/deep`;
      for (let depth = 0; depth < profile.deepDirectoryCount - 1; depth += 1) {
        yield emit({ path: deepPath, isDirectory: true });
        deepPath = `${deepPath}/level-${depth.toString().padStart(2, '0')}`;
      }
    }

    const packageDirectoryCount = getSyntheticPackageDirectoryCount(
      profile,
      packageIndex,
    );
    for (
      let localIndex = 0;
      localIndex < packageDirectoryCount;
      localIndex += 1
    ) {
      const directoryPath = `${packagePath}/${getSyntheticModuleName(localIndex)}`;
      yield emit({ path: directoryPath, isDirectory: true });
      if (regularDirectoriesEmitted < fileCount) {
        yield emit({
          path: `${directoryPath}/${getSyntheticFileName(fileIndex)}`,
          isDirectory: false,
        });
        fileIndex += 1;
      }
      regularDirectoriesEmitted += 1;
    }
  }

  if (
    regularDirectoriesEmitted !== regularDirectoryCount ||
    fileIndex !== fileCount
  ) {
    throw new Error('Synthetic resource generator produced incorrect counts');
  }
}

export function getSyntheticPackageName(index: number): string {
  return `package-${index.toString().padStart(PACKAGE_NAME_WIDTH, '0')}`;
}

export function getSyntheticModuleName(index: number): string {
  return `module-${index.toString().padStart(MODULE_NAME_WIDTH, '0')}`;
}

export function getSyntheticFileName(index: number): string {
  return `file-${index.toString().padStart(FILE_NAME_WIDTH, '0')}.ts`;
}

export function getSyntheticPackageLayout(
  packageIndex: number,
): SyntheticPackageLayout {
  const packageResourceName = getSyntheticPackageName(packageIndex);
  const firstModuleResourceName = getSyntheticModuleName(0);
  const packageResourcePath = `/${packageResourceName}`;
  const firstModuleResourcePath = `${packageResourcePath}/${firstModuleResourceName}`;
  const firstFileResourceName = getSyntheticFileName(0);

  return {
    packageResourceName,
    packageResourcePath,
    firstModuleResourceName,
    firstModuleResourcePath,
    firstFileResourceName,
    firstFileResourcePath: `${firstModuleResourcePath}/${firstFileResourceName}`,
  } as const;
}
