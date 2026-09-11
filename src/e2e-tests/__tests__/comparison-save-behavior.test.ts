// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { parseOpossumFile } from '../../ElectronBackend/input/parseFile';
import type { ParsedOpossumOutputFile } from '../../ElectronBackend/types/types';
import type { RawPackageInfo } from '../../shared/shared-types';
import { pathsToResources } from '../../testing/global-test-helpers';
import type { AttributionDetails } from '../page-objects/AttributionDetails';
import type { AttributionsPanel } from '../page-objects/AttributionsPanel';
import type { DiffPopup } from '../page-objects/DiffPopup';
import type { ResourcesTree } from '../page-objects/ResourcesTree';
import { faker, test } from '../utils';

const leftResourcePath = '/writable/left.ts';
const rightResourcePath = '/writable/right.ts';
const readonlyResourcePath = '/readonly/right.ts';
const leftAttributionId = 'left-attribution';
const rightAttributionId = 'right-attribution';

const sharedPackageInfo = faker.opossum.rawPackageInfo({
  packageName: 'foo',
});
const leftPackageInfo: RawPackageInfo = {
  ...sharedPackageInfo,
  packageName: 'foo',
};
const rightPackageInfo: RawPackageInfo = {
  ...sharedPackageInfo,
  packageName: 'bar',
};

