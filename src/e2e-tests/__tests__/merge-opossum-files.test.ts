// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ElectronApplication,
  expect,
  type Page,
  type TestInfo,
} from '@playwright/test';
import fs from 'fs';

import { parseOpossumFile } from '../../ElectronBackend/input/parseFile';
import type {
  ParsedOpossumInputAndOutput,
  ParsedOpossumOutputFile,
} from '../../ElectronBackend/types/types';
import { writeOpossumFile } from '../../shared/write-file';
import type { AttributionDetails } from '../page-objects/AttributionDetails';
import type { AttributionsPanel } from '../page-objects/AttributionsPanel';
import type { MenuBar } from '../page-objects/MenuBar';
import type { ResourcesTree } from '../page-objects/ResourcesTree';
import type { SplitDialog } from '../page-objects/SplitDialog';
import { faker, stubOpenDialogSync, stubSaveDialogSync, test } from '../utils';

const [
  firstDirectoryName,
  secondDirectoryName,
  firstResourceName,
  secondResourceName,
] = faker.opossum.resourceNames({ count: 4 });
const firstResourcePath = faker.opossum.filePath(
  firstDirectoryName,
  firstResourceName,
);
const secondResourcePath = faker.opossum.filePath(
  secondDirectoryName,
  secondResourceName,
);
const [readonlyDirectoryName, readonlyResourceName] =
  faker.opossum.resourceNames({ count: 2 });
const readonlyResourcePath = faker.opossum.filePath(
  readonlyDirectoryName,
  readonlyResourceName,
);
const [existingAttributionId, existingPackageInfo] =
  faker.opossum.rawAttribution();
const [readonlyAttributionId, readonlyPackageInfo] =
  faker.opossum.rawAttribution();
const firstPartyPackageInfo = faker.opossum.rawPackageInfo({
  attributionConfidence: undefined,
  copyright: undefined,
  firstParty: true,
  licenseName: undefined,
  packageName: undefined,
  packageType: undefined,
  packageVersion: undefined,
  url: undefined,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [firstDirectoryName]: { [firstResourceName]: 1 },
        [secondDirectoryName]: { [secondResourceName]: 1 },
      }),
      metadata: faker.opossum.metadata({ projectId: 'merge-test-project' }),
    }),
    outputData: faker.opossum.outputData({}),
  },
});

test('merges split files into the current file', async ({
  menuBar,
  mergeOpossumFilesDialog,
  resourcesTree,
  splitDialog,
  window,
}, testInfo) => {
  const [firstPartitionPath, secondPartitionPath] = await createPartitions({
    resourcesTree,
    splitDialog,
    testInfo,
    window,
  });

  await menuBar.mergeSplitFilesIntoCurrentFile();
  await mergeOpossumFilesDialog.assert.isVisible();

  await stubOpenDialogSync(window.app, [
    firstPartitionPath,
    secondPartitionPath,
  ]);
  await mergeOpossumFilesDialog.inputFileSelection.click();
  await mergeOpossumFilesDialog.assert.inputFileIsVisible(firstPartitionPath);
  await mergeOpossumFilesDialog.assert.inputFileIsVisible(secondPartitionPath);

  await mergeOpossumFilesDialog.mergeButton.click();
  await mergeOpossumFilesDialog.assert.isHidden();

  await expect(
    window
      .getByTestId('resources-tree')
      .getByText(firstDirectoryName, { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await resourcesTree.assert.resourceIsEditable(firstDirectoryName);
  await resourcesTree.assert.resourceIsEditable(secondDirectoryName);
});

test.describe('split and merge workflow', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        resources: faker.opossum.resources({
          [firstDirectoryName]: { [firstResourceName]: 1 },
          [secondDirectoryName]: { [secondResourceName]: 1 },
        }),
        metadata: faker.opossum.metadata({ projectId: 'merge-test-project' }),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: faker.opossum.rawAttributions({
          [existingAttributionId]: existingPackageInfo,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [firstResourcePath]: [existingAttributionId],
          [secondResourcePath]: [existingAttributionId],
        }),
      }),
    },
  });

  test('splits, edits, and merges all partitions back into the original file', async ({
    attributionDetails,
    attributionsPanel,
    filePaths,
    menuBar,
    mergeOpossumFilesDialog,
    resourcesTree,
    splitDialog,
    window,
  }, testInfo) => {
    const [firstPartitionPath, secondPartitionPath] = await createPartitions({
      resourcesTree,
      splitDialog,
      testInfo,
      window,
    });

    await openProject({
      editableResourceName: firstDirectoryName,
      filePath: firstPartitionPath,
      menuBar,
      resourcesTree,
      window,
    });
    await createFirstPartyAttribution({
      attributionDetails,
      attributionsPanel,
      filePath: firstPartitionPath,
      menuBar,
      resourceId: firstResourcePath,
      resourcePath: [firstDirectoryName, firstResourceName],
      resourcesTree,
    });

    await openProject({
      editableResourceName: secondDirectoryName,
      filePath: secondPartitionPath,
      menuBar,
      resourcesTree,
      window,
    });
    await createFirstPartyAttribution({
      attributionDetails,
      attributionsPanel,
      filePath: secondPartitionPath,
      menuBar,
      resourceId: secondResourcePath,
      resourcePath: [secondDirectoryName, secondResourceName],
      resourcesTree,
    });

    await openProject({
      filePath: filePaths!.opossum,
      menuBar,
      resourcesTree,
      window,
    });

    await menuBar.mergeSplitFilesIntoCurrentFile();
    await mergeOpossumFilesDialog.assert.isVisible();

    await stubOpenDialogSync(window.app, [
      firstPartitionPath,
      secondPartitionPath,
    ]);
    await mergeOpossumFilesDialog.inputFileSelection.click();
    await mergeOpossumFilesDialog.assert.inputFileIsVisible(firstPartitionPath);
    await mergeOpossumFilesDialog.assert.inputFileIsVisible(
      secondPartitionPath,
    );

    await mergeOpossumFilesDialog.mergeButton.click();
    await mergeOpossumFilesDialog.assert.isHidden();

    await expect(
      window
        .getByTestId('resources-tree')
        .getByText(firstDirectoryName, { exact: true }),
    ).toBeVisible({ timeout: 30000 });
    await resourcesTree.assert.resourceIsEditable(firstDirectoryName);
    await resourcesTree.assert.resourceIsEditable(secondDirectoryName);
    await resourcesTree.goto(firstDirectoryName, firstResourceName);
    await attributionsPanel.packageCard.assert.isVisible(firstPartyPackageInfo);
    await resourcesTree.goto(secondDirectoryName, secondResourceName);
    await attributionsPanel.packageCard.assert.isVisible(firstPartyPackageInfo);
  });
});

