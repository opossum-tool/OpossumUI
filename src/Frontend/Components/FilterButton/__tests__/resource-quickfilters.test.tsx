// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SavedResourceQuickfilter } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import type { Action } from '../../../state/configure-store';
import {
  hasActiveResourceTreeFilters,
  type ResourceTreeFilters,
  useResourceTreeFilters,
} from '../../../state/variables/use-filters';
import { renderComponent } from '../../../test-helpers/render';
import { UnreviewedIcon } from '../../Icons/Icons';
import { FilterButton } from '../FilterButton';
import { createLicenseFilterOption } from '../license-editor';
import { useResourceQuickfilterOption } from '../use-resource-quickfilter-options';

function resourceFilters(store: {
  getState(): { variablesState: Record<string, unknown> };
}): ResourceTreeFilters {
  return store.getState().variablesState[
    'resource-tree-filters'
  ] as ResourceTreeFilters;
}

describe('quickfilters in the resource tree filter menu', () => {
  it('always offers the quickfilters menu entry and shows an empty panel without quickfilters', async () => {
    await renderResourceFilterButton();
    await openFilterMenu();
    expect(
      screen.getByRole('menuitem', { name: text.quickfilters.title }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.title }),
    );
    expect(
      await screen.findByText(text.quickfilters.empty),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  });

  it('saves the current resource filters as a quickfilter and activates it', async () => {
    const { store } = await renderResourceFilterButton();
    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.unreviewed }),
    );

    const panel = await openQuickfiltersPanelFromMenu();
    await userEvent.click(
      within(panel).getByRole('button', { name: text.quickfilters.save }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      'Unreviewed files',
    );
    await userEvent.keyboard('{Enter}');

    const savedQuickfilter = store
      .getState()
      .userSettingsState.savedQuickfilters.at(0);
    expect(savedQuickfilter).toEqual({
      id: expect.any(String),
      name: 'Unreviewed files',
      lastUsedAt: expect.any(Number),
      scope: 'resource',
      filters: {
        onlyUnreviewedFiles: true,
        onlyWithAiDeferredAttributions: false,
        selectedLicenses: [],
        licenseSearches: undefined,
      },
    });
    expect(resourceFilters(store)).toMatchObject({
      onlyUnreviewedFiles: true,
      activeQuickfilterIds: [savedQuickfilter?.id],
    });
  });

  it('combines quickfilters by OR-ing filters and unioning licenses', async () => {
    const unreviewed = makeQuickfilter({ name: 'Unreviewed only' });
    const mit = makeQuickfilter({
      name: 'MIT license',
      filters: {
        onlyUnreviewedFiles: false,
        onlyWithAiDeferredAttributions: false,
        selectedLicenses: [{ id: 'MIT', label: 'MIT' }],
      },
    });
    const aiDeferred = makeQuickfilter({
      name: 'Ai deferred only',
      filters: {
        onlyUnreviewedFiles: false,
        onlyWithAiDeferredAttributions: true,
        selectedLicenses: [],
      },
    });
    const { store } = await renderResourceFilterButton([
      setUserSetting({
        savedQuickfilters: [unreviewed, mit, aiDeferred],
      }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'Unreviewed only'));
    await userEvent.click(row(panel, 'MIT license'));
    await userEvent.click(row(panel, 'Ai deferred only'));

    expect(resourceFilters(store)).toEqual({
      onlyUnreviewedFiles: true,
      onlyWithAiDeferredAttributions: true,
      selectedLicenses: [{ id: 'MIT', label: 'MIT' }],
      activeQuickfilterIds: [unreviewed.id, mit.id, aiDeferred.id],
    });
    expect(row(panel, 'Unreviewed only')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(row(panel, 'Unreviewed only'));
    expect(resourceFilters(store)).toEqual({
      onlyUnreviewedFiles: false,
      onlyWithAiDeferredAttributions: true,
      selectedLicenses: [{ id: 'MIT', label: 'MIT' }],
      activeQuickfilterIds: [mit.id, aiDeferred.id],
    });
  });

  it('deselects a quickfilter when its only condition is toggled off', async () => {
    const unreviewed = makeQuickfilter({ name: 'Unreviewed only' });
    const { store } = await renderResourceFilterButton([
      setUserSetting({ savedQuickfilters: [unreviewed] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'Unreviewed only'));
    expect(resourceFilters(store)).toMatchObject({
      activeQuickfilterIds: [unreviewed.id],
    });

    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.unreviewed }),
    );

    expect(resourceFilters(store).activeQuickfilterIds).toBeUndefined();

    const panelAfter = await openQuickfiltersPanelFromMenu();
    expect(row(panelAfter, 'Unreviewed only')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('clears all applied quickfilters and keeps the other rows unselected', async () => {
    const unreviewed = makeQuickfilter({ name: 'Unreviewed only' });
    const mit = makeQuickfilter({
      name: 'MIT license',
      filters: {
        onlyUnreviewedFiles: false,
        onlyWithAiDeferredAttributions: false,
        selectedLicenses: [{ id: 'MIT', label: 'MIT' }],
      },
    });
    const { store } = await renderResourceFilterButton([
      setUserSetting({ savedQuickfilters: [unreviewed, mit] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'Unreviewed only'));
    await userEvent.click(row(panel, 'MIT license'));

    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.clearAllLabel,
      }),
    );

    expect(resourceFilters(store)).toEqual({
      onlyUnreviewedFiles: false,
      onlyWithAiDeferredAttributions: false,
      selectedLicenses: [],
    });
    expect(row(panel, 'Unreviewed only')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(row(panel, 'MIT license')).toHaveAttribute('aria-pressed', 'false');
  });
});

function row(panel: HTMLElement, name: string): HTMLElement {
  return within(panel).getByRole('button', {
    name: text.quickfilters.apply(name),
  });
}

function makeQuickfilter({
  name = faker.string.sample(),
  lastUsedAt = faker.number.int(),
  filters = {
    onlyUnreviewedFiles: true,
    onlyWithAiDeferredAttributions: false,
    selectedLicenses: [],
  },
}: {
  name?: string;
  lastUsedAt?: number;
  filters?: SavedResourceQuickfilter['filters'];
} = {}): SavedResourceQuickfilter {
  return {
    id: faker.string.uuid(),
    name,
    lastUsedAt,
    scope: 'resource',
    filters,
  };
}

function TestResourceFilterButton() {
  const [filters, setFilters] = useResourceTreeFilters();
  const quickfilterOption = useResourceQuickfilterOption({
    filters,
    setFilters,
  });
  return (
    <FilterButton
      options={[
        {
          kind: 'toggle',
          id: 'unreviewed',
          selected: filters.onlyUnreviewedFiles,
          label: text.filters.unreviewed,
          icon: <UnreviewedIcon noTooltip />,
          onAdd: () =>
            setFilters((prev) => ({
              ...prev,
              onlyUnreviewedFiles: true,
            })),
          onDelete: () =>
            setFilters((prev) => ({
              ...prev,
              onlyUnreviewedFiles: false,
            })),
        },
        createLicenseFilterOption({
          licenses: [],
          selection: {
            licenses: filters.selectedLicenses,
            licenseSearches: filters.licenseSearches ?? [],
          },
          onSelectionChange: (selection) =>
            setFilters((prev) => ({
              ...prev,
              selectedLicenses: selection.licenses,
              licenseSearches: selection.licenseSearches,
            })),
        }),
        ...quickfilterOption,
      ]}
      isActive={hasActiveResourceTreeFilters(filters)}
      onClear={() =>
        setFilters((prev) => ({
          ...prev,
          onlyUnreviewedFiles: false,
          onlyWithAiDeferredAttributions: false,
          selectedLicenses: [],
          licenseSearches: [],
          activeQuickfilterIds: undefined,
        }))
      }
    />
  );
}

async function openFilterMenu(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
}

async function renderResourceFilterButton(actions?: Array<Action>) {
  return renderComponent(<TestResourceFilterButton />, { actions });
}

async function openQuickfiltersPanelFromMenu(): Promise<HTMLElement> {
  await userEvent.click(
    screen.getByRole('menuitem', { name: text.quickfilters.title }),
  );
  return screen.findByRole('dialog', { name: text.quickfilters.title });
}

async function openQuickfiltersPanel(): Promise<HTMLElement> {
  await openFilterMenu();
  return openQuickfiltersPanelFromMenu();
}
