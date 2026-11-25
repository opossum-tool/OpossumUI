// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { View } from '../Frontend/enums/enums';
import { setSelectedAttributionId } from '../Frontend/state/actions/resource-actions/audit-view-simple-actions';
import { navigateToView } from '../Frontend/state/actions/view-actions/view-actions';
import {
  getIsPackageInfoDirty,
  getSelectedAttributionId,
} from '../Frontend/state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { ATTRIBUTION_PAGE_SIZE } from '../Frontend/util/attribution-page-query';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clearPanelSearch,
  clearTreeSearch,
  clickPackageCard,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCards,
  expectResourceItemsNotShown,
  expectResourceItemsShown,
  fillFormField,
  fillPanelSearch,
  LINKED_RESOURCES_TREE,
  searchTree,
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
    [aiId]: { ...aiPackage, aiAttributes: {} },
    [manualId]: manualPackage,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName)]: [aiId, manualId],
  }),
});
const [linkedResourceName1, linkedResourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const linkedResourcesData = getParsedInputFileEnrichedWithTestData({
  resources: {
    [linkedResourceName1]: 1,
    [linkedResourceName2]: 1,
  },
  manualAttributions: deserializeAttributions({
    [aiId]: { ...aiPackage, aiAttributes: {} },
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(linkedResourceName1)]: [aiId],
    [faker.opossum.filePath(linkedResourceName2)]: [aiId],
  }),
});

describe('AI Review view', () => {
  it('shows all attributions, follows selection, and confirms navigation with a dirty draft', async () => {
    const { store } = await renderApp({
      data,
      actions: [navigateToView(View.AiReview)],
    });

    expect(
      within(screen.getByTestId('ai-review-attributions-header')).getByText(
        text.packageLists.attributionsPanelTitle,
      ),
    ).toBeVisible();
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage, manualPackage]);
    await expectAttributionFormMatchesPackageInfo(aiPackage);

    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage], [manualPackage]);
    expect(getSelectedAttributionId(store.getState())).toBe(aiId);
    expect(getIsPackageInfoDirty(store.getState())).toBe(false);
    await expectAttributionFormMatchesPackageInfo(aiPackage);
    await clearPanelSearch('ai-review-attributions-header');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage, manualPackage]);

    await clickPackageCard(ATTRIBUTIONS_PANEL, manualPackage);
    await expectAttributionFormMatchesPackageInfo(manualPackage);
    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage], [manualPackage]);
    await waitFor(() =>
      expect(getSelectedAttributionId(store.getState())).toBe(aiId),
    );
    await expectAttributionFormMatchesPackageInfo(aiPackage);

    await clearPanelSearch('ai-review-attributions-header');
    await clickPackageCard(ATTRIBUTIONS_PANEL, manualPackage);
    await expectAttributionFormMatchesPackageInfo(manualPackage);

    fillFormField('comment', 'AI review draft');
    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage], [manualPackage]);
    expect(screen.getByDisplayValue('AI review draft')).toBeVisible();
    expect(
      screen.queryByLabelText('unsaved changes popup'),
    ).not.toBeInTheDocument();

    await clearPanelSearch('ai-review-attributions-header');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [aiPackage, manualPackage]);
    await clickPackageCard(ATTRIBUTIONS_PANEL, aiPackage);
    expect(await screen.findByLabelText('unsaved changes popup')).toBeVisible();
    expect(screen.getByText(text.unsavedChangesPopup.discard)).toBeVisible();
  });

  it('shows a no-matches empty state without mounting the details form', async () => {
    const { store } = await renderApp({
      data,
      actions: [navigateToView(View.AiReview)],
    });

    await expectAttributionFormMatchesPackageInfo(aiPackage);
    await fillPanelSearch(
      'ai-review-attributions-header',
      'no matching package',
    );
    expect(getIsPackageInfoDirty(store.getState())).toBe(false);

    expect(
      await screen.findByText(text.aiReviewView.noMatchingAttributions),
    ).toBeVisible();
    expect(
      screen.queryByLabelText('attribution column'),
    ).not.toBeInTheDocument();
  });

  it('searches linked resources and restores them after clearing', async () => {
    await renderApp({
      data: linkedResourcesData,
      actions: [setSelectedAttributionId(aiId), navigateToView(View.AiReview)],
    });

    await expectAttributionFormMatchesPackageInfo(aiPackage);
    await expectResourceItemsShown(
      [linkedResourceName1, linkedResourceName2],
      LINKED_RESOURCES_TREE,
    );

    await searchTree(linkedResourceName1, 'linked-resources-tree-header');
    await expectResourceItemsShown(
      [linkedResourceName1],
      LINKED_RESOURCES_TREE,
    );
    await expectResourceItemsNotShown(
      [linkedResourceName2],
      LINKED_RESOURCES_TREE,
    );

    await clearTreeSearch('linked-resources-tree-header');
    await expectResourceItemsShown(
      [linkedResourceName1, linkedResourceName2],
      LINKED_RESOURCES_TREE,
    );
  });

  it('shows the project empty state without mounting the details form', async () => {
    const emptyData = getParsedInputFileEnrichedWithTestData({
      resources: {},
      manualAttributions: deserializeAttributions({}),
    });

    await renderApp({
      data: emptyData,
      actions: [navigateToView(View.AiReview)],
    });

    expect(
      await screen.findByText(text.aiReviewView.noAttributionsToReview),
    ).toBeVisible();
    expect(
      screen.queryByLabelText('attribution column'),
    ).not.toBeInTheDocument();
  });

  it('keeps a selection that is beyond the first page', async () => {
    const attributions = Array.from(
      { length: ATTRIBUTION_PAGE_SIZE + 1 },
      (_, index) =>
        faker.opossum.rawAttribution({
          packageName: `AI package ${String(index).padStart(3, '0')}`,
        }),
    );
    const [targetAttributionId, targetPackage] =
      attributions[ATTRIBUTION_PAGE_SIZE];
    const outOfPageData = getParsedInputFileEnrichedWithTestData({
      resources: { [resourceName]: 1 },
      manualAttributions: deserializeAttributions(
        Object.fromEntries(attributions),
      ),
      resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: attributions.map(
          ([attributionId]) => attributionId,
        ),
      }),
    });

    await renderApp({
      data: outOfPageData,
      actions: [
        setSelectedAttributionId(targetAttributionId),
        navigateToView(View.AiReview),
      ],
    });

    await expectAttributionFormMatchesPackageInfo(targetPackage);
  });
});
