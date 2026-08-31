// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';

import { parseOpossumFile } from '../../../ElectronBackend/input/parseFile';
import type {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../../ElectronBackend/types/types';
import type { RawPackageInfo, Resources } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { createSyntheticFileModel } from '../fixture';
import { getSyntheticFileProfile } from '../profiles';
import { writeSyntheticOpossumFile } from '../writer';

const FANOUT_TOLERANCE = 10;

function countResources(resources: Resources): number {
  return Object.values(resources).reduce(
    (count, resource) =>
      count + 1 + (resource === 1 ? 0 : countResources(resource)),
    0,
  );
}

function countLinks(
  resourcesToAttributions: Record<string, Array<string>>,
): number {
  return Object.values(resourcesToAttributions).reduce(
    (count, attributionIds) => count + attributionIds.length,
    0,
  );
}

function resourcePathExists(
  resources: Resources,
  resourcePath: string,
): boolean {
  const segments = resourcePath.split('/').filter(Boolean);
  let current = resources;
  for (const [index, segment] of segments.entries()) {
    const resource = current[segment];
    if (resource === undefined) {
      return false;
    }
    if (index === segments.length - 1) {
      return true;
    }
    if (resource === 1) {
      return false;
    }
    current = resource;
  }
  return false;
}

function countAttributionLinks(
  resourcesToAttributions: Record<string, Array<string>>,
  attributionId: string,
): number {
  return Object.values(resourcesToAttributions).filter((attributionIds) =>
    attributionIds.includes(attributionId),
  ).length;
}

function getPrimaryCardLabel(packageInfo: RawPackageInfo): string {
  return packageInfo.firstParty
    ? text.packageLists.firstParty
    : `${packageInfo.packageName}, ${packageInfo.packageVersion}`;
}

describe('synthetic performance file generator', () => {
  const outputPath = path.join('test-output', 'synthetic-small.opossum');
  const profile = getSyntheticFileProfile('small');
  const model = createSyntheticFileModel(profile);
  let input: ParsedOpossumInputFile;
  let output: ParsedOpossumOutputFile;

  beforeAll(async () => {
    await writeSyntheticOpossumFile({
      outputPath,
      profile,
    });

    const parsed = await parseOpossumFile(outputPath);
    if (!('input' in parsed) || !parsed.output) {
      throw new Error('Generated synthetic file could not be parsed');
    }
    input = parsed.input;
    output = parsed.output;
  });

  it('generates a schema-valid workload with the configured size', () => {
    // The loader adds the database's implicit root resource.
    expect(countResources(input.resources)).toBe(profile.resourceCount - 1);
    expect(Object.keys(input.externalAttributions)).toHaveLength(
      profile.externalAttributionCount,
    );
    expect(input.attributionBreakpoints).toHaveLength(profile.breakpointCount);
    expect(countLinks(input.resourcesToAttributions)).toBe(
      profile.externalLinkCount,
    );
    expect(Object.keys(output.manualAttributions)).toHaveLength(
      profile.manualAttributionCount,
    );
    const externalOriginIds = new Set(
      Object.values(input.externalAttributions).flatMap(
        ({ originIds }) => originIds ?? [],
      ),
    );
    const originLinkedManualAttributions = Object.values(
      output.manualAttributions,
    ).filter(({ originIds }) => originIds && originIds.length > 0);
    expect(originLinkedManualAttributions).toHaveLength(
      profile.originLinkedManualAttributionCount,
    );
    expect(
      originLinkedManualAttributions.every(({ originIds }) =>
        originIds?.every((originId) => externalOriginIds.has(originId)),
      ),
    ).toBe(true);
    expect(countLinks(output.resourcesToAttributions)).toBe(
      profile.manualLinkCount,
    );
  });

  it('keeps the expand-and-select attribution contract aligned', () => {
    const scenario = model.scenarios.expandAndSelect;
    const links =
      input.resourcesToAttributions[`${scenario.anchors.targetResourcePath}/`];
    expect(links).toEqual(
      scenario.linkedAttributions.external.map(({ id }) => id),
    );
    expect(
      output.resourcesToAttributions[`${scenario.anchors.targetResourcePath}/`],
    ).toEqual(scenario.linkedAttributions.manual.map(({ id }) => id));
    expect(input.externalAttributions[scenario.expected.signal.id]).toEqual(
      scenario.expected.signal.packageInfo,
    );
    const expectedSignalLabel = getPrimaryCardLabel(
      scenario.expected.signal.packageInfo,
    );
    const matchingLabels = scenario.linkedAttributions.external.filter(
      ({ packageInfo }) =>
        getPrimaryCardLabel(packageInfo) === expectedSignalLabel,
    );
    expect(matchingLabels).toHaveLength(1);
    const packageNames = Object.values(input.externalAttributions).map(
      ({ packageName }) => packageName,
    );
    expect(packageNames).toContain(
      scenario.expected.signal.packageInfo.packageName,
    );
    expect(
      packageNames.filter(
        (packageName) =>
          packageName === scenario.expected.signal.packageInfo.packageName,
      ),
    ).toHaveLength(1);
  });

  it('keeps signal-search identities distinct', () => {
    const { matchingSignal, nonMatchingSignal } = model.scenarios.signalSearch;
    expect(matchingSignal.packageInfo).not.toEqual(
      nonMatchingSignal.packageInfo,
    );
    expect(input.externalAttributions[matchingSignal.id]).toEqual(
      matchingSignal.packageInfo,
    );
    expect(input.externalAttributions[nonMatchingSignal.id]).toEqual(
      nonMatchingSignal.packageInfo,
    );
  });

  it('keeps attribution-filter identities distinct', () => {
    const attributionFilter = model.scenarios.attributionFilter;
    expect(
      Object.values(output.manualAttributions).filter(
        ({ licenseName }) => licenseName === attributionFilter.licenseName,
      ),
    ).toEqual([attributionFilter.matchingAttribution.packageInfo]);
  });

  it('keeps scenario resource anchors and links aligned', () => {
    const scenario = model.scenarios.expandAndSelect;
    for (const resourcePath of [
      scenario.anchors.targetResourcePath,
      model.scenarios.resourceFilter.unreviewedResource.resourcePath,
      model.scenarios.resourceFilter.reviewedResource.resourcePath,
      model.scenarios.signalSearch.resource.resourcePath,
      model.scenarios.signalSort.resource.resourcePath,
      model.scenarios.link.resource.resourcePath,
      model.scenarios.edit.resource.resourcePath,
      model.scenarios.denseSignals.resource.resourcePath,
      model.scenarios.highFanout.resource.resourcePath,
      model.scenarios.split.firstPartitionResource.resourcePath,
      model.scenarios.split.secondPartitionResource.resourcePath,
    ]) {
      expect(resourcePathExists(input.resources, resourcePath)).toBe(true);
      const key = resourcePath.endsWith('.ts')
        ? resourcePath
        : `${resourcePath}/`;
      expect(input.resourcesToAttributions[key]).toBeDefined();
    }

    for (const anchor of [
      model.scenarios.resourceFilter.unreviewedResource,
      model.scenarios.resourceFilter.reviewedResource,
      model.scenarios.link.resource,
      model.scenarios.edit.resource,
      model.scenarios.denseSignals.resource,
      model.scenarios.highFanout.resource,
      model.scenarios.split.firstPartitionResource,
      model.scenarios.split.secondPartitionResource,
    ]) {
      expect(`/${anchor.resourceNames.join('/')}`).toBe(anchor.resourcePath);
    }

    const signalSearchResourcePath =
      model.scenarios.signalSearch.resource.resourcePath;
    const signalSearchKey = signalSearchResourcePath.endsWith('.ts')
      ? signalSearchResourcePath
      : `${signalSearchResourcePath}/`;
    expect(input.resourcesToAttributions[signalSearchKey]).toEqual([
      model.scenarios.signalSearch.matchingSignal.id,
      model.scenarios.signalSearch.nonMatchingSignal.id,
    ]);
    const attributionFilterResourcePath =
      model.scenarios.attributionFilter.resource.resourcePath;
    const attributionFilterKey = attributionFilterResourcePath.endsWith('.ts')
      ? attributionFilterResourcePath
      : `${attributionFilterResourcePath}/`;
    expect(output.resourcesToAttributions[attributionFilterKey]).toEqual([
      model.scenarios.attributionFilter.matchingAttribution.id,
      model.scenarios.attributionFilter.nonMatchingAttribution.id,
    ]);
    const signalSortResourcePath =
      model.scenarios.signalSort.resource.resourcePath;
    const signalSortKey = signalSortResourcePath.endsWith('.ts')
      ? signalSortResourcePath
      : `${signalSortResourcePath}/`;
    expect(input.resourcesToAttributions[signalSortKey]).toEqual([
      model.scenarios.signalSort.rareSignal.id,
      model.scenarios.signalSort.frequentSignal.id,
    ]);
    const linkResourcePath = model.scenarios.link.resource.resourcePath;
    expect(input.resourcesToAttributions[linkResourcePath]).toEqual([
      model.scenarios.link.attribution.id,
      model.scenarios.signalSearch.nonMatchingSignal.id,
    ]);

    expect(model.scenarios.link.resource.resourcePath).not.toBe(
      model.scenarios.edit.resource.resourcePath,
    );
  });

  it('gives frequent signals more resource links than rare signals', () => {
    const frequentSignalId = model.scenarios.signalSort.frequentSignal.id;
    const rareSignalId = model.scenarios.signalSort.rareSignal.id;
    expect(
      countAttributionLinks(input.resourcesToAttributions, frequentSignalId),
    ).toBeGreaterThan(
      countAttributionLinks(input.resourcesToAttributions, rareSignalId),
    );
  });

  it('keeps the sorting scenario order observable', () => {
    const { frequentSignal, rareSignal } = model.scenarios.signalSort;
    const frequentName = frequentSignal.packageInfo.packageName;
    const rareName = rareSignal.packageInfo.packageName;

    if (!frequentName || !rareName) {
      throw new Error('Sorting scenario signals must have package names');
    }

    expect(rareName.localeCompare(frequentName)).toBeLessThan(0);
  });

  it('keeps the dense sorting scenario order observable', () => {
    const { frequentSignal, signals } = model.scenarios.denseSignals;
    const otherSignal = signals.find(({ id }) => id !== frequentSignal.id);

    if (!otherSignal) {
      throw new Error('Dense sorting scenario must contain another signal');
    }

    expect(
      frequentSignal.packageInfo.packageName!.localeCompare(
        otherSignal.packageInfo.packageName!,
      ),
    ).toBeGreaterThan(0);
  });

  it('generates dense and high-fanout performance anchors', () => {
    const dense = model.scenarios.denseSignals;
    const highFanout = model.scenarios.highFanout;
    expect(
      input.resourcesToAttributions[dense.resource.resourcePath],
    ).toHaveLength(profile.denseSignalCount);
    expect(
      dense.bulkSignals.every(({ id }) =>
        input.resourcesToAttributions[dense.resource.resourcePath].includes(id),
      ),
    ).toBe(true);
    expect(dense.bulkSignals).toHaveLength(profile.bulkSignalCount);
    expect(dense.bulkSignals.map(({ id }) => id)).not.toContain(
      highFanout.external.id,
    );
    expect(
      dense.bulkSignals.every(
        ({ packageInfo }) => packageInfo.licenseName === dense.licenseName,
      ),
    ).toBe(true);
    expect(
      dense.signals.every(
        ({ id }) => !(output.resolvedExternalAttributions ?? []).includes(id),
      ),
    ).toBe(true);
    expect(
      countAttributionLinks(
        input.resourcesToAttributions,
        highFanout.external.id,
      ),
    ).toBeGreaterThan(profile.highFanoutLinkCount - FANOUT_TOLERANCE);
    expect(
      countAttributionLinks(
        output.resourcesToAttributions,
        highFanout.manual.id,
      ),
    ).toBeGreaterThan(profile.highFanoutLinkCount - FANOUT_TOLERANCE);
    expect(
      input.resourcesToAttributions[highFanout.readonlyResource.resourcePath],
    ).toContain(highFanout.external.id);
    for (const resource of [
      highFanout.writableResource,
      highFanout.readonlyResource,
    ]) {
      expect(output.resourcesToAttributions[resource.resourcePath]).toContain(
        highFanout.manual.id,
      );
    }
  });

  it('generates non-overlapping split partition anchors', () => {
    const { firstPartition, secondPartition } = model.scenarios.split;
    expect(firstPartition).toHaveLength(
      profile.splitDirectoryCountPerPartition,
    );
    expect(secondPartition).toHaveLength(
      profile.splitDirectoryCountPerPartition,
    );
    expect(new Set([...firstPartition, ...secondPartition]).size).toBe(
      firstPartition.length + secondPartition.length,
    );
  });
});
