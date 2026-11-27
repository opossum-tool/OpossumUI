// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';

import {
  type CommandName,
  type CommandParams,
  executeCommand,
} from '../ElectronBackend/api/commands';
import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { View } from '../Frontend/enums/enums';
import { setSelectedAttributionId } from '../Frontend/state/actions/resource-actions/audit-view-simple-actions';
import { navigateToView } from '../Frontend/state/actions/view-actions/view-actions';
import {
  getAttributionSelectionPendingResourceId,
  getIsPackageInfoDirty,
  getSelectedAttributionId,
} from '../Frontend/state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import type { State } from '../Frontend/types/types';
import { ATTRIBUTION_PAGE_SIZE } from '../Frontend/util/attribution-page-query';
import { text } from '../shared/text';
import { unexpectedBackendCall } from '../testing/backend-integration';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clearPanelSearch,
  clearTreeSearch,
  clickPackageCard,
  clickTopBarViewButton,
  expectAttributionDetailsLoading,
  expectAttributionDetailsReady,
  expectAttributionFormMatchesPackageInfo,
  expectFormFieldValues,
  expectPackageCards,
  expectResourceItemsNotShown,
  expectResourceItemsShown,
  expectTextVisible,
  expectUnsavedChangesPopupClosed,
  expectUnsavedChangesPopupOpen,
  fillFormField,
  fillPanelSearch,
  gotoResource,
  LINKED_RESOURCES_TREE,
  resourceTreeItem,
  saveChangesInAttributionColumn,
  searchTree,
} from '../testing/ui';

