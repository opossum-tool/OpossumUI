// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  QuickfilterScope,
  SavedQuickfilter,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import type { Action } from '../../../state/configure-store';
import {
  hasActiveAttributionFilters,
  initialAttributionFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  useManualAttributionFilters,
} from '../../../state/variables/use-filters';
import { renderComponent } from '../../../test-helpers/render';
import { attributionFilterOptions } from '../../AttributionPanels/attribution-filter-options';
import { FilterButton } from '../FilterButton';
import { useAttributionFilterOptions } from '../use-attribution-filter-options';

describe('quickfilters in the filter menu', () => {
  it('offers saving the current filters only when filters are active', async () => {
    await renderQuickfilterButton();
    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );

    expect(
      screen.queryByRole('menuitem', { name: text.quickfilters.save }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
    );

    expect(
      await screen.findByRole('menuitem', { name: text.quickfilters.save }),
    ).toBeInTheDocument();
  });

  it('saves the current filters as a quickfilter', async () => {
    const { store } = await renderQuickfilterButton();
    const name = faker.string.alphanumeric(8);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.save }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      name,
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.quickfilters.saveAction }),
    );

    expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toEqual([
      {
        id: expect.any(String),
        name,
        lastUsedAt: expect.any(Number),
        scope: 'attribution',
        filters: {
          filters: ['firstParty'],
          search: '',
          valueFilters: {},
        },
      },
    ]);
    expect(window.electronAPI.updateUserSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        savedQuickfilters: expect.any(Array),
      }),
    );
  });

  it('applies a quickfilter and preserves the current sorting', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);
    store.dispatch(
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        sorting: 'criticality',
      }),
    );

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: ['firstParty'],
      search: '',
      valueFilters: {},
      sorting: 'criticality',
    });
    expect(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('saves on Enter and trims the name', async () => {
    const { store } = await renderQuickfilterButton();
    const name = faker.string.alphanumeric(8);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.save }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      `  ${name}  `,
    );
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toMatchObject([
      { name },
    ]);
  });

  it('keeps the save panel open without saving for a blank name', async () => {
    const updateUserSettings = vi.mocked(window.electronAPI.updateUserSettings);
    await renderQuickfilterButton();
    updateUserSettings.mockClear();

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.save }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      '   ',
    );

    const saveButton = screen.getByRole('button', {
      name: text.quickfilters.saveAction,
    });
    expect(saveButton).toBeDisabled();

    await userEvent.keyboard('{Enter}');
    expect(
      screen.getByRole('dialog', { name: text.quickfilters.save }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
    ).toHaveValue('   ');
    expect(updateUserSettings).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );
    expect(
      screen.queryByRole('dialog', { name: text.quickfilters.save }),
    ).not.toBeInTheDocument();
    expect(updateUserSettings).not.toHaveBeenCalled();
  });

  it('applies a quickfilter with search and value filters and can be cleared', async () => {
    const quickfilter = makeQuickfilter({
      name: 'Rich quickfilter',
      filters: {
        filters: ['firstParty'],
        search: 'react',
        valueFilters: {
          classification: 1,
          license: [{ id: 'MIT', label: 'MIT' }],
        },
      },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: ['firstParty'],
      search: 'react',
      valueFilters: {
        classification: 1,
        license: [{ id: 'MIT', label: 'MIT' }],
      },
      sorting: 'alphabetically',
    });

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.packageLists.clearFilters }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: [],
      search: '',
      valueFilters: {},
      sorting: 'alphabetically',
    });
  });

  it('does nothing when clicking an already selected quickfilter', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);
    const updateUserSettings = vi.mocked(window.electronAPI.updateUserSettings);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );
    const stateAfterApply =
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT];
    const callCountAfterApply = updateUserSettings.mock.calls.length;

    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual(stateAfterApply);
    expect(updateUserSettings.mock.calls).toHaveLength(callCountAfterApply);
    expect(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('only shows quickfilters matching the panel scope', async () => {
    const attributionQuickfilter = makeQuickfilter({
      name: 'Attribution quickfilter',
    });
    const signalQuickfilter = makeQuickfilter({
      name: 'Signal quickfilter',
      scope: 'signal',
    });
    const savedQuickfilters = [attributionQuickfilter, signalQuickfilter];
    const view = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters }),
    ]);

    await openFilterMenu();

    expect(
      screen.getByRole('menuitem', { name: attributionQuickfilter.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: signalQuickfilter.name }),
    ).not.toBeInTheDocument();

    view.unmount();
    await renderQuickfilterButton(
      [setUserSetting({ savedQuickfilters })],
      'signal',
    );

    await openFilterMenu();

    expect(
      screen.getByRole('menuitem', { name: signalQuickfilter.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: attributionQuickfilter.name }),
    ).not.toBeInTheDocument();
  });

  it('keeps quickfilters of both scopes when saving from one panel', async () => {
    const { store } = await renderQuickfilterButton(
      [setUserSetting({ savedQuickfilters: [makeQuickfilter()] })],
      'signal',
    );
    const name = faker.string.alphanumeric(8);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.save }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      name,
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.quickfilters.saveAction }),
    );

    expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toEqual([
      expect.objectContaining({ scope: 'attribution' }),
      expect.objectContaining({ name, scope: 'signal' }),
    ]);
  });

  it('shows the three most recently used quickfilters and manages the rest in a panel', async () => {
    const quickfilters = [
      makeQuickfilter({ name: 'oldest', lastUsedAt: 1 }),
      makeQuickfilter({ name: 'old', lastUsedAt: 2 }),
      makeQuickfilter({ name: 'recent', lastUsedAt: 3 }),
      makeQuickfilter({ name: 'newer', lastUsedAt: 4 }),
      makeQuickfilter({ name: 'newest', lastUsedAt: 5 }),
    ];
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: quickfilters }),
    ]);

    await openFilterMenu();

    for (const name of ['newest', 'newer', 'recent']) {
      expect(screen.getByRole('menuitem', { name })).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('menuitem', { name: 'old' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'oldest' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.more }),
    );

    const panel = screen.getByRole('dialog', { name: text.quickfilters.title });
    for (const quickfilter of quickfilters) {
      expect(panel).toContainElement(
        screen.getByRole('button', {
          name: text.quickfilters.apply(quickfilter.name),
        }),
      );
    }

    await userEvent.click(
      screen.getByRole('button', {
        name: text.quickfilters.delete('oldest'),
      }),
    );

    expect(
      screen.queryByRole('button', {
        name: text.quickfilters.apply('oldest'),
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: text.quickfilters.apply('recent'),
      }),
    );

    expect(
      screen.queryByRole('dialog', { name: text.quickfilters.title }),
    ).not.toBeInTheDocument();
    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({ filters: ['firstParty'] });
  });

  it('shows all quickfilters without a manage entry when there are exactly three', async () => {
    const quickfilters = [
      makeQuickfilter({ name: 'first', lastUsedAt: 1 }),
      makeQuickfilter({ name: 'second', lastUsedAt: 2 }),
      makeQuickfilter({ name: 'third', lastUsedAt: 3 }),
    ];
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: quickfilters }),
    ]);

    await openFilterMenu();

    for (const quickfilter of quickfilters) {
      expect(
        screen.getByRole('menuitem', { name: quickfilter.name }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('menuitem', { name: text.quickfilters.more }),
    ).not.toBeInTheDocument();
  });
});