test('merges split files into a new Opossum file', async ({
  menuBar,
  mergeOpossumFilesDialog,
  resourcesTree,
  splitDialog,
  window,
}, testInfo) => {
  const destinationPath = testInfo.outputPath('merged.opossum');
  const [firstPartitionPath, secondPartitionPath] = await createPartitions({
    resourcesTree,
    splitDialog,
    testInfo,
    window,
  });

  await menuBar.mergeSplitOpossumFiles();
  await mergeOpossumFilesDialog.assert.isVisible();
  await mergeOpossumFilesDialog.selectNewOutputFile();

  await stubOpenDialogSync(window.app, [
    firstPartitionPath,
    secondPartitionPath,
  ]);
  await mergeOpossumFilesDialog.inputFileSelection.click();
  await stubSaveDialogSync(window.app, destinationPath);
  await mergeOpossumFilesDialog.outputFileSelection.click();

  await mergeOpossumFilesDialog.mergeButton.click();
  await mergeOpossumFilesDialog.assert.isHidden();
  await expect.poll(() => fs.existsSync(destinationPath)).toBe(true);
});

test.describe('merging readonly output conflicts', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        resources: faker.opossum.resources({
          [firstDirectoryName]: { [firstResourceName]: 1 },
          [secondDirectoryName]: { [secondResourceName]: 1 },
          [readonlyDirectoryName]: { [readonlyResourceName]: 1 },
        }),
        metadata: faker.opossum.metadata({ projectId: 'merge-test-project' }),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: { [readonlyAttributionId]: readonlyPackageInfo },
        resourcesToAttributions: {
          [readonlyResourcePath]: [readonlyAttributionId],
        },
      }),
      readonlyRules: [
        { path: '/', readonly: true },
        { path: `/${firstDirectoryName}`, readonly: false },
        { path: `/${secondDirectoryName}`, readonly: false },
      ],
    },
  });

  test('merges readonly output conflicts with the first file when confirmed', async ({
    menuBar,
    mergeOpossumFilesDialog,
    resourcesTree,
    splitDialog,
    window,
  }, testInfo) => {
    const [firstPartitionPath, secondPartitionPath] = await createPartitions({
      resourcesTree,
      splitDialog,
      testInfo,
      window,
    });
    const [conflictingAttributionId, conflictingAttribution] =
      faker.opossum.rawAttribution();
    const firstPartition = getParsedOpossumFile(
      await parseOpossumFile(firstPartitionPath),
    );
    const output = firstPartition.output;
    await writeOpossumFile({
      input: firstPartition.input,
      output: {
        ...output,
        manualAttributions: {
          ...output.manualAttributions,
          [conflictingAttributionId]: conflictingAttribution,
        },
        resourcesToAttributions: {
          ...output.resourcesToAttributions,
          [readonlyResourcePath]: [conflictingAttributionId],
        },
      },
      path: firstPartitionPath,
      readonlyRules: firstPartition.readonlyRules,
    });

    await menuBar.mergeSplitFilesIntoCurrentFile();
    await stubOpenDialogSync(window.app, [
      firstPartitionPath,
      secondPartitionPath,
    ]);
    await mergeOpossumFilesDialog.inputFileSelection.click();

    await mergeOpossumFilesDialog.mergeButton.click();
    await expect(mergeOpossumFilesDialog.warning).toBeVisible();
    await expect(mergeOpossumFilesDialog.mergeAnywayButton).toBeVisible();

    await mergeOpossumFilesDialog.mergeAnywayButton.click();
    await mergeOpossumFilesDialog.assert.isHidden();
    await resourcesTree.assert.resourceIsEditable(firstDirectoryName);
  });
});

