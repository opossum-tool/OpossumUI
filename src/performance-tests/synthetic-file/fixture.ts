// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { RawPackageInfo } from '../../shared/shared-types';
import type { SyntheticFileProfile } from './profiles';
import {
  getSyntheticFileName,
  getSyntheticModuleName,
  getSyntheticPackageDirectoryCount,
  getSyntheticPackageLayout,
  getSyntheticPackageName,
  iterateSyntheticResources,
} from './resource-tree';

export const SYNTHETIC_LICENSE_NAMES = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'LGPL-2.1-only',
  'ISC',
  'MPL-2.0',
  'EPL-2.0',
  'CC0-1.0',
  'LicenseRef-Custom',
] as const;
const SYNTHETIC_CLASSIFICATION_NAMES = [
  'Permissive',
  'Notice',
  'Reciprocal',
  'Strong copyleft',
  'Restricted',
] as const;

const SOURCE_NAMES = ['ScanCode', 'ORT', 'ClearlyDefined', 'Manual import'];
const SYNTHETIC_SCENARIO_BLUEPRINT = {
  externalAttributions: {
    expandAndSelectCompanion: 0,
    expandAndSelectSignal: 1,
    signalSearchMatch: 2,
    signalSearchNonMatch: 3,
    frequentSignal: 4,
    rareSignal: 5,
    linkSignal: 6,
  },
  manualAttributions: {
    default: 0,
    attributionFilterMatch: 1,
    attributionFilterNonMatch: 2,
    report: 3,
    edit: 4,
    expandAndSelect: 5,
  },
  resources: {
    link: 0,
    unreviewed: 1,
    reviewed: 2,
    edit: 3,
    signalSearch: 4,
    report: 5,
    signalSort: 6,
  },
  packages: {
    expandAndSelect: 0,
    resourceSearch: 1,
  },
  expandAndSelectResourceOrdinal: 1,
} as const;
const PERFORMANCE_ATTRIBUTION_FILTER_LICENSE = 'LicenseRef-Performance-Filter';
export const PERFORMANCE_BULK_LICENSE = 'LicenseRef-Performance-Bulk';
const EXTRA_EARLY_LINK_COUNT = 50;

export type SyntheticAttributionKind = 'external' | 'manual';

export interface SyntheticAttributionRecord {
  readonly id: string;
  readonly index: number;
  readonly packageInfo: RawPackageInfo;
}

export interface SyntheticResourceAnchor {
  readonly resourcePath: string;
  readonly resourceName: string;
  readonly resourceNames: readonly [string, string, string];
}

interface ExpandAndSelectAnchors {
  readonly targetResourceName: string;
  readonly targetResourcePath: string;
  readonly childResourceName: string;
  readonly childResourcePath: string;
  readonly firstFileResourceName: string;
  readonly firstFileResourcePath: string;
}

interface ExpandAndSelectScenario {
  readonly anchors: ExpandAndSelectAnchors;
  readonly resourceOrdinal: number;
  readonly linkedAttributions: {
    readonly external: readonly [
      SyntheticAttributionRecord,
      SyntheticAttributionRecord,
    ];
    readonly manual: readonly [SyntheticAttributionRecord];
  };
  readonly expected: {
    readonly attribution: SyntheticAttributionRecord;
    readonly signal: SyntheticAttributionRecord;
  };
}

interface ResourceSearchAnchors {
  readonly targetResourceName: string;
  readonly targetResourcePath: string;
  readonly uniqueSearchPath: string;
}

interface ResourceSearchScenario {
  readonly anchors: ResourceSearchAnchors;
}

interface ResourceFilterScenario {
  readonly unreviewedResource: SyntheticResourceAnchor;
  readonly reviewedResource: SyntheticResourceAnchor;
}

interface AttributionFilterScenario {
  readonly resource: SyntheticResourceAnchor;
  readonly licenseName: string;
  readonly matchingAttribution: SyntheticAttributionRecord;
  readonly nonMatchingAttribution: SyntheticAttributionRecord;
}

interface SignalSearchScenario {
  readonly resource: SyntheticResourceAnchor;
  readonly matchingSignal: SyntheticAttributionRecord;
  readonly nonMatchingSignal: SyntheticAttributionRecord;
}

interface SignalSortScenario {
  readonly resource: SyntheticResourceAnchor;
  readonly frequentSignal: SyntheticAttributionRecord;
  readonly rareSignal: SyntheticAttributionRecord;
}