test.describe('saving writable comparison edits', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        resources: pathsToResources([leftResourcePath, rightResourcePath]),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: {
          [leftAttributionId]: leftPackageInfo,
          [rightAttributionId]: rightPackageInfo,
        },
        resourcesToAttributions: {
          [leftResourcePath]: [leftAttributionId],
          [rightResourcePath]: [rightAttributionId],
        },
      }),
    },
  });

  test('swaps two attribution values while preserving resource associations', async ({
    attributionDetails,
    attributionsPanel,
    confirmSavePopup,
    diffPopup,
    filePaths,
    menuBar,
    resourcesTree,
  }) => {
    await openComparison({
      attributionDetails,
      attributionsPanel,
      diffPopup,
      resourcesTree,
      leftPackageInfo,
      rightPackageInfo,
      leftResourcePath,
      rightResourcePath,
    });

    await diffPopup.leftPackageName.fill('bar');
    await diffPopup.rightPackageName.fill('foo');
    await diffPopup.saveButton.click();
    await confirmSavePopup.assert.isVisible();
    await confirmSavePopup.saveGloballyButton.click();
    await confirmSavePopup.assert.isHidden();
    await diffPopup.assert.isHidden();
    await attributionDetails.attributionForm.assert.nameIs('foo');

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: leftResourcePath,
      packageInfo: { ...leftPackageInfo, packageName: 'bar' },
    });
    await attributionDetails.attributionForm.assert.nameIs('bar');

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: rightResourcePath,
      packageInfo: { ...rightPackageInfo, packageName: 'foo' },
    });
    await attributionDetails.attributionForm.assert.nameIs('foo');

    await menuBar.saveChanges();
    const output = await waitForSavedOutput(filePaths!.opossum, (saved) => {
      return (
        saved.manualAttributions[leftAttributionId]?.packageName === 'bar' &&
        saved.manualAttributions[rightAttributionId]?.packageName === 'foo' &&
        saved.resourcesToAttributions[leftResourcePath]?.[0] ===
          leftAttributionId &&
        saved.resourcesToAttributions[rightResourcePath]?.[0] ===
          rightAttributionId
      );
    });

    expect(Object.keys(output.manualAttributions)).toEqual(
      expect.arrayContaining([leftAttributionId, rightAttributionId]),
    );
    expect(Object.keys(output.manualAttributions)).toHaveLength(2);
    expect(output.resourcesToAttributions).toEqual({
      [leftResourcePath]: [leftAttributionId],
      [rightResourcePath]: [rightAttributionId],
    });
  });

  test('merges matching drafts and keeps editing the survivor', async ({
    attributionDetails,
    attributionsPanel,
    confirmSavePopup,
    diffPopup,
    filePaths,
    linkedResourcesTree,
    menuBar,
    resourcesTree,
  }) => {
    await openComparison({
      attributionDetails,
      attributionsPanel,
      diffPopup,
      resourcesTree,
      leftPackageInfo,
      rightPackageInfo,
      leftResourcePath,
      rightResourcePath,
    });

    await diffPopup.leftPackageName.fill('merged');
    await diffPopup.rightPackageName.fill('merged');
    await diffPopup.saveButton.click();
    await confirmSavePopup.assert.isVisible();
    await confirmSavePopup.saveGloballyButton.click();
    await confirmSavePopup.assert.isHidden();
    await diffPopup.assert.isHidden();
    await attributionDetails.attributionForm.assert.nameIs('merged');
    await linkedResourcesTree.assert.resourceIsVisible('left.ts');
    await linkedResourcesTree.assert.resourceIsVisible('right.ts');

    await menuBar.saveChanges();
    const mergedOutput = await waitForSavedOutput(
      filePaths!.opossum,
      (saved) => {
        const manualAttributionIds = Object.keys(saved.manualAttributions);
        const resourceAttributionIds = [
          saved.resourcesToAttributions[leftResourcePath]?.[0],
          saved.resourcesToAttributions[rightResourcePath]?.[0],
        ];
        return (
          manualAttributionIds.length === 1 &&
          resourceAttributionIds[0] !== undefined &&
          resourceAttributionIds[0] === resourceAttributionIds[1] &&
          resourceAttributionIds[0] === manualAttributionIds[0] &&
          saved.manualAttributions[manualAttributionIds[0]]?.packageName ===
            'merged'
        );
      },
    );
    const survivorId = Object.keys(mergedOutput.manualAttributions)[0];

    const updatedName = 'merged-again';
    await attributionDetails.attributionForm.name.fill(updatedName);
    await attributionDetails.saveButton.click();
    await confirmSavePopup.assert.isVisible();
    await confirmSavePopup.saveGloballyButton.click();
    await confirmSavePopup.assert.isHidden();
    await expect(attributionDetails.saveButton).toBeDisabled();

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: leftResourcePath,
      packageInfo: { ...leftPackageInfo, packageName: updatedName },
    });
    await attributionDetails.attributionForm.assert.nameIs(updatedName);

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: rightResourcePath,
      packageInfo: { ...rightPackageInfo, packageName: updatedName },
    });
    await attributionDetails.attributionForm.assert.nameIs(updatedName);

    await menuBar.saveChanges();
    const finalOutput = await waitForSavedOutput(
      filePaths!.opossum,
      (saved) =>
        Object.keys(saved.manualAttributions).length === 1 &&
        saved.manualAttributions[survivorId]?.packageName === updatedName &&
        saved.resourcesToAttributions[leftResourcePath]?.[0] === survivorId &&
        saved.resourcesToAttributions[rightResourcePath]?.[0] === survivorId,
    );
    expect(Object.keys(finalOutput.manualAttributions)).toEqual([survivorId]);
  });
});

