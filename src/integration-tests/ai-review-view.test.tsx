// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, within } from '@testing-library/react';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { View } from '../Frontend/enums/enums';
import { navigateToView } from '../Frontend/state/actions/view-actions/view-actions';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clearPanelSearch,
  clickPackageCard,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCards,
  fillFormField,
  fillPanelSearch,
} from '../testing/ui';

const resourceName = faker.opossum.resourceName();
const [aiId, aiPackage] = faker.opossum.rawAttribution({
  packageName: 'AI package',
});
const [manualId, manualPackage] = faker.opossum.rawAttribution({
  packageName: 'Manual package',
});
const data = getParsedInputFileEnrichedWithTestData({
  resources: { [resourceName]: 1 },
  manualAttributions: deserializeAttributions({
    [aiId]: { ...aiPackage, aiAttributions: {} },
    [manualId]: manualPackage,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName)]: [aiId, manualId],
  }),
});

describe('AI Review view', () => {
  it('shows all attributions, follows selection, and confirms navigation with a dirty draft', async () => {
    await renderApp({ data, actions: [navigateToView(View.AiReview)] });

    expect(
      within(screen.getByTestId('ai-review-attributions-header')).getByText(
        text.packageLists.attributionsPanelTitle,
      ),
    ).toBeVisible();
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage, manualPackage]);
    await fillPanelSearch('ai-review-attributions-header', 'AI');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage], [manualPackage]);
    await clearPanelSearch('ai-review-attributions-header');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage, manualPackage]);

    await clickPackageCard(ATTRIBUTIONS_PANEL, aiPackage);
    await expectAttributionFormMatchesPackageInfo(aiPackage);
    expect(await screen.findByTestId('linked-resources-tree')).toBeVisible();

    await clickPackageCard(ATTRIBUTIONS_PANEL, manualPackage);
    await expectAttributionFormMatchesPackageInfo(manualPackage);
    expect(await screen.findByTestId('linked-resources-tree')).toBeVisible();

    fillFormField('comment', 'AI review draft');
    fireEvent.click(screen.getByText(text.topBar.audit));
    expect(await screen.findByLabelText('unsaved changes popup')).toBeVisible();
    expect(screen.getByText(text.unsavedChangesPopup.discard)).toBeVisible();
  });
});