interface ProjectStatisticsScenario {
  readonly classification: string;
  readonly criticality: 'Highly Critical Signals' | 'Medium Critical Signals';
}

interface MutationScenario {
  readonly resource: SyntheticResourceAnchor;
  readonly attribution: SyntheticAttributionRecord;
}

interface DenseSignalScenario {
  readonly resource: SyntheticResourceAnchor;
  readonly signals: readonly SyntheticAttributionRecord[];
  readonly bulkSignals: readonly SyntheticAttributionRecord[];
  readonly frequentSignal: SyntheticAttributionRecord;
  readonly rareSignal: SyntheticAttributionRecord;
  readonly searchSignal: SyntheticAttributionRecord;
  readonly licenseName: string;
}

interface HighFanoutScenario {
  readonly external: SyntheticAttributionRecord;
  readonly manual: SyntheticAttributionRecord;
  readonly resource: SyntheticResourceAnchor;
  readonly writableResource: SyntheticResourceAnchor;
  readonly readonlyResource: SyntheticResourceAnchor;
}

interface SplitScenario {
  readonly firstPartition: readonly string[];
  readonly secondPartition: readonly string[];
  readonly sourceResource: SyntheticResourceAnchor;
  readonly firstPartitionResource: SyntheticResourceAnchor;
  readonly secondPartitionResource: SyntheticResourceAnchor;
  readonly mixedWritableResource: SyntheticResourceAnchor;
  readonly mixedReadonlyResource: SyntheticResourceAnchor;
}

type SyntheticLinkOverrides = ReadonlyMap<
  string,
  Readonly<Partial<Record<SyntheticAttributionKind, readonly string[]>>>
>;

type SyntheticLinks = Partial<
  Record<SyntheticAttributionKind, readonly string[]>
>;

export interface Fixture {
  readonly profile: SyntheticFileProfile;
  readonly linkOverrides: SyntheticLinkOverrides;
  readonly scenarios: {
    readonly expandAndSelect: ExpandAndSelectScenario;
    readonly resourceSearch: ResourceSearchScenario;
    readonly resourceFilter: ResourceFilterScenario;
    readonly attributionFilter: AttributionFilterScenario;
    readonly signalSearch: SignalSearchScenario;
    readonly signalSort: SignalSortScenario;
    readonly projectStatistics: ProjectStatisticsScenario;
    readonly report: { readonly attribution: SyntheticAttributionRecord };
    readonly link: MutationScenario;
    readonly edit: MutationScenario;
    readonly denseSignals: DenseSignalScenario;
    readonly highFanout: HighFanoutScenario;
    readonly split: SplitScenario;
  };
}

function syntheticHash(seed: number, value: number): number {
  let result = (seed ^ value) >>> 0;
  result = Math.imul(result ^ (result >>> 16), 2246822507);
  result = Math.imul(result ^ (result >>> 13), 3266489909);
  return (result ^ (result >>> 16)) >>> 0;
}

export function getSyntheticAttributionId(
  kind: SyntheticAttributionKind,
  index: number,
): string {
  const hex = index.toString(16).padStart(12, '0');
  return `${kind === 'external' ? 'e' : 'm'}0000000-0000-4000-8000-${hex}`;
}

function getSyntheticFileAnchor(
  packageIndex: number,
  index: number,
): SyntheticResourceAnchor {
  const layout = getSyntheticPackageLayout(packageIndex);
  const moduleName = getSyntheticModuleName(index);
  const resourceName = getSyntheticFileName(index);
  return {
    resourcePath: `${layout.packageResourcePath}/${moduleName}/${resourceName}`,
    resourceName,
    resourceNames: [layout.packageResourceName, moduleName, resourceName],
  };
}

function getSyntheticPackageFileAnchor(
  profile: SyntheticFileProfile,
  packageIndex: number,
  moduleIndex = 0,
): SyntheticResourceAnchor {
  let fileIndex = 0;
  for (let index = 0; index < packageIndex; index += 1) {
    fileIndex += getSyntheticPackageDirectoryCount(profile, index);
  }
  fileIndex += moduleIndex;
  const layout = getSyntheticPackageLayout(packageIndex);
  const moduleName = getSyntheticModuleName(moduleIndex);
  const resourceName = getSyntheticFileName(fileIndex);
  return {
    resourcePath: `${layout.packageResourcePath}/${moduleName}/${resourceName}`,
    resourceName,
    resourceNames: [layout.packageResourceName, moduleName, resourceName],
  };
}