const resourceName = faker.opossum.resourceName();
const [aiId, aiPackage] = faker.opossum.rawAttribution({
  packageName: 'AI package',
});
const [manualId, manualPackage] = faker.opossum.rawAttribution({
  packageName: 'Manual package',
});
const [secondAiId, secondAiPackage] = faker.opossum.rawAttribution({
  packageName: 'Other AI attribution',
  aiAttributes: { humanModified: true, deferredFields: {} },
});
const data = getParsedInputFileEnrichedWithTestData({
  resources: { [resourceName]: 1 },
  manualAttributions: deserializeAttributions({
    [aiId]: { ...aiPackage, aiAttributes: {} },
    [manualId]: manualPackage,
    [secondAiId]: secondAiPackage,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName)]: [aiId, manualId, secondAiId],
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

const firstResource = 'first-resource.ts';
const targetResource = 'target-resource.ts';
const firstResourcePath = faker.opossum.filePath(firstResource);
const targetResourcePath = faker.opossum.filePath(targetResource);
const [firstAuditId, firstAuditPackage] = faker.opossum.rawAttribution({
  packageName: 'A first audit attribution',
});
const [targetAuditId, targetAuditPackage] = faker.opossum.rawAttribution({
  packageName: 'Target audit attribution',
});
const [editableAiId, editableAiPackage] = faker.opossum.rawAttribution({
  packageName: 'Z editable AI attribution',
  aiAttributes: { deferredFields: {} },
});
const selectionPendingData = getParsedInputFileEnrichedWithTestData({
  resources: { [firstResource]: 1, [targetResource]: 1 },
  manualAttributions: deserializeAttributions({
    [firstAuditId]: firstAuditPackage,
    [targetAuditId]: targetAuditPackage,
    [editableAiId]: editableAiPackage,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [firstResourcePath]: [firstAuditId, editableAiId],
    [targetResourcePath]: [targetAuditId],
  }),
});

function pauseApiRequest<C extends CommandName>(
  commandToPause: C,
  matches: (params: CommandParams<C>) => boolean,
) {
  let released = false;
  const { promise: requested, resolve: resolveRequested } =
    Promise.withResolvers<void>();
  const { promise: gate, resolve: resolveGate } = Promise.withResolvers<void>();
  const api = vi.mocked(window.electronAPI.api);
  const originalImplementation = api.getMockImplementation();
  const implementationToRestore =
    originalImplementation === unexpectedBackendCall
      ? executeCommand
      : (originalImplementation ?? executeCommand);

  const release = () => {
    if (released) {
      return;
    }
    released = true;
    resolveGate();
    api.mockImplementation(implementationToRestore);
    activePauses.delete(release);
  };

  api.mockImplementation(async (command, params) => {
    if (command === commandToPause && matches(params as CommandParams<C>)) {
      resolveRequested();
      await gate;
    }
    return executeCommand(command, params as never);
  });
  activePauses.add(release);

  return { requested, release };
}

const activePauses = new Set<() => void>();

afterEach(() => {
  activePauses.forEach((release) => release());
});

function expectAuditSelectionPending(
  store: { getState: () => State },
  resourcePath: string,
): void {
  expect(getAttributionSelectionPendingResourceId(store.getState())).toBe(
    resourcePath,
  );
}

async function expectAuditSelectionComplete(store: {
  getState: () => State;
}): Promise<void> {
  await waitFor(() =>
    expect(
      getAttributionSelectionPendingResourceId(store.getState()),
    ).toBeNull(),
  );
}

async function expectSavedComment(
  attributionId: string,
  comment: string,
): Promise<void> {
  await waitFor(async () => {
    const result = await executeCommand('getAttributionData', {
      attributionUuid: attributionId,
    });
    expect(result.result.packageInfo.comment).toBe(comment);
  });
}

describe('AI Review view', () => {
  it('waits for its selected attribution data before enabling interaction', async () => {
    const pausedAttribution = pauseApiRequest(
      'getAttributionData',
      (params) => params.attributionUuid === aiId,
    );
    await renderApp({
      data,
      actions: [setSelectedAttributionId(aiId), navigateToView(View.AiReview)],
    });
    await pausedAttribution.requested;
    await expectAttributionDetailsLoading();

    pausedAttribution.release();
    await expectAttributionDetailsReady();
  });

  it('keeps AI Review editable while Audit selection is pending', async () => {
    const { store } = await renderApp({ data: selectionPendingData });
    await gotoResource(firstResource);
    await expectAttributionFormMatchesPackageInfo(firstAuditPackage);

    const pausedPage = pauseApiRequest(
      'listAttributionsPage',
      (params) => params.resourcePathForRelationships === targetResourcePath,
    );
    await userEvent.click(resourceTreeItem(targetResource));
    await pausedPage.requested;
    expect(getSelectedAttributionId(store.getState())).toBe('');
    expectAuditSelectionPending(store, targetResourcePath);

    await clickTopBarViewButton('aiReview');
    await expectAttributionDetailsReady();
    await expectAttributionFormMatchesPackageInfo(editableAiPackage);
    const reviewedComment = 'Reviewed while Audit loads';
    fillFormField('comment', reviewedComment);
    await saveChangesInAttributionColumn();
    await expectSavedComment(editableAiId, reviewedComment);
    expectAuditSelectionPending(store, targetResourcePath);

    await clickTopBarViewButton('audit');
    await expectAttributionDetailsLoading();
    expectAuditSelectionPending(store, targetResourcePath);
    pausedPage.release();
    await expectAuditSelectionComplete(store);
    expect(getSelectedAttributionId(store.getState())).toBe(targetAuditId);
    await expectAttributionDetailsReady();
    await expectAttributionFormMatchesPackageInfo(targetAuditPackage);
  });

  it('selects one status at a time while keeping overlapping counts independent', async () => {
    await renderApp({ data, actions: [navigateToView(View.AiReview)] });
    const pills = within(
      screen.getByRole('group', { name: text.aiReviewView.statusFilters }),
    );
    const all = await pills.findByRole('button', { name: 'All 2' });
    expect(all).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(pills.getByRole('button', { name: 'Deferred 1' }));
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [secondAiPackage],
      [aiPackage, manualPackage],
    );
    await expectAttributionFormMatchesPackageInfo(secondAiPackage);
    expect(all).toHaveAttribute('aria-pressed', 'false');
    expect(pills.getByRole('button', { name: 'Deferred 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      pills.getByRole('button', { name: 'Fully resolved 1' }),
    ).toBeVisible();

    await userEvent.click(
      pills.getByRole('button', { name: 'Human modified 1' }),
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [secondAiPackage],
      [aiPackage],
    );
    expect(pills.getByRole('button', { name: 'Deferred 1' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(
      pills.getByRole('button', { name: 'Fully resolved 1' }),
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage],
      [secondAiPackage],
    );
    await expectAttributionFormMatchesPackageInfo(aiPackage);

    await userEvent.click(
      pills.getByRole('button', { name: 'Needs follow-up 0' }),
    );
    await expectTextVisible(text.aiReviewView.noMatchingAttributions);
    await userEvent.click(all);
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage, secondAiPackage],
      [manualPackage],
    );
  });

  it('updates status counts with search and restores matching results when cleared', async () => {
    await renderApp({ data, actions: [navigateToView(View.AiReview)] });
    const pills = within(
      screen.getByRole('group', { name: text.aiReviewView.statusFilters }),
    );
    await userEvent.click(
      await pills.findByRole('button', { name: 'Deferred 1' }),
    );
    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    expect(await pills.findByRole('button', { name: 'All 1' })).toBeVisible();
    expect(pills.getByRole('button', { name: 'Deferred 0' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expectTextVisible(text.aiReviewView.noMatchingAttributions);
    await clearPanelSearch('ai-review-attributions-header');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [secondAiPackage],
      [aiPackage],
    );
  });

  it('refreshes status counts after saving a human edit without resolving deferrals', async () => {
    await renderApp({ data, actions: [navigateToView(View.AiReview)] });
    await expectAttributionFormMatchesPackageInfo(aiPackage);
    fillFormField('comment', 'Human review');
    await saveChangesInAttributionColumn();
    const pills = within(
      screen.getByRole('group', { name: text.aiReviewView.statusFilters }),
    );
    expect(
      await pills.findByRole('button', { name: 'Human modified 2' }),
    ).toBeVisible();
    expect(pills.getByRole('button', { name: 'Deferred 1' })).toBeVisible();
    expect(
      pills.getByRole('button', { name: 'Fully resolved 1' }),
    ).toBeVisible();
  });

  it('preserves a dirty draft when changing pills and confirms explicit navigation', async () => {
    await renderApp({ data, actions: [navigateToView(View.AiReview)] });
    await expectAttributionFormMatchesPackageInfo(aiPackage);
    fillFormField('comment', 'Unsaved review');
    const pills = within(
      screen.getByRole('group', { name: text.aiReviewView.statusFilters }),
    );
    await userEvent.click(
      await pills.findByRole('button', { name: 'Deferred 1' }),
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [secondAiPackage],
      [aiPackage],
    );
    await expectFormFieldValues({ comment: 'Unsaved review' });
    await expectUnsavedChangesPopupClosed();
    await clickPackageCard(ATTRIBUTIONS_PANEL, secondAiPackage);
    await expectUnsavedChangesPopupOpen();
  });

  it('shows only AI attributions, follows selection, and confirms navigation with a dirty draft', async () => {
    const { store } = await renderApp({
      data,
      actions: [navigateToView(View.AiReview)],
    });

    expect(
      within(screen.getByTestId('ai-review-attributions-header')).getByText(
        text.packageLists.attributionsPanelTitle,
      ),
    ).toBeVisible();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage, secondAiPackage],
      [manualPackage],
    );
    await expectAttributionFormMatchesPackageInfo(aiPackage);

    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage],
      [secondAiPackage, manualPackage],
    );
    expect(getSelectedAttributionId(store.getState())).toBe(aiId);
    expect(getIsPackageInfoDirty(store.getState())).toBe(false);
    await expectAttributionFormMatchesPackageInfo(aiPackage);
    await clearPanelSearch('ai-review-attributions-header');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage, secondAiPackage],
      [manualPackage],
    );

    await clickPackageCard(ATTRIBUTIONS_PANEL, secondAiPackage);
    await expectAttributionFormMatchesPackageInfo(secondAiPackage);
    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage],
      [secondAiPackage, manualPackage],
    );
    await waitFor(() =>
      expect(getSelectedAttributionId(store.getState())).toBe(aiId),
    );
    await expectAttributionFormMatchesPackageInfo(aiPackage);

    await clearPanelSearch('ai-review-attributions-header');
    await clickPackageCard(ATTRIBUTIONS_PANEL, secondAiPackage);
    await expectAttributionFormMatchesPackageInfo(secondAiPackage);

    fillFormField('comment', 'AI review draft');
    await fillPanelSearch('ai-review-attributions-header', 'AI package');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage],
      [secondAiPackage, manualPackage],
    );
    await expectFormFieldValues({ comment: 'AI review draft' });
    await expectUnsavedChangesPopupClosed();

    await clearPanelSearch('ai-review-attributions-header');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage, secondAiPackage],
      [manualPackage],
    );
    await clickPackageCard(ATTRIBUTIONS_PANEL, aiPackage);
    await expectUnsavedChangesPopupOpen();
    expect(screen.getByText(text.unsavedChangesPopup.discard)).toBeVisible();
  });

  it('replaces a manual attribution selected before entering AI review', async () => {
    const { store } = await renderApp({
      data,
      actions: [
        setSelectedAttributionId(manualId),
        navigateToView(View.AiReview),
      ],
    });

    await expectAttributionFormMatchesPackageInfo(aiPackage);
    expect(getSelectedAttributionId(store.getState())).toBe(aiId);
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [aiPackage, secondAiPackage],
      [manualPackage],
    );
  });

  it('shows a no-matches empty state without mounting the details form', async () => {
    const { store } = await renderApp({
      data,
      actions: [navigateToView(View.AiReview)],
    });

    await expectAttributionFormMatchesPackageInfo(aiPackage);
    await fillPanelSearch('ai-review-attributions-header', 'Manual package');
    expect(getIsPackageInfoDirty(store.getState())).toBe(false);

    await expectTextVisible(text.aiReviewView.noMatchingAttributions);
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

    await expectTextVisible(text.aiReviewView.noAttributionsToReview);
    expect(
      screen.queryByLabelText('attribution column'),
    ).not.toBeInTheDocument();
  });

  it('shows the project empty state when only manual attributions exist', async () => {
    const manualOnlyData = getParsedInputFileEnrichedWithTestData({
      resources: { [resourceName]: 1 },
      manualAttributions: deserializeAttributions({
        [manualId]: manualPackage,
      }),
      resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: [manualId],
      }),
    });
    const { store } = await renderApp({
      data: manualOnlyData,
      actions: [
        setSelectedAttributionId(manualId),
        navigateToView(View.AiReview),
      ],
    });

    await expectTextVisible(text.aiReviewView.noAttributionsToReview);
    expect(getSelectedAttributionId(store.getState())).toBe('');
    expect(
      screen.queryByLabelText('attribution column'),
    ).not.toBeInTheDocument();
    await expectPackageCards(ATTRIBUTIONS_PANEL, [], [manualPackage]);
  });

  it('keeps a selection that is beyond the first page', async () => {
    const attributions = Array.from(
      { length: ATTRIBUTION_PAGE_SIZE + 1 },
      (_, index) =>
        faker.opossum.rawAttribution({
          packageName: `AI package ${String(index).padStart(3, '0')}`,
          aiAttributes: {},
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
