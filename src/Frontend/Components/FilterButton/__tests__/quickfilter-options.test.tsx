// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  QuickfilterScope,
  SavedQuickfilter,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { initializeDbWithTestData } from '../../../../testing/global-test-helpers';
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
import { setDatabaseInitialized } from '../../../util/backendClient';
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

  it('saves the current filters as a quickfilter and activates it', async () => {
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
    expect(screen.getByRole('menuitem', { name })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const savedQuickfilter = store
      .getState()
      .userSettingsState.savedQuickfilters.at(0);
    expect(savedQuickfilter).toEqual({
      id: expect.any(String),
      name,
      lastUsedAt: expect.any(Number),
      scope: 'attribution',
      filters: {
        filters: ['firstParty'],
        search: '',
        valueFilters: {},
      },
    });
    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: ['firstParty'],
      search: '',
      valueFilters: {},
      sorting: 'alphabetically',
      activeQuickfilterIds: [savedQuickfilter?.id],
    });
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
      activeQuickfilterIds: [quickfilter.id],
    });
    expect(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('resets the filters when clicking the selected quickfilter again', async () => {
    const quickfilter = makeQuickfilter({
      name: 'My quickfilter',
      filters: { filters: ['firstParty'], search: 'react', valueFilters: {} },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: [],
      search: '',
      valueFilters: {},
      sorting: 'alphabetically',
    });
    expect(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('keeps the quickfilter checked when filters are changed manually', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.thirdParty }),
    );

    expect(
      screen.getByRole('menuitem', { name: quickfilter.name }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({
      filters: ['firstParty', 'thirdParty'],
      activeQuickfilterIds: [quickfilter.id],
    });
  });

  it('selects only the quickfilter that was applied when duplicates exist', async () => {
    const first = makeQuickfilter({ name: 'First' });
    const second = makeQuickfilter({ name: 'Second' });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    await openFilterMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'First' }));

    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Second' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
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
    await initializeDbWithTestData({
      config: { classifications: { 1: 'Low' } },
    });
    setDatabaseInitialized(true);
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
      activeQuickfilterIds: [quickfilter.id],
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

  it('combines compatible quickfilters', async () => {
    const first = makeQuickfilter({ name: 'First party only' });
    const second = makeQuickfilter({
      name: 'MIT license',
      filters: {
        filters: [],
        search: '',
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'First party only' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'MIT license' }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: ['firstParty'],
      search: '',
      valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      sorting: 'alphabetically',
      activeQuickfilterIds: [first.id, second.id],
    });
    expect(
      screen.getByRole('menuitem', { name: 'First party only' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('menuitem', { name: 'MIT license' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('removes a single quickfilter from a combination when clicked again', async () => {
    const first = makeQuickfilter({ name: 'First party only' });
    const second = makeQuickfilter({
      name: 'MIT license',
      filters: {
        filters: [],
        search: '',
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'First party only' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'MIT license' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'First party only' }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: [],
      search: '',
      valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      sorting: 'alphabetically',
      activeQuickfilterIds: [second.id],
    });
    expect(
      screen.getByRole('menuitem', { name: 'First party only' }),
    ).toHaveAttribute('aria-selected', 'false');
    expect(
      screen.getByRole('menuitem', { name: 'MIT license' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('fades incompatible quickfilters and ignores clicking them', async () => {
    const first = makeQuickfilter({
      name: 'React search',
      filters: { filters: [], search: 'react', valueFilters: {} },
    });
    const second = makeQuickfilter({
      name: 'Vue search',
      filters: { filters: [], search: 'vue', valueFilters: {} },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'React search' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Vue search' }));

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({ search: 'react' });
    expect(
      screen.getByRole('menuitem', { name: 'React search' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('menuitem', { name: 'Vue search' }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('lists conflicting quickfilters in the manage panel with a conflict tooltip', async () => {
    const first = makeQuickfilter({
      name: 'React search',
      filters: { filters: [], search: 'react', valueFilters: {} },
    });
    const second = makeQuickfilter({
      name: 'Vue search',
      filters: { filters: [], search: 'vue', valueFilters: {} },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'React search' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.manage }),
    );

    const panel = screen.getByRole('dialog', { name: text.quickfilters.title });
    const conflictRow = within(panel).getByRole('button', {
      name: text.quickfilters.apply('Vue search'),
    });
    expect(conflictRow).toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(conflictRow);
    expect(
      await screen.findByText(text.quickfilters.conflictsWithFilters),
    ).toBeInTheDocument();

    await userEvent.click(conflictRow);
    expect(panel).toBeInTheDocument();
    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({ search: 'react' });
  });

  it('hides quickfilters with classifications the project does not define', async () => {
    await initializeDbWithTestData({
      config: { classifications: { 1: 'Low' } },
    });
    setDatabaseInitialized(true);
    const known = makeQuickfilter({
      name: 'Known classification',
      filters: { filters: [], search: '', valueFilters: { classification: 1 } },
    });
    const unknown = makeQuickfilter({
      name: 'Unknown classification',
      filters: { filters: [], search: '', valueFilters: { classification: 7 } },
    });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [unknown, known] }),
    ]);

    await openFilterMenu();

    expect(
      await screen.findByRole('menuitem', { name: known.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: unknown.name }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.manage }),
    );

    const panel = screen.getByRole('dialog', { name: text.quickfilters.title });
    expect(panel).toContainElement(
      screen.getByRole('button', {
        name: text.quickfilters.apply(known.name),
      }),
    );

    const unknownRow = within(panel).getByRole('button', {
      name: text.quickfilters.apply(unknown.name),
    });
    expect(unknownRow).toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(unknownRow);
    expect(
      await screen.findByText(text.quickfilters.incompatibleWithProject),
    ).toBeInTheDocument();
    await userEvent.click(unknownRow);
    expect(panel).toBeInTheDocument();
  });

  it('hides quickfilters whose classification or criticality filter is hidden by settings', async () => {
    const withClassification = makeQuickfilter({
      name: 'Classification quickfilter',
      filters: { filters: [], search: '', valueFilters: { classification: 1 } },
    });
    const withCriticality = makeQuickfilter({
      name: 'Criticality quickfilter',
      filters: { filters: [], search: '', valueFilters: { criticality: 2 } },
    });
    const portable = makeQuickfilter({ name: 'Portable quickfilter' });
    await renderQuickfilterButton([
      setUserSetting({
        savedQuickfilters: [withClassification, withCriticality, portable],
        showClassifications: false,
        showCriticality: false,
      }),
    ]);

    await openFilterMenu();

    expect(
      screen.queryByRole('menuitem', {
        name: withClassification.name,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: withCriticality.name }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: portable.name }),
    ).toBeInTheDocument();
  });

  it('does not let hidden quickfilters consume recent menu slots', async () => {
    const hidden = makeQuickfilter({
      name: 'Hidden quickfilter',
      lastUsedAt: 10,
      filters: { filters: [], search: '', valueFilters: { classification: 7 } },
    });
    const visible = [
      makeQuickfilter({ name: 'oldest', lastUsedAt: 1 }),
      makeQuickfilter({ name: 'middle', lastUsedAt: 2 }),
      makeQuickfilter({ name: 'newest', lastUsedAt: 3 }),
    ];
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [hidden, ...visible] }),
    ]);

    await openFilterMenu();

    for (const quickfilter of visible) {
      expect(
        screen.getByRole('menuitem', { name: quickfilter.name }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('menuitem', { name: hidden.name }),
    ).not.toBeInTheDocument();
  });

  it('hides active quickfilters that do not fit the project but lists them in the manage panel', async () => {
    const incompatible = makeQuickfilter({
      name: 'Incompatible quickfilter',
      filters: { filters: [], search: '', valueFilters: { classification: 7 } },
    });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [incompatible] }),
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        activeQuickfilterIds: [incompatible.id],
      }),
    ]);

    await openFilterMenu();

    expect(
      screen.queryByRole('menuitem', { name: incompatible.name }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.manage }),
    );

    const panel = screen.getByRole('dialog', { name: text.quickfilters.title });
    const row = within(panel).getByRole('button', {
      name: text.quickfilters.apply(incompatible.name),
    });
    expect(row).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(row);
    expect(row).toBeInTheDocument();
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

  it('offers a manage panel to delete quickfilters when there are exactly three', async () => {
    const quickfilters = [
      makeQuickfilter({ name: 'first', lastUsedAt: 1 }),
      makeQuickfilter({ name: 'second', lastUsedAt: 2 }),
      makeQuickfilter({ name: 'third', lastUsedAt: 3 }),
    ];
    const { store } = await renderQuickfilterButton([
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

    await userEvent.click(
      screen.getByRole('menuitem', { name: text.quickfilters.manage }),
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
        name: text.quickfilters.delete('first'),
      }),
    );

    expect(
      screen.queryByRole('button', {
        name: text.quickfilters.apply('first'),
      }),
    ).not.toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toHaveLength(
      2,
    );
  });

  it('offers no manage entry when there are no quickfilters', async () => {
    await renderQuickfilterButton();

    await openFilterMenu();

    expect(
      screen.queryByRole('menuitem', { name: text.quickfilters.manage }),
    ).not.toBeInTheDocument();
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
          activeQuickfilterIds: undefined,
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