function getDenseSignalResourceAnchor(
  profile: SyntheticFileProfile,
  reservedPaths: ReadonlySet<string>,
): SyntheticResourceAnchor {
  const packagePath = `${getSyntheticPackageLayout(0).packageResourcePath}/`;
  for (const resource of iterateSyntheticResources(profile)) {
    if (
      resource.ordinal >= EXTRA_EARLY_LINK_COUNT &&
      !resource.isDirectory &&
      resource.path.startsWith(packagePath) &&
      !reservedPaths.has(resource.path)
    ) {
      const pathSegments = resource.path.slice(1).split('/') as [
        string,
        string,
        string,
      ];
      return {
        resourcePath: resource.path,
        resourceName: pathSegments[2],
        resourceNames: pathSegments,
      };
    }
  }
  throw new Error('Unable to find a dense signal resource anchor');
}

function getSyntheticPackageInfo(
  profile: SyntheticFileProfile,
  index: number,
  kind: SyntheticAttributionKind,
): RawPackageInfo {
  const external = kind === 'external';
  const denseSignalStart =
    profile.externalAttributionCount - profile.denseSignalCount;
  const isDenseSignal =
    external &&
    index >= denseSignalStart &&
    index < denseSignalStart + profile.denseSignalCount;
  const isBulkSignal =
    isDenseSignal &&
    index > denseSignalStart &&
    index <= denseSignalStart + profile.bulkSignalCount;
  const isHighFanout =
    index ===
    (external
      ? profile.externalAttributionCount - profile.denseSignalCount
      : profile.manualAttributionCount - 1);
  const uniquePerformanceAttribution =
    !external &&
    index ===
      SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.attributionFilterMatch;
  const performanceSignalIndices = Object.values(
    SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions,
  ).filter(
    (attributionIndex) =>
      attributionIndex !==
      SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions
        .expandAndSelectCompanion,
  );
  const uniquePerformanceSignal =
    external &&
    (performanceSignalIndices.some(
      (attributionIndex) => attributionIndex === index,
    ) ||
      isDenseSignal ||
      isHighFanout);
  const identityIndex =
    external && !uniquePerformanceSignal && index < 100
      ? index - (index % 2)
      : index;
  const licenseName = isBulkSignal
    ? PERFORMANCE_BULK_LICENSE
    : uniquePerformanceAttribution
      ? PERFORMANCE_ATTRIBUTION_FILTER_LICENSE
      : SYNTHETIC_LICENSE_NAMES[identityIndex % SYNTHETIC_LICENSE_NAMES.length];
  const info: RawPackageInfo = {
    packageName: isDenseSignal
      ? `performance-dense-signal-${(index - denseSignalStart)
          .toString()
          .padStart(5, '0')}`
      : isHighFanout
        ? `performance-high-fanout-${kind}`
        : uniquePerformanceAttribution
          ? 'performance-unique-attribution'
          : uniquePerformanceSignal
            ? `performance-${
                index ===
                SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions
                  .expandAndSelectSignal
                  ? 'unique-signal'
                  : `signal-${index}`
              }`
            : `package-${(identityIndex % 500).toString().padStart(3, '0')}`,
    packageVersion: `1.${identityIndex % 100}.0`,
    packageNamespace: `synthetic-${identityIndex % 20}`,
    packageType: ['npm', 'maven', 'pypi', 'cargo'][identityIndex % 4],
    licenseName,
    url: uniquePerformanceSignal
      ? `https://example.invalid/performance-signal-${index}`
      : `https://example.invalid/packages/${identityIndex}`,
    copyright: `Copyright (c) Synthetic package ${identityIndex}`,
    attributionConfidence: 20 + (identityIndex % 61),
    classification: identityIndex % 5,
    criticality:
      identityIndex % 17 === 0
        ? 'high'
        : identityIndex % 5 === 0
          ? 'medium'
          : undefined,
    firstParty: identityIndex % 19 === 0,
    excludeFromNotice: identityIndex % 23 === 0,
    followUp: identityIndex % 29 === 0 ? 'FOLLOW_UP' : undefined,
    preferred: identityIndex % 31 === 0,
    wasPreferred: identityIndex % 37 === 0,
    comment:
      identityIndex % 11 === 0
        ? `Synthetic comment ${identityIndex}`
        : undefined,
    source: external
      ? {
          name: SOURCE_NAMES[identityIndex % SOURCE_NAMES.length],
          documentConfidence: 50 + (identityIndex % 51),
        }
      : undefined,
  };

  if (external) {
    info.originIds = [`origin-${profile.seed}-${identityIndex % 1000}`];
    info.preSelected = index % 20 === 0;
  } else {
    info.needsReview = index % 10 === 0;
    info.preSelected = index === 0;
  }

  return info;
}

