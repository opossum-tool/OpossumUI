// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import fs from 'node:fs';
import path from 'node:path';

import type {
  OpossumOutputFile,
  ParsedOpossumInputFile,
  RawFrequentLicense,
} from '../../ElectronBackend/types/types';
import type {
  RawAttributions,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import {
  createSyntheticFileModel,
  type Fixture,
  getSyntheticAttributionId,
  getSyntheticAttributionRecord,
  getSyntheticLinksForResource,
  PERFORMANCE_BULK_LICENSE,
  SYNTHETIC_LICENSE_NAMES,
  type SyntheticAttributionKind,
} from './fixture';
import type { SyntheticFileProfile } from './profiles';
import { iterateSyntheticResources } from './resource-tree';

const PROJECT_ID = 'synthetic-performance-project';
const FILE_CREATION_DATE = '2026-01-01T00:00:00.000Z';

export function getSyntheticFilePath(profile: SyntheticFileProfile): string {
  return path.resolve(
    'example-files',
    'performance_tests',
    `synthetic-${profile.name}.opossum`,
  );
}

function createResources(profile: SyntheticFileProfile): Resources {
  const resources: Resources = {};
  const stack: Array<{ name: string; children: Resources }> = [];

  for (const resource of iterateSyntheticResources(profile)) {
    const components = resource.path.slice(1).split('/');
    let commonLength = 0;
    while (
      commonLength < stack.length &&
      commonLength < components.length - 1 &&
      stack[commonLength].name === components[commonLength]
    ) {
      commonLength += 1;
    }
    stack.length = commonLength;

    const parent = stack.at(-1)?.children ?? resources;
    const name = components.at(-1)!;
    if (resource.isDirectory) {
      const children: Resources = {};
      parent[name] = children;
      stack.push({ name, children });
    } else {
      parent[name] = 1;
    }
  }

  return resources;
}

function createResourceLinks(
  profile: SyntheticFileProfile,
  model: Fixture,
  kind: SyntheticAttributionKind,
): ResourcesToAttributions {
  const linksByResource: ResourcesToAttributions = {};
  for (const resource of iterateSyntheticResources(profile)) {
    const links = getSyntheticLinksForResource(
      resource.ordinal,
      resource.path,
      profile,
      model,
      kind,
    );
    if (links.length > 0) {
      linksByResource[
        resource.isDirectory ? `${resource.path}/` : resource.path
      ] = links;
    }
  }
  return linksByResource;
}

function createBreakpoints(profile: SyntheticFileProfile): Array<string> {
  const breakpoints: Array<string> = [];
  for (const resource of iterateSyntheticResources(profile)) {
    if (!resource.isDirectory) {
      continue;
    }
    if (breakpoints.length >= profile.breakpointCount) {
      break;
    }
    breakpoints.push(`${resource.path}/`);
  }
  return breakpoints;
}

function createAttributions(
  profile: SyntheticFileProfile,
  kind: SyntheticAttributionKind,
): RawAttributions {
  const count =
    kind === 'external'
      ? profile.externalAttributionCount
      : profile.manualAttributionCount;
  const attributions: RawAttributions = {};
  for (let index = 0; index < count; index += 1) {
    const attribution = getSyntheticAttributionRecord(profile, kind, index);
    attributions[attribution.id] = attribution.packageInfo;
  }
  return attributions;
}

function createInput(
  profile: SyntheticFileProfile,
  model: Fixture,
): ParsedOpossumInputFile {
  const frequentLicenses: Array<RawFrequentLicense> =
    SYNTHETIC_LICENSE_NAMES.map((name) => ({
      fullName: name,
      shortName: name,
      defaultText: `${name} license text`,
    }));
  frequentLicenses.push({
    fullName: PERFORMANCE_BULK_LICENSE,
    shortName: PERFORMANCE_BULK_LICENSE,
    defaultText: `${PERFORMANCE_BULK_LICENSE} license text`,
  });

  return {
    metadata: {
      projectId: PROJECT_ID,
      fileCreationDate: FILE_CREATION_DATE,
      projectTitle: 'Synthetic performance fixture',
    },
    resources: createResources(profile),
    config: {
      classifications: {
        '0': 'Permissive',
        '1': 'Notice',
        '2': 'Reciprocal',
        '3': 'Strong copyleft',
        '4': 'Restricted',
      },
    },
    externalAttributions: createAttributions(profile, 'external'),
    resourcesToAttributions: createResourceLinks(profile, model, 'external'),
    frequentLicenses,
    attributionBreakpoints: createBreakpoints(profile),
    externalAttributionSources: {
      SC: { name: 'ScanCode', priority: 100 },
      ORT: { name: 'ORT', priority: 90 },
      CD: { name: 'ClearlyDefined', priority: 80 },
    },
  };
}

function createOutput(
  profile: SyntheticFileProfile,
  model: Fixture,
): OpossumOutputFile {
  const resolvedExternalAttributions: Array<string> = [];
  const denseSignalIds = new Set(
    model.scenarios.denseSignals.signals.map(({ id }) => id),
  );
  for (let index = 0; index < profile.externalAttributionCount; index += 1) {
    const id = getSyntheticAttributionId('external', index);
    if (index % 10 === 0 && !denseSignalIds.has(id)) {
      resolvedExternalAttributions.push(id);
    }
  }

  return {
    metadata: {
      projectId: PROJECT_ID,
      fileCreationDate: FILE_CREATION_DATE,
    },
    manualAttributions: createAttributions(profile, 'manual'),
    resourcesToAttributions: createResourceLinks(profile, model, 'manual'),
    resolvedExternalAttributions,
  };
}

export async function writeSyntheticOpossumFile({
  outputPath,
  profile,
}: {
  outputPath: string;
  profile: SyntheticFileProfile;
}): Promise<void> {
  const model = createSyntheticFileModel(profile);
  const absoluteOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });

  const temporaryDirectory = fs.mkdtempSync(
    path.join(path.dirname(absoluteOutputPath), '.synthetic-'),
  );
  const temporaryArchivePath = path.join(
    temporaryDirectory,
    `${path.basename(absoluteOutputPath)}.tmp`,
  );

  try {
    await writeOpossumFile({
      input: createInput(profile, model),
      output: createOutput(profile, model),
      path: temporaryArchivePath,
    });

    const backupPath = path.join(
      temporaryDirectory,
      `${path.basename(absoluteOutputPath)}.backup`,
    );
    if (fs.existsSync(absoluteOutputPath)) {
      fs.rmSync(backupPath, { force: true });
      fs.renameSync(absoluteOutputPath, backupPath);
    }
    try {
      fs.renameSync(temporaryArchivePath, absoluteOutputPath);
    } catch (error) {
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, absoluteOutputPath);
      }
      throw error;
    }
    fs.rmSync(backupPath, { force: true });
  } finally {
    if (fs.existsSync(temporaryArchivePath)) {
      fs.rmSync(temporaryArchivePath, { force: true });
    }
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
