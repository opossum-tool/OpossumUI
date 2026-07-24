// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { parseOpossumFile } from '../../ElectronBackend/input/parseFile';
import type {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../ElectronBackend/types/types';
import type { RawPackageInfo } from '../../shared/shared-types';
import { faker, stubOpenDialogSync, test } from '../utils';

const [resourceName] = faker.opossum.resourceName();
const resourcePath = faker.opossum.filePath(resourceName);
const [preselectedAttributionId, preselectedPackageInfo] =
  faker.opossum.rawAttribution({ preSelected: true });
const [existingAttributionId, existingPackageInfo] =
  faker.opossum.rawAttribution({ attributionConfidence: undefined });

interface SaveScenario {
  data: {
    inputData: ParsedOpossumInputFile;
    outputData?: ParsedOpossumOutputFile;
  };
  packageInfo: RawPackageInfo;
  title: string;
}

const saveScenarios: Array<SaveScenario> = [
  {
    title: 'when the archive has no output yet',
    data: {
      inputData: faker.opossum.inputData({
        externalAttributions: faker.opossum.rawAttributions({
          [preselectedAttributionId]: preselectedPackageInfo,
        }),
        resources: faker.opossum.resources({ [resourceName]: 1 }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [resourcePath]: [preselectedAttributionId],
        }),
      }),
    },
    packageInfo: preselectedPackageInfo,
  },
  {
    title: 'when the archive already has output',
    data: {
      inputData: faker.opossum.inputData({
        resources: faker.opossum.resources({ [resourceName]: 1 }),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: faker.opossum.rawAttributions({
          [existingAttributionId]: existingPackageInfo,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [resourcePath]: [existingAttributionId],
        }),
      }),
    },
    packageInfo: existingPackageInfo,
  },
];

for (const { data, packageInfo, title } of saveScenarios) {
  test.describe(`${title} when opened from the CLI`, () => {
    test.use({ data, openFromCLI: true });
    runSavingTest(packageInfo);
  });

  test.describe(`${title} when opened with the file dialog`, () => {
    test.use({ data, openFromCLI: false });

    test.beforeEach(async ({ filePaths, menuBar, window }) => {
      await stubOpenDialogSync(window.app, [filePaths!.opossum]);
      await menuBar.openFile();
    });

    runSavingTest(packageInfo);
  });
}

function runSavingTest(packageInfo: RawPackageInfo): void {
  test('persists a modified attribution', async ({
    attributionDetails,
    attributionsPanel,
    filePaths,
    menuBar,
    resourcesTree,
    window,
  }) => {
    const comment = faker.lorem.sentences();

    await menuBar.assert.initiallyDisabledEntriesAreEnabled();
    await resourcesTree.goto(resourceName);
    await attributionsPanel.packageCard.click(packageInfo);
    await attributionDetails.attributionForm.comment.fill(comment);
    await menuBar.saveChanges();

    await expect
      .poll(
        () =>
          hasPersistedAttribution({
            comment,
            opossumFilePath: filePaths!.opossum,
            packageName: packageInfo.packageName!,
            resourcePath,
          }),
        {
          message: 'Expected output.json to contain the updated attribution',
        },
      )
      .toBe(true);

    await stubOpenDialogSync(window.app, [filePaths!.opossum]);
    await menuBar.openFile();
    await resourcesTree.goto(resourceName);
    await attributionsPanel.packageCard.click(packageInfo);
    await attributionDetails.attributionForm.assert.commentIs(comment);
  });
}

async function hasPersistedAttribution({
  comment,
  opossumFilePath,
  packageName,
  resourcePath,
}: {
  comment: string;
  opossumFilePath: string;
  packageName: string;
  resourcePath: string;
}): Promise<boolean> {
  const parsedFile = await parseOpossumFile(opossumFilePath);
  if (!('input' in parsedFile) || parsedFile.output === null) {
    return false;
  }

  const attribution = Object.entries(parsedFile.output.manualAttributions).find(
    ([, manualAttribution]) =>
      manualAttribution.packageName === packageName &&
      manualAttribution.comment === comment,
  );

  return (
    attribution !== undefined &&
    parsedFile.output.resourcesToAttributions[resourcePath]?.includes(
      attribution[0],
    )
  );
}