export function getSyntheticAttributionRecord(
  profile: SyntheticFileProfile,
  kind: SyntheticAttributionKind,
  index: number,
): SyntheticAttributionRecord {
  return {
    id: getSyntheticAttributionId(kind, index),
    index,
    packageInfo: getSyntheticPackageInfo(profile, index, kind),
  };
}

export function createSyntheticFileModel(
  profile: SyntheticFileProfile,
): Fixture {
  if (
    profile.externalAttributionCount <=
      Math.max(
        ...Object.values(SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions),
      ) ||
    profile.manualAttributionCount <=
      Math.max(
        ...Object.values(SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions),
      )
  ) {
    throw new Error(
      `Profile ${profile.name} cannot satisfy the synthetic scenarios`,
    );
  }

  const external = [
    getSyntheticAttributionRecord(
      profile,
      'external',
      SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions
        .expandAndSelectCompanion,
    ),
    getSyntheticAttributionRecord(
      profile,
      'external',
      SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions.expandAndSelectSignal,
    ),
  ] as const;
  const manual = [
    getSyntheticAttributionRecord(
      profile,
      'manual',
      SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.expandAndSelect,
    ),
  ] as const;
  const defaultManual = getSyntheticAttributionRecord(
    profile,
    'manual',
    SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.default,
  );
  const attributionFilterMatch = getSyntheticAttributionRecord(
    profile,
    'manual',
    SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.attributionFilterMatch,
  );
  const attributionFilterNonMatch = getSyntheticAttributionRecord(
    profile,
    'manual',
    SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.attributionFilterNonMatch,
  );
  const signalSearchMatch = getSyntheticAttributionRecord(
    profile,
    'external',
    SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions.signalSearchMatch,
  );
  const signalSearchNonMatch = getSyntheticAttributionRecord(
    profile,
    'external',
    SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions.signalSearchNonMatch,
  );
  const frequentSignal = getSyntheticAttributionRecord(
    profile,
    'external',
    SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions.frequentSignal,
  );
  const rareSignal = getSyntheticAttributionRecord(
    profile,
    'external',
    SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions.rareSignal,
  );
  const reportAttribution = getSyntheticAttributionRecord(
    profile,
    'manual',
    SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.report,
  );
  const linkAttribution = getSyntheticAttributionRecord(
    profile,
    'external',
    SYNTHETIC_SCENARIO_BLUEPRINT.externalAttributions.linkSignal,
  );
  const editAttribution = getSyntheticAttributionRecord(
    profile,
    'manual',
    SYNTHETIC_SCENARIO_BLUEPRINT.manualAttributions.edit,
  );
  const expandAndSelectLayout = getSyntheticPackageLayout(
    SYNTHETIC_SCENARIO_BLUEPRINT.packages.expandAndSelect,
  );
  const resourceSearchLayout = getSyntheticPackageLayout(
    SYNTHETIC_SCENARIO_BLUEPRINT.packages.resourceSearch,
  );
  const packageZeroDirectoryCount = getSyntheticPackageDirectoryCount(
    profile,
    SYNTHETIC_SCENARIO_BLUEPRINT.packages.expandAndSelect,
  );
  const resourceSearchFilePath = `${resourceSearchLayout.firstModuleResourcePath}/${getSyntheticFileName(packageZeroDirectoryCount)}`;
  const linkOverrides = new Map<string, SyntheticLinks>();
  const registerLinkedAnchor = (
    index: number,
    links: SyntheticLinks,
  ): SyntheticResourceAnchor => {
    const anchor = getSyntheticFileAnchor(
      SYNTHETIC_SCENARIO_BLUEPRINT.packages.expandAndSelect,
      index,
    );
    linkOverrides.set(anchor.resourcePath, links);
    return anchor;
  };
  const linkResource = registerLinkedAnchor(
    SYNTHETIC_SCENARIO_BLUEPRINT.resources.link,
    {
      external: [linkAttribution.id, signalSearchNonMatch.id],
    },
  );
  const unreviewedResource = registerLinkedAnchor(
    SYNTHETIC_SCENARIO_BLUEPRINT.resources.unreviewed,
    {
      external: [signalSearchNonMatch.id, frequentSignal.id],
      manual: [defaultManual.id],
    },
  );
  const reviewedResource = registerLinkedAnchor(
    SYNTHETIC_SCENARIO_BLUEPRINT.resources.reviewed,
    {
      manual: [attributionFilterMatch.id, attributionFilterNonMatch.id],
    },
  );
  const editResource = registerLinkedAnchor(
    SYNTHETIC_SCENARIO_BLUEPRINT.resources.edit,
    {
      manual: [editAttribution.id],
    },
  );
  const signalSearchResource = registerLinkedAnchor(
    SYNTHETIC_SCENARIO_BLUEPRINT.resources.signalSearch,
    {
      external: [signalSearchMatch.id, signalSearchNonMatch.id],
      manual: [],
    },
  );
  registerLinkedAnchor(SYNTHETIC_SCENARIO_BLUEPRINT.resources.report, {
    manual: [reportAttribution.id],
  });
  const signalSortResource = registerLinkedAnchor(
    SYNTHETIC_SCENARIO_BLUEPRINT.resources.signalSort,
    {
      external: [rareSignal.id, frequentSignal.id],
    },
  );
  linkOverrides.set(expandAndSelectLayout.packageResourcePath, {
    external: external.map(({ id }) => id),
    manual: manual.map(({ id }) => id),
  });

  const denseSignalStart =
    profile.externalAttributionCount - profile.denseSignalCount;
  const denseSignals = Array.from(
    { length: profile.denseSignalCount },
    (_, offset) =>
      getSyntheticAttributionRecord(
        profile,
        'external',
        denseSignalStart + offset,
      ),
  );
  const denseResource = getDenseSignalResourceAnchor(
    profile,
    new Set(linkOverrides.keys()),
  );
  linkOverrides.set(denseResource.resourcePath, {
    external: denseSignals.map(({ id }) => id),
  });

  const highFanoutExternal = getSyntheticAttributionRecord(
    profile,
    'external',
    profile.externalAttributionCount - profile.denseSignalCount,
  );
  const highFanoutManual = getSyntheticAttributionRecord(
    profile,
    'manual',
    profile.manualAttributionCount - 1,
  );
  const splitDirectoryCount = profile.splitDirectoryCountPerPartition;
  const firstPartition = Array.from(
    { length: splitDirectoryCount },
    (_, index) => `/${getSyntheticPackageName(index + 1)}`,
  );
  const secondPartition = Array.from(
    { length: splitDirectoryCount },
    (_, index) =>
      `/${getSyntheticPackageName(index + splitDirectoryCount + 1)}`,
  );
  const sourcePackageIndex = 0;
  const highFanoutWritableResource = getSyntheticPackageFileAnchor(
    profile,
    sourcePackageIndex,
    0,
  );
  const highFanoutReadonlyResource = getSyntheticPackageFileAnchor(profile, 1);
  linkOverrides.set(highFanoutWritableResource.resourcePath, {
    ...linkOverrides.get(highFanoutWritableResource.resourcePath),
    manual: [highFanoutManual.id],
  });
  linkOverrides.set(highFanoutReadonlyResource.resourcePath, {
    external: [highFanoutExternal.id],
    manual: [highFanoutManual.id],
  });
  const firstPartitionResource = getSyntheticPackageFileAnchor(profile, 1);
  const secondPartitionResource = getSyntheticPackageFileAnchor(
    profile,
    splitDirectoryCount + 1,
    0,
  );
  const sourceResource = getSyntheticPackageFileAnchor(
    profile,
    sourcePackageIndex,
  );
  const bulkSignals = denseSignals.slice(1, profile.bulkSignalCount + 1);
  const highFanoutResource = highFanoutReadonlyResource;

  const scenarios = {
    expandAndSelect: {
      anchors: {
        targetResourceName: expandAndSelectLayout.packageResourceName,
        targetResourcePath: expandAndSelectLayout.packageResourcePath,
        childResourceName: expandAndSelectLayout.firstModuleResourceName,
        childResourcePath: expandAndSelectLayout.firstModuleResourcePath,
        firstFileResourceName: expandAndSelectLayout.firstFileResourceName,
        firstFileResourcePath: expandAndSelectLayout.firstFileResourcePath,
      },
      resourceOrdinal:
        SYNTHETIC_SCENARIO_BLUEPRINT.expandAndSelectResourceOrdinal,
      linkedAttributions: { external, manual },
      expected: { attribution: manual[0], signal: external[1] },
    },
    resourceSearch: {
      anchors: {
        targetResourceName: resourceSearchLayout.packageResourceName,
        targetResourcePath: resourceSearchLayout.packageResourcePath,
        uniqueSearchPath: resourceSearchFilePath,
      },
    },
    resourceFilter: {
      unreviewedResource,
      reviewedResource,
    },
    attributionFilter: {
      resource: reviewedResource,
      licenseName: attributionFilterMatch.packageInfo.licenseName!,
      matchingAttribution: attributionFilterMatch,
      nonMatchingAttribution: attributionFilterNonMatch,
    },
    signalSearch: {
      resource: signalSearchResource,
      matchingSignal: signalSearchMatch,
      nonMatchingSignal: signalSearchNonMatch,
    },
    signalSort: {
      resource: signalSortResource,
      frequentSignal,
      rareSignal,
    },
    projectStatistics: {
      classification:
        SYNTHETIC_CLASSIFICATION_NAMES[
          frequentSignal.packageInfo.classification!
        ],
      criticality: 'Highly Critical Signals' as const,
    },
    report: {
      attribution: reportAttribution,
    },
    link: {
      resource: linkResource,
      attribution: linkAttribution,
    },
    edit: {
      resource: editResource,
      attribution: editAttribution,
    },
    denseSignals: {
      resource: denseResource,
      signals: denseSignals,
      bulkSignals,
      frequentSignal: highFanoutExternal,
      rareSignal: denseSignals.at(-1)!,
      searchSignal: denseSignals.at(-1)!,
      licenseName: PERFORMANCE_BULK_LICENSE,
    },
    highFanout: {
      external: highFanoutExternal,
      manual: highFanoutManual,
      resource: highFanoutResource,
      writableResource: highFanoutWritableResource,
      readonlyResource: highFanoutReadonlyResource,
    },
    split: {
      firstPartition,
      secondPartition,
      sourceResource,
      firstPartitionResource,
      secondPartitionResource,
      mixedWritableResource: highFanoutWritableResource,
      mixedReadonlyResource: highFanoutReadonlyResource,
    },
  };

  return {
    profile,
    linkOverrides,
    scenarios,
  };
}

