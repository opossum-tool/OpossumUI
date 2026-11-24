// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  addDiffPopupAuditingOption,
  ATTRIBUTIONS_PANEL,
  clickAttributionColumnButton,
  clickDiffPopupButton,
  clickPackageCard,
  clickPopupButton,
  CONFIRM_SAVE_POPUP_LABEL,
  expectAttributionColumnButtonNotShown,
  expectAttributionColumnButtonShown,
  expectAuditingOptionChipShown,
  expectComparingWithAlertIsVisible,
  expectDiffPopupAuditingOption,
  expectDiffPopupClosed,
  expectDiffPopupOpen,
  expectDiffPopupPackageName,
  expectFormFieldValues,
  expectPackageCardPickerSource,
  expectPackageCards,
  expectPopupHidden,
  fillDiffPopupField,
  fillFormField,
  gotoResource,
  saveChangesInAttributionColumn,
} from '../testing/ui';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId1, manualPackageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, manualPackageInfo2] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: manualPackageInfo1,
    [attributionId2]: manualPackageInfo2,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName2)]: [attributionId2],
  }),
});

describe('comparing attribution via selection mode', () => {
  it('cancels compare-selection mode without opening the diff popup', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await clickAttributionColumnButton('compare-with');

    await expectComparingWithAlertIsVisible();
    // Can't compare the pinned item with itself.
    await expectAttributionColumnButtonNotShown('compare-confirm');

    await clickAttributionColumnButton('cancel');

    await expectAttributionColumnButtonShown('compare-with');
    await expectDiffPopupClosed();
  });

  it('lets the user pick a compare target on another resource via compare-selection mode', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await clickAttributionColumnButton('compare-with');
    await expectComparingWithAlertIsVisible();
    await expectPackageCardPickerSource(
      ATTRIBUTIONS_PANEL,
      manualPackageInfo1,
      true,
    );

    // Compare-selection mode survives navigating to another resource.
    await gotoResource(resourceName2);
    await expectComparingWithAlertIsVisible();
    await expectPackageCardPickerSource(
      ATTRIBUTIONS_PANEL,
      manualPackageInfo2,
      false,
    );

    // Preview the second resource's attribution by clicking its card, like
    // normal browsing.
    await clickPackageCard(ATTRIBUTIONS_PANEL, manualPackageInfo2);
    await expectAttributionColumnButtonShown('compare-confirm');

    await clickAttributionColumnButton('compare-confirm');
    await expectDiffPopupOpen();
    await expectDiffPopupPackageName(
      'left',
      manualPackageInfo1.packageName || '',
    );
    await expectDiffPopupPackageName(
      'right',
      manualPackageInfo2.packageName || '',
    );

    await clickDiffPopupButton('cancel');
    await expectDiffPopupClosed();

    // Closing the read-only diff popup keeps compare-selection mode active
    // without changing the previewed attribution.
    await expectComparingWithAlertIsVisible();
    await expectAttributionColumnButtonShown('compare-confirm');
    await expectFormFieldValues({
      name: manualPackageInfo2.packageName || '',
    });
  });

  it('retains comparison drafts when the global save confirmation is canceled', async () => {
    const draftName = 'retained comparison draft';
    await renderApp({ data });
    await gotoResource(resourceName1);
    await clickAttributionColumnButton('compare-with');
    await gotoResource(resourceName2);
    await clickPackageCard(ATTRIBUTIONS_PANEL, manualPackageInfo2);
    await clickAttributionColumnButton('compare-confirm');

    fillDiffPopupField('right', 'packageName', draftName);
    await clickDiffPopupButton('save');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.buttons.cancel,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectDiffPopupOpen();
    await expectDiffPopupPackageName('right', draftName);
    await clickDiffPopupButton('cancel');
    await expectDiffPopupClosed();
  });

  it('saves edits made to both sides of a comparison', async () => {
    const preexistingLeftPackageName = 'preexisting-left-edit';
    const editedLeftPackageName = faker.lorem.word();
    const editedRightPackageName = 'final-right-edit';

    await renderApp({ data });
    await gotoResource(resourceName1);
    fillFormField('name', preexistingLeftPackageName);
    await saveChangesInAttributionColumn();
    await clickAttributionColumnButton('compare-with');
    await gotoResource(resourceName2);
    await clickPackageCard(ATTRIBUTIONS_PANEL, manualPackageInfo2);
    await clickAttributionColumnButton('compare-confirm');
    await expectDiffPopupOpen();
    await expectDiffPopupPackageName('left', preexistingLeftPackageName);

    await addDiffPopupAuditingOption('left', 'followUp');
    await addDiffPopupAuditingOption('right', 'needsReview');
    await expectDiffPopupAuditingOption('left', 'followUp');
    await expectDiffPopupAuditingOption('right', 'needsReview');

    fillDiffPopupField('left', 'packageName', editedLeftPackageName);
    fillDiffPopupField('right', 'packageName', editedRightPackageName);
    await clickDiffPopupButton('save');
    await clickPopupButton(
      CONFIRM_SAVE_POPUP_LABEL,
      text.saveAttributionsPopup.saveGlobally,
    );
    await expectPopupHidden(CONFIRM_SAVE_POPUP_LABEL);
    await expectDiffPopupClosed();

    await expectFormFieldValues({ name: editedRightPackageName });
    await expectAuditingOptionChipShown('needs-review');

    const editedLeftPackageInfo = {
      ...manualPackageInfo1,
      packageName: editedLeftPackageName,
    };
    await gotoResource(resourceName1);
    await expectPackageCards(ATTRIBUTIONS_PANEL, [editedLeftPackageInfo], []);
    await clickPackageCard(ATTRIBUTIONS_PANEL, editedLeftPackageInfo);
    await expectFormFieldValues({ name: editedLeftPackageName });
    await expectAuditingOptionChipShown('follow-up');
  });
});
