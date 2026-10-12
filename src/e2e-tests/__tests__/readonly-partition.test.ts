// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Resources } from '../../shared/shared-types';
import { faker, test } from '../utils';

const resources: Resources = {
  'readonly-only': { 'hidden.ts': 1 },
  structural: { 'structural-editable': { 'mixed.ts': 1 } },
  editable: { 'manual.ts': 1, 'external.ts': 1 },
};

const [editableManualId, editableManual] = faker.opossum.rawAttribution({
  licenseName: 'Editable-Manual',
  packageName: 'editable-manual',
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources(resources),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [editableManualId]: editableManual,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        '/editable/manual.ts': [editableManualId],
      }),
    }),
    readonlyRules: [
      { path: '/', readonly: true },
      { path: '/editable', readonly: false },
      { path: '/structural/structural-editable', readonly: false },
    ],
  },
});

test('opens a report attribution from a readonly resource via the root', async ({
  attributionDetails,
  attributionsPanel,
  reportView,
  resourcesTree,
  topBar,
}) => {
  await resourcesTree.goto('readonly-only', 'hidden.ts');
  await topBar.gotoReportView();
  await reportView.openAttributionInAuditView(editableManualId);

  await topBar.assert.auditViewIsActive();
  await resourcesTree.assert.resourceAtPathIsSelected('/');
  await attributionsPanel.assert.selectedTabIs('onChildren');
  await attributionsPanel.packageCard.assert.isVisible(editableManual);
  await attributionDetails.attributionForm.assert.nameIs(
    editableManual.packageName!,
  );
  await expect(attributionDetails.attributionForm.name).toBeEditable();
});