const FREQUENT_SIGNAL_START = 100;
const FREQUENT_SIGNAL_END = 1100;
const DEFAULT_SIGNAL_END = 10000;
const HIGH_FANOUT_START = 0;

export function getSyntheticLinksForResource(
  ordinal: number,
  resourcePath: string,
  profile: SyntheticFileProfile,
  model: Fixture,
  kind: SyntheticAttributionKind,
): Array<string> {
  const override = model.linkOverrides.get(resourcePath)?.[kind];
  if (override !== undefined) {
    return [...override];
  }

  const links: Array<string> = [];
  if (
    kind === 'external' &&
    ordinal <
      profile.externalLinkCount -
        EXTRA_EARLY_LINK_COUNT -
        profile.denseSignalCount +
        1
  ) {
    const externalIndex =
      ordinal >= HIGH_FANOUT_START &&
      ordinal < HIGH_FANOUT_START + profile.highFanoutLinkCount
        ? profile.externalAttributionCount - profile.denseSignalCount
        : ordinal >= FREQUENT_SIGNAL_START && ordinal < FREQUENT_SIGNAL_END
          ? model.scenarios.signalSort.frequentSignal.index
          : ordinal < DEFAULT_SIGNAL_END
            ? 0
            : syntheticHash(profile.seed, ordinal) %
              profile.externalAttributionCount;
    links.push(getSyntheticAttributionId('external', externalIndex));
    if (ordinal < EXTRA_EARLY_LINK_COUNT) {
      links.push(getSyntheticAttributionId('external', externalIndex + 1));
    }
  }
  if (kind === 'manual' && ordinal < profile.manualLinkCount) {
    links.push(
      getSyntheticAttributionId(
        'manual',
        ordinal < profile.highFanoutLinkCount
          ? profile.manualAttributionCount - 1
          : syntheticHash(profile.seed + 1, ordinal) %
              (profile.manualAttributionCount - 1),
      ),
    );
  }
  return links;
}