function makeQuickfilter({
  name = faker.string.sample(),
  lastUsedAt = faker.number.int(),
  scope = 'attribution',
  filters = { filters: ['firstParty'], search: '', valueFilters: {} },
}: {
  name?: string;
  lastUsedAt?: number;
  scope?: SavedQuickfilter['scope'];
  filters?: SavedQuickfilter['filters'];
} = {}): SavedQuickfilter {
  return {
    id: faker.string.uuid(),
    name,
    lastUsedAt,
    scope,
    filters,
  };
}

function TestFilterButton({
  scope = 'attribution',
}: {
  scope?: QuickfilterScope;
}) {
  const [filters, setFilters] = useManualAttributionFilters();
  const options = useAttributionFilterOptions({
    filterOptions: attributionFilterOptions,
    filterProps: null,
    licenses: [],
    filters,
    setFilters,
    quickfilterScope: scope,
  });
  return (
    <FilterButton
      options={options}
      isActive={hasActiveAttributionFilters(filters)}
      onClear={() =>
        setFilters({
          ...filters,
          filters: [],
          search: '',
          valueFilters: {},
        })
      }
    />
  );
}

async function openFilterMenu(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
}

async function renderQuickfilterButton(
  actions?: Array<Action>,
  scope?: QuickfilterScope,
) {
  return renderComponent(<TestFilterButton scope={scope} />, { actions });
}