function getParsedOpossumFile(
  parsedFile: Awaited<ReturnType<typeof parseOpossumFile>>,
): ParsedOpossumInputAndOutput & { output: ParsedOpossumOutputFile } {
  if (!('input' in parsedFile) || parsedFile.output === null) {
    throw new Error('Expected the merged Opossum file to be valid');
  }
  return { ...parsedFile, output: parsedFile.output };
}

async function createPartitions({
  resourcesTree,
  splitDialog,
  testInfo,
  window,
}: {
  resourcesTree: ResourcesTree;
  splitDialog: SplitDialog;
  testInfo: TestInfo;
  window: Page & { app: ElectronApplication };
}): Promise<[string, string]> {
  const firstPartitionPath = testInfo.outputPath('first-partition.opossum');
  const secondPartitionPath = testInfo.outputPath('second-partition.opossum');

  await createPartition({
    destinationPath: firstPartitionPath,
    resourceName: firstDirectoryName,
    resourcesTree,
    splitDialog,
    window,
  });
  await createPartition({
    destinationPath: secondPartitionPath,
    resourceName: secondDirectoryName,
    resourcesTree,
    splitDialog,
    window,
  });

  return [firstPartitionPath, secondPartitionPath];
}

async function createPartition({
  destinationPath,
  resourceName,
  resourcesTree,
  splitDialog,
  window,
}: {
  destinationPath: string;
  resourceName: string;
  resourcesTree: ResourcesTree;
  splitDialog: SplitDialog;
  window: Page & { app: ElectronApplication };
}): Promise<void> {
  await stubSaveDialogSync(window.app, destinationPath);
  await resourcesTree.openSplitDialog(resourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();
  await splitDialog.assert.succeeded();
  await splitDialog.closeButton.click();
}

async function openProject({
  editableResourceName,
  filePath,
  menuBar,
  resourcesTree,
  window,
}: {
  editableResourceName?: string;
  filePath: string;
  menuBar: MenuBar;
  resourcesTree: ResourcesTree;
  window: Page & { app: ElectronApplication };
}): Promise<void> {
  await stubOpenDialogSync(window.app, [filePath]);
  await menuBar.openFile();
  if (editableResourceName) {
    await resourcesTree.assert.resourceIsEditable(editableResourceName);
  } else {
    await resourcesTree.assert.isVisible();
  }
}

async function createFirstPartyAttribution({
  attributionDetails,
  attributionsPanel,
  filePath,
  menuBar,
  resourceId,
  resourcePath,
  resourcesTree,
}: {
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  filePath: string;
  menuBar: MenuBar;
  resourceId: string;
  resourcePath: Array<string>;
  resourcesTree: ResourcesTree;
}): Promise<void> {
  await resourcesTree.goto(...resourcePath);
  await attributionsPanel.createButton.click();
  await attributionDetails.attributionForm.selectAttributionType('First Party');
  await attributionDetails.saveButton.click();
  await attributionsPanel.packageCard.assert.isVisible(firstPartyPackageInfo);
  await menuBar.saveChanges();
  await expect
    .poll(() => hasPersistedFirstPartyAttribution(filePath, resourceId))
    .toBe(true);
}

async function hasPersistedFirstPartyAttribution(
  opossumFilePath: string,
  resourcePath: string,
): Promise<boolean> {
  const parsedFile = await parseOpossumFile(opossumFilePath);
  if (!('input' in parsedFile) || parsedFile.output === null) {
    return false;
  }

  const firstPartyAttribution = Object.entries(
    parsedFile.output.manualAttributions,
  ).find(([, attribution]) => attribution.firstParty);

  return (
    firstPartyAttribution !== undefined &&
    parsedFile.output.resourcesToAttributions[resourcePath]?.includes(
      firstPartyAttribution[0],
    )
  );
}