test.describe('saving a mixed readonly comparison edit', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        resources: pathsToResources([
          leftResourcePath,
          rightResourcePath,
          readonlyResourcePath,
        ]),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: {
          [leftAttributionId]: leftPackageInfo,
          [rightAttributionId]: rightPackageInfo,
        },
        resourcesToAttributions: {
          [leftResourcePath]: [leftAttributionId],
          [rightResourcePath]: [rightAttributionId],
          [readonlyResourcePath]: [rightAttributionId],
        },
      }),
      readonlyRules: [{ path: '/readonly', readonly: true }],
    },
  });

  test('partitions a mixed attribution when saving its edited value', async ({
    attributionDetails,
    attributionsPanel,
    confirmSavePopup,
    diffPopup,
    filePaths,
    menuBar,
    resourcesTree,
  }) => {
    const editedName = 'mixed-edit';
    await openComparison({
      attributionDetails,
      attributionsPanel,
      diffPopup,
      resourcesTree,
      leftPackageInfo,
      rightPackageInfo,
      leftResourcePath,
      rightResourcePath,
    });

    await diffPopup.rightPackageName.fill(editedName);
    await diffPopup.saveButton.click();
    await confirmSavePopup.assert.isVisible();
    await confirmSavePopup.saveButton.click();
    await confirmSavePopup.assert.isHidden();
    await diffPopup.assert.isHidden();
    await attributionDetails.attributionForm.assert.nameIs(editedName);

    await menuBar.saveChanges();
    const output = await waitForSavedOutput(filePaths!.opossum, (saved) => {
      const writableAttributionId =
        saved.resourcesToAttributions[rightResourcePath]?.[0];
      return (
        writableAttributionId !== undefined &&
        writableAttributionId !== rightAttributionId &&
        saved.manualAttributions[rightAttributionId]?.packageName === 'bar' &&
        saved.manualAttributions[writableAttributionId]?.packageName ===
          editedName &&
        saved.resourcesToAttributions[readonlyResourcePath]?.[0] ===
          rightAttributionId &&
        saved.resourcesToAttributions[leftResourcePath]?.[0] ===
          leftAttributionId &&
        saved.manualAttributions[leftAttributionId]?.packageName === 'foo'
      );
    });
    const writableAttributionId =
      output.resourcesToAttributions[rightResourcePath][0];

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: leftResourcePath,
      packageInfo: leftPackageInfo,
    });
    await attributionDetails.attributionForm.assert.nameIs('foo');

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: rightResourcePath,
      packageInfo: { ...rightPackageInfo, packageName: editedName },
    });
    await attributionDetails.attributionForm.assert.nameIs(editedName);

    await openResource({
      attributionDetails,
      attributionsPanel,
      resourcesTree,
      resourcePath: readonlyResourcePath,
      packageInfo: rightPackageInfo,
    });
    await attributionDetails.attributionForm.assert.nameIs('bar');
    expect(writableAttributionId).not.toBe(rightAttributionId);
  });
});

interface ComparisonPageObjects {
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  diffPopup: DiffPopup;
  resourcesTree: ResourcesTree;
}

async function openComparison({
  attributionDetails,
  attributionsPanel,
  diffPopup,
  resourcesTree,
  leftPackageInfo: sourcePackageInfo,
  rightPackageInfo: targetPackageInfo,
  leftResourcePath: sourceResourcePath,
  rightResourcePath: targetResourcePath,
}: ComparisonPageObjects & {
  leftPackageInfo: RawPackageInfo;
  rightPackageInfo: RawPackageInfo;
  leftResourcePath: string;
  rightResourcePath: string;
}): Promise<void> {
  await openResource({
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    resourcePath: sourceResourcePath,
    packageInfo: sourcePackageInfo,
  });
  await attributionDetails.compareWithButton.click();

  await openResource({
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    resourcePath: targetResourcePath,
    packageInfo: targetPackageInfo,
  });
  await attributionDetails.compareSelectionConfirmButton.click();
  await diffPopup.assert.isVisible();
}

async function openResource({
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  resourcePath,
  packageInfo,
}: {
  attributionDetails: ComparisonPageObjects['attributionDetails'];
  attributionsPanel: ComparisonPageObjects['attributionsPanel'];
  resourcesTree: ComparisonPageObjects['resourcesTree'];
  resourcePath: string;
  packageInfo: RawPackageInfo;
}): Promise<void> {
  await resourcesTree.revealResource(resourcePath);
  await resourcesTree.selectRevealedResource(resourcePath);
  await attributionsPanel.packageCard.click(packageInfo);
  await attributionDetails.attributionForm.assert.nameIs(
    packageInfo.packageName || '',
  );
}

async function readSavedOutput(
  filePath: string,
): Promise<ParsedOpossumOutputFile | null> {
  const parsed = await parseOpossumFile(filePath);
  return 'input' in parsed ? parsed.output : null;
}

async function waitForSavedOutput(
  filePath: string,
  predicate: (output: ParsedOpossumOutputFile) => boolean,
): Promise<ParsedOpossumOutputFile> {
  let output: ParsedOpossumOutputFile | null = null;
  await expect
    .poll(async () => {
      output = await readSavedOutput(filePath);
      return output !== null && predicate(output);
    })
    .toBe(true);
  if (output === null) {
    throw new Error('Expected a persisted output file');
  }
  return output;
}
