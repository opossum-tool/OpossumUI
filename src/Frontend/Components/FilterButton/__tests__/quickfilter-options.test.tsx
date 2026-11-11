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
  it('offers the quickfilters menu entry only when quickfilters exist or filters are active', async () => {
    const view = await renderQuickfilterButton();
    await openFilterMenu();
    expect(
      screen.queryByRole('menuitem', { name: text.quickfilters.title }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    view.unmount();

    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [makeQuickfilter()] }),
    ]);
    await openFilterMenu();
    expect(
      screen.getByRole('menuitem', { name: text.quickfilters.title }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  });

  it('highlights the quickfilters entry while manual filters are active and explains why on hover', async () => {
    await renderQuickfilterButton();

    await openFilterMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
    );
    const entry = screen.getByRole('menuitem', {
      name: text.quickfilters.title,
    });
    const icon = within(entry).getByTestId('BookmarkAddIcon');
    expect(icon).toHaveClass('MuiSvgIcon-colorPrimary');

    await userEvent.hover(icon);
    expect(
      await screen.findByText(text.quickfilters.saveHint),
    ).toBeInTheDocument();
  });

  it('hides the save hint when the selection comes from an applied quickfilter', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    await openFilterMenu();
    // Without active filters the entry icon stays neutral.
    const entry = screen.getByRole('menuitem', {
      name: text.quickfilters.title,
    });
    expect(
      within(entry).queryByTestId('BookmarkAddIcon'),
    ).not.toBeInTheDocument();

    const panel = await openQuickfiltersPanelFromMenu();
    await userEvent.click(row(panel, quickfilter.name));

    // Close the side panel; the filter menu stays open.
    await userEvent.keyboard('{Escape}');
    const updatedEntry = screen.getByRole('menuitem', {
      name: text.quickfilters.title,
    });
    expect(
      within(updatedEntry).queryByTestId('BookmarkAddIcon'),
    ).not.toBeInTheDocument();
  });

  it('hides the save row while the selection comes from an applied quickfilter', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, quickfilter.name));

    expect(
      within(panel).queryByRole('button', { name: text.quickfilters.save }),
    ).not.toBeInTheDocument();
  });

  it('focuses the save action when opening the panel with active filters', async () => {
    await renderQuickfilterButton();

    const panel = await openQuickfiltersPanelWithActiveFilters();
    expect(
      within(panel).getByRole('button', { name: text.quickfilters.save }),
    ).toHaveFocus();
  });

  it('saves the current filters as a quickfilter and activates it', async () => {
    const { store } = await renderQuickfilterButton();
    const name = faker.string.alphanumeric(8);

    const panel = await openQuickfiltersPanelWithActiveFilters();
    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.save,
      }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      name,
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.quickfilters.saveAction }),
    );

    const updatedPanel = await screen.findByRole('dialog', {
      name: text.quickfilters.title,
    });
    const savedRow = within(updatedPanel).getByRole('button', {
      name: text.quickfilters.apply(name),
    });
    expect(savedRow).toHaveAttribute('aria-pressed', 'true');
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

  it('applies a quickfilter from the panel and preserves the current sorting', async () => {
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

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, quickfilter.name));

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: ['firstParty'],
      search: '',
      valueFilters: {},
      sorting: 'criticality',
      activeQuickfilterIds: [quickfilter.id],
    });
    expect(row(panel, quickfilter.name)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(panel).toBeInTheDocument();
  });

  it('resets the filters when clicking the active quickfilter again', async () => {
    const quickfilter = makeQuickfilter({
      name: 'My quickfilter',
      filters: { filters: ['firstParty'], search: 'react', valueFilters: {} },
    });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, quickfilter.name));
    await userEvent.click(row(panel, quickfilter.name));

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: [],
      search: '',
      valueFilters: {},
      sorting: 'alphabetically',
    });
    expect(row(panel, quickfilter.name)).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('keeps the quickfilter active when filters are changed manually', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    let panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, quickfilter.name));
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.thirdParty }),
    );

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({
      filters: ['firstParty', 'thirdParty'],
      activeQuickfilterIds: [quickfilter.id],
    });

    // The filter menu stays open (the side panel closed when another menu
    // item was clicked); reopen the panel from it.
    panel = await openQuickfiltersPanelFromMenu();
    expect(row(panel, quickfilter.name)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('deselects a quickfilter when one of its conditions is removed manually', async () => {
    const quickfilter = makeQuickfilter({ name: 'My quickfilter' });
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [quickfilter] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, quickfilter.name));
    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({ activeQuickfilterIds: [quickfilter.id] });

    // Removing the quickfilter's firstParty filter no longer meets its
    // conditions, so the quickfilter deselects itself.
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.filters.firstParty }),
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

  it('selects only the quickfilter that was applied when duplicates exist', async () => {
    const first = makeQuickfilter({ name: 'First' });
    const second = makeQuickfilter({ name: 'Second' });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'First'));

    expect(row(panel, 'First')).toHaveAttribute('aria-pressed', 'true');
    expect(row(panel, 'Second')).toHaveAttribute('aria-pressed', 'false');
  });

  it('saves on Enter and trims the name', async () => {
    const { store } = await renderQuickfilterButton();
    const name = faker.string.alphanumeric(8);

    const panel = await openQuickfiltersPanelWithActiveFilters();
    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.save,
      }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      `  ${name}  `,
    );
    await userEvent.keyboard('{Enter}');

    const updatedPanel = await screen.findByRole('dialog', {
      name: text.quickfilters.title,
    });
    expect(
      within(updatedPanel).getByRole('button', {
        name: text.quickfilters.apply(name),
      }),
    ).toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toMatchObject([
      { name },
    ]);
  });

  it('returns to the quickfilter list without saving for a blank name', async () => {
    const updateUserSettings = vi.mocked(window.electronAPI.updateUserSettings);
    await renderQuickfilterButton();
    updateUserSettings.mockClear();

    const panel = await openQuickfiltersPanelWithActiveFilters();
    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.save,
      }),
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
      await screen.findByRole('dialog', { name: text.quickfilters.title }),
    ).toBeInTheDocument();
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

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, quickfilter.name));

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

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'First party only'));
    await userEvent.click(row(panel, 'MIT license'));

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: ['firstParty'],
      search: '',
      valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      sorting: 'alphabetically',
      activeQuickfilterIds: [first.id, second.id],
    });
    expect(row(panel, 'First party only')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(row(panel, 'MIT license')).toHaveAttribute('aria-pressed', 'true');
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

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'First party only'));
    await userEvent.click(row(panel, 'MIT license'));
    await userEvent.click(row(panel, 'First party only'));

    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toEqual({
      filters: [],
      search: '',
      valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      sorting: 'alphabetically',
      activeQuickfilterIds: [second.id],
    });
    expect(row(panel, 'First party only')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(row(panel, 'MIT license')).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables conflicting quickfilters with a tooltip and ignores applying them', async () => {
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

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'React search'));
    const conflictingRow = row(panel, 'Vue search');
    expect(
      within(panel).getByRole('button', {
        name: text.quickfilters.apply('React search'),
      }),
    ).not.toHaveAttribute('aria-disabled', 'true');

    expect(conflictingRow).toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(conflictingRow);
    expect(
      await screen.findByText(text.quickfilters.conflictsWithFilters),
    ).toBeInTheDocument();

    await userEvent.click(conflictingRow);
    expect(panel).toBeInTheDocument();
    expect(
      store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
    ).toMatchObject({ search: 'react' });
  });

  it('disables quickfilters with classifications the project does not define', async () => {
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

    const panel = await openQuickfiltersPanel();

    expect(row(panel, known.name)).not.toHaveAttribute('aria-disabled', 'true');

    const unknownRow = row(panel, unknown.name);
    expect(unknownRow).toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(unknownRow);
    expect(
      await screen.findByText(text.quickfilters.incompatibleWithProject),
    ).toBeInTheDocument();
    await userEvent.click(unknownRow);
    expect(panel).toBeInTheDocument();
  });

  it('disables quickfilters whose classification or criticality filter is hidden by settings', async () => {
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

    const panel = await openQuickfiltersPanel();

    expect(row(panel, withClassification.name)).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(row(panel, withCriticality.name)).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(row(panel, portable.name)).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('lists active quickfilters that do not fit the project as disabled rows', async () => {
    const incompatible = makeQuickfilter({
      name: 'Incompatible quickfilter',
      filters: { filters: [], search: '', valueFilters: { classification: 7 } },
    });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [incompatible] }),
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        valueFilters: { classification: 7 },
        activeQuickfilterIds: [incompatible.id],
      }),
    ]);

    const panel = await openQuickfiltersPanel();

    const rowNode = row(panel, incompatible.name);
    expect(rowNode).toHaveAttribute('aria-disabled', 'true');
    expect(rowNode).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(rowNode);
    expect(rowNode).toBeInTheDocument();
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

    let panel = await openQuickfiltersPanel();

    expect(row(panel, attributionQuickfilter.name)).toBeInTheDocument();
    expect(
      within(panel).queryByRole('button', {
        name: text.quickfilters.apply(signalQuickfilter.name),
      }),
    ).not.toBeInTheDocument();

    view.unmount();
    await renderQuickfilterButton(
      [setUserSetting({ savedQuickfilters })],
      'signal',
    );

    panel = await openQuickfiltersPanel();

    expect(row(panel, signalQuickfilter.name)).toBeInTheDocument();
    expect(
      within(panel).queryByRole('button', {
        name: text.quickfilters.apply(attributionQuickfilter.name),
      }),
    ).not.toBeInTheDocument();
  });

  it('keeps quickfilters of both scopes when saving from one panel', async () => {
    const { store } = await renderQuickfilterButton(
      [setUserSetting({ savedQuickfilters: [makeQuickfilter()] })],
      'signal',
    );
    const name = faker.string.alphanumeric(8);

    const panel = await openQuickfiltersPanelWithActiveFilters();
    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.save,
      }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: text.quickfilters.nameLabel }),
      name,
    );
    await userEvent.click(
      screen.getByRole('button', { name: text.quickfilters.saveAction }),
    );

    const updatedPanel = await screen.findByRole('dialog', {
      name: text.quickfilters.title,
    });
    expect(row(updatedPanel, name)).toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toEqual([
      expect.objectContaining({ scope: 'attribution' }),
      expect.objectContaining({ name, scope: 'signal' }),
    ]);
  });

  it('lists quickfilters in creation order and allows deleting them in the edit view', async () => {
    const quickfilters = [
      makeQuickfilter({ name: 'oldest', lastUsedAt: 1 }),
      makeQuickfilter({ name: 'intermediate', lastUsedAt: 2 }),
      makeQuickfilter({ name: 'recent', lastUsedAt: 3 }),
      makeQuickfilter({ name: 'newer', lastUsedAt: 4 }),
      makeQuickfilter({ name: 'newest', lastUsedAt: 5 }),
    ];
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: quickfilters }),
    ]);

    const panel = await openQuickfiltersPanel();

    const applyRowLabels = within(panel)
      .getAllByRole('button')
      .filter((button) =>
        button
          .getAttribute('aria-label')
          ?.startsWith(text.quickfilters.apply('')),
      )
      .map((button) => button.getAttribute('aria-label'));
    expect(applyRowLabels).toEqual([
      text.quickfilters.apply('oldest'),
      text.quickfilters.apply('intermediate'),
      text.quickfilters.apply('recent'),
      text.quickfilters.apply('newer'),
      text.quickfilters.apply('newest'),
    ]);

    // The selection list offers no delete buttons; editing (and deleting)
    // happens in the edit view.
    expect(
      within(panel).queryByRole('button', {
        name: text.quickfilters.delete('oldest'),
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(panel).getByRole('button', { name: text.quickfilters.edit }),
    );

    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.delete('oldest'),
      }),
    );

    expect(
      within(panel).queryByRole('button', {
        name: text.quickfilters.delete('oldest'),
      }),
    ).not.toBeInTheDocument();
    expect(store.getState().userSettingsState.savedQuickfilters).toHaveLength(
      4,
    );
  });

  it('reorders quickfilters via the drag handles in the edit view and persists the order', async () => {
    const quickfilters = [
      makeQuickfilter({ name: 'First', lastUsedAt: 1 }),
      makeQuickfilter({ name: 'Second', lastUsedAt: 2 }),
      makeQuickfilter({ name: 'Third', lastUsedAt: 3 }),
    ];
    const { store } = await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: quickfilters }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(
      within(panel).getByRole('button', { name: text.quickfilters.edit }),
    );

    const dragHandle = () =>
      within(panel).getByRole('button', {
        name: text.quickfilters.reorder('Third'),
      });

    // Keyboard reordering via the handle (drag is pointer-based and cannot be
    // simulated in happy-dom).
    dragHandle().focus();
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{ArrowUp}');

    // The order persists to the saved settings.
    expect(
      store.getState().userSettingsState.savedQuickfilters.map(({ name }) => {
        return name;
      }),
    ).toEqual(['Third', 'First', 'Second']);

    await userEvent.click(
      within(panel).getByRole('button', {
        name: text.quickfilters.finishEditing,
      }),
    );
    const applyRowLabels = within(panel)
      .getAllByRole('button')
      .filter((button) =>
        button
          .getAttribute('aria-label')
          ?.startsWith(text.quickfilters.apply('')),
      )
      .map((button) => button.getAttribute('aria-label'));
    expect(applyRowLabels).toEqual([
      text.quickfilters.apply('Third'),
      text.quickfilters.apply('First'),
      text.quickfilters.apply('Second'),
    ]);
  });

  it('stays open while toggling quickfilters so combinations can be composed', async () => {
    const first = makeQuickfilter({ name: 'First' });
    const second = makeQuickfilter({ name: 'Second' });
    await renderQuickfilterButton([
      setUserSetting({ savedQuickfilters: [first, second] }),
    ]);

    const panel = await openQuickfiltersPanel();
    await userEvent.click(row(panel, 'First'));

    expect(screen.getByRole('dialog', { name: text.quickfilters.title })).toBe(
      panel,
    );
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

async function openQuickfiltersPanel(): Promise<HTMLElement> {
  await openFilterMenu();
  return openQuickfiltersPanelFromMenu();
}

async function openQuickfiltersPanelFromMenu(): Promise<HTMLElement> {
  await userEvent.click(
    screen.getByRole('menuitem', { name: text.quickfilters.title }),
  );
  return screen.findByRole('dialog', {
    name: text.quickfilters.title,
  });
}

async function openQuickfiltersPanelWithActiveFilters(): Promise<HTMLElement> {
  await openFilterMenu();
  await userEvent.click(
    screen.getByRole('menuitem', { name: text.filters.firstParty }),
  );
  await userEvent.click(
    screen.getByRole('menuitem', { name: text.quickfilters.title }),
  );
  return screen.findByRole('dialog', {
    name: text.quickfilters.title,
  });
}
