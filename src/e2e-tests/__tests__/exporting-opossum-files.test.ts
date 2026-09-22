// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ElectronApplication, expect } from '@playwright/test';
import * as fs from 'fs';

import { getFilePathWithAppendix } from '../../ElectronBackend/utils/getFilePathWithAppendix';
import { faker, test } from '../utils';
import { getShowItemInFolderCalls, stubShowItemInFolder } from '../utils/shell';

interface ExportedFilePaths {
  followUpCsv: string;
  compactBomCsv: string;
  detailedBomCsv: string;
  spdxYaml: string;
  spdxJson: string;
}

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [followUpAttributionId, followUpPackageInfo] =
  faker.opossum.rawAttribution({
    packageName: 'e2e-follow-up-package',
    followUp: 'FOLLOW_UP',
  });
const [bomAttributionId, bomPackageInfo] = faker.opossum.rawAttribution({
  packageName: 'e2e-bom-package',
});

const exportTest = test.extend<{ exportedFilePaths: ExportedFilePaths }>({
  exportedFilePaths: async ({ filePaths }, use) => {
    if (!filePaths) {
      throw new Error('Expected the test fixture to create an opossum file');
    }
    const { opossum } = filePaths;
    await use({
      followUpCsv: getFilePathWithAppendix(opossum, '_follow_up.csv'),
      compactBomCsv: getFilePathWithAppendix(
        opossum,
        '_compact_component_list.csv',
      ),
      detailedBomCsv: getFilePathWithAppendix(
        opossum,
        '_detailed_component_list.csv',
      ),
      spdxYaml: getFilePathWithAppendix(opossum, '.spdx.yaml'),
      spdxJson: getFilePathWithAppendix(opossum, '.spdx.json'),
    });
  },
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [followUpAttributionId]: followUpPackageInfo,
        [bomAttributionId]: bomPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [followUpAttributionId],
        [faker.opossum.filePath(resourceName2)]: [bomAttributionId],
      }),
    }),
  },
});

async function waitForExportedFile(
  app: ElectronApplication,
  filePath: string,
): Promise<string> {
  await expect
    .poll(async () => (await getShowItemInFolderCalls(app)).includes(filePath))
    .toBe(true);
  expect(fs.existsSync(filePath)).toBe(true);
  return fs.readFileSync(filePath, 'utf-8');
}

exportTest(
  'exports all formats to files next to the opossum file',
  async ({ window, exportedFilePaths, menuBar }) => {
    await stubShowItemInFolder(window.app);

    await menuBar.exportFollowUp();
    const followUpContent = await waitForExportedFile(
      window.app,
      exportedFilePaths.followUpCsv,
    );
    expect(followUpContent).toContain('e2e-follow-up-package');

    await menuBar.exportCompactBom();
    const compactBomContent = await waitForExportedFile(
      window.app,
      exportedFilePaths.compactBomCsv,
    );
    expect(compactBomContent).toContain('e2e-bom-package');
    expect(compactBomContent).not.toContain('e2e-follow-up-package');

    await menuBar.exportDetailedBom();
    const detailedBomContent = await waitForExportedFile(
      window.app,
      exportedFilePaths.detailedBomCsv,
    );
    expect(detailedBomContent).toContain('e2e-bom-package');
    expect(detailedBomContent).toContain(resourceName2);

    await menuBar.exportSpdxYaml();
    const spdxYamlContent = await waitForExportedFile(
      window.app,
      exportedFilePaths.spdxYaml,
    );
    expect(spdxYamlContent).toContain('e2e-follow-up-package');
    expect(spdxYamlContent).toContain('e2e-bom-package');

    await menuBar.exportSpdxJson();
    const spdxJsonContent = await waitForExportedFile(
      window.app,
      exportedFilePaths.spdxJson,
    );
    expect(spdxJsonContent).toContain('e2e-follow-up-package');
    expect(spdxJsonContent).toContain('e2e-bom-package');
  },
);

exportTest(
  'exports do not include unsaved changes after they were discarded',
  async ({
    attributionDetails,
    window,
    exportedFilePaths,
    menuBar,
    notSavedPopup,
    resourcesTree,
  }) => {
    const discardedCopyright = faker.lorem.sentences();

    await stubShowItemInFolder(window.app);

    await resourcesTree.goto(resourceName1);
    await attributionDetails.attributionForm.copyright.fill(discardedCopyright);

    await menuBar.exportFollowUp();
    await notSavedPopup.assert.isVisible();
    expect(await getShowItemInFolderCalls(window.app)).toEqual([]);

    await notSavedPopup.discardButton.click();
    await notSavedPopup.assert.isHidden();

    const followUpContent = await waitForExportedFile(
      window.app,
      exportedFilePaths.followUpCsv,
    );
    expect(followUpContent).toContain('e2e-follow-up-package');
    expect(followUpContent).not.toContain(discardedCopyright);
  },
);
