// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getFilterExcludedAttributionsFixture } from '../../testing/filter-excluded-attributions';
import { faker, test } from '../utils';

// Extracted from src/e2e-tests/__tests__/filtering-attributions.test.ts when
// that suite was converted to integration tests. This case stays e2e: when
// ported to the happy-dom harness, the pending-navigation reveal of the
// filter-excluded attribution (PackagesPanel effect chain) settled
// unreliably under parallel load, while it is deterministic in a real
// browser.

const {
  attributionId1,
  packageInfo1,
  resources,
  resourcesToAttributions,
  manualAttributions,
} = getFilterExcludedAttributionsFixture();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources,
    }),
    outputData: faker.opossum.outputData({
      manualAttributions,
      resourcesToAttributions,
    }),
  },
});

test('navigates to an attribution excluded by audit filters', async ({
  attributionDetails,
  attributionsPanel,
  reportView,
  topBar,
}) => {
  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.firstParty.click();
  await attributionsPanel.closeFilterMenu();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);

  await topBar.gotoReportView();
  await topBar.assert.reportViewIsActive();
  await reportView.assert.attributionIsVisible(attributionId1);
  await reportView.openAttributionInAuditView(attributionId1);

  await topBar.assert.auditViewIsActive();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionDetails.attributionForm.assert.nameIs(
    packageInfo1.packageName!,
  );
});
