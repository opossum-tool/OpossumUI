// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  Attributions,
  ParsedFileContent,
  Relation,
} from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { pathsToResources } from '../../../../../testing/global-test-helpers';
import { closePopupAndUnsetTargets } from '../../../../state/actions/popup-actions/popup-actions';
import {
  setPendingAttributionNavigation,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { openResourceInResourceBrowser } from '../../../../state/actions/resource-actions/navigation-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import type { Action } from '../../../../state/configure-store';
import { getAttributionSelectionPendingResourceId } from '../../../../state/selectors/resource-selectors';
import { ATTRIBUTION_SELECTION_FOR_REPLACEMENT } from '../../../../state/variables/use-attribution-selection-for-replacement';
import { initialAttributionFilters } from '../../../../state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../../test-helpers/render';
import { useAuditAttributionsList } from '../../../../util/use-audit-attributions-list';
import { useSelectedAttributionIsExternal } from '../../../../util/use-selected-attribution';
import {
  PackagesPanel,
  type PackagesPanelChildrenProps,
} from '../PackagesPanel';

vi.mock('../../../../util/use-audit-attributions-list', () => ({
  useAuditAttributionsList: vi.fn(),
}));

vi.mock('../../../../util/use-selected-attribution', () => ({
  useSelectedAttributionIsExternal: vi.fn(),
}));

function mockAttributions(
  attributions: Attributions,
  visibleAttributions: Attributions = attributions,
  scopeByRelation = true,
) {
  const relationCounts = Object.values(attributions).reduce<
    Partial<Record<Relation, { visibleCount: number; editableCount: number }>>
  >((counts, attribution) => {
    const relation = attribution.relation ?? 'unrelated';
    const current = counts[relation] ?? { visibleCount: 0, editableCount: 0 };
    current.visibleCount += 1;
    if (attribution.resourceAccess !== 'readonly') {
      current.editableCount += 1;
    }
    counts[relation] = current;
    return counts;
  }, {});
  vi.mocked(useAuditAttributionsList).mockImplementation(({ relation }) => ({
    attributions: scopeByRelation
      ? Object.fromEntries(
          Object.entries(visibleAttributions).filter(
            ([, attribution]) =>
              (attribution.relation ?? 'unrelated') === relation,
          ),
        )
      : visibleAttributions,
    loading: false,
    relationCounts,
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(() => Promise.resolve()),
    nextPageError: null,
    navigationLoading: false,
    navigationResult:
      visibleAttributions !== attributions
        ? {
            found: true,
            targetRelation: 'resource',
            prefix: {
              attributions,
              offset: 0,
              limit: 200,
              hasNextPage: false,
            },
          }
        : undefined,
    navigationAttributions:
      visibleAttributions !== attributions ? attributions : {},
    navigationRelation:
      visibleAttributions !== attributions ? 'resource' : null,
  }));
}

function renderPackagesPanel({
  attributions,
  visibleAttributions,
  children,
  actions,
  data,
  scopeByRelation,
}: {
  attributions: Attributions;
  visibleAttributions?: Attributions;
  children?: (props: PackagesPanelChildrenProps) => React.ReactNode;
  actions?: Array<Action>;
  data?: ParsedFileContent;
  scopeByRelation?: boolean;
}) {
  mockAttributions(attributions, visibleAttributions, scopeByRelation);
  vi.mocked(useSelectedAttributionIsExternal).mockReturnValue(false);
  return renderComponent(
    <PackagesPanel
      external={false}
      filterOptions={[]}
      renderActions={() => null}
      useAttributionFilters={() => [initialAttributionFilters, vi.fn()]}
    >
      {children ?? (() => null)}
    </PackagesPanel>,
    { actions, data },
  );
}

function rerenderPackagesPanel(
  rerender: (ui: React.ReactElement) => void,
  attributions: Attributions,
) {
  mockAttributions(attributions, attributions, true);
  rerender(
    <PackagesPanel
      external={false}
      filterOptions={[]}
      renderActions={() => null}
      useAttributionFilters={() => [initialAttributionFilters, vi.fn()]}
    >
      {() => null}
    </PackagesPanel>,
  );
}

describe('PackagesPanel', () => {
  it('selects the attribution on the selected resource', async () => {
    const resourceAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    const unrelatedAttribution = faker.opossum.packageInfo({
      relation: 'unrelated',
    });
    const { store } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [resourceAttribution.id]: resourceAttribution,
        [unrelatedAttribution.id]: unrelatedAttribution,
      }),
    });

    act(() =>
      store.dispatch(openResourceInResourceBrowser('/another-resource')),
    );

    await waitFor(() => {
      expect(store.getState().resourceState.selectedAttributionId).toBe(
        resourceAttribution.id,
      );
      expect(
        getAttributionSelectionPendingResourceId(store.getState()),
      ).toBeNull();
    });
  });

  it('does not auto-select an unrelated attribution after resource navigation', async () => {
    const unrelatedAttribution = faker.opossum.packageInfo({
      relation: 'unrelated',
    });
    const { store } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [unrelatedAttribution.id]: unrelatedAttribution,
      }),
      visibleAttributions: {},
    });

    await act(() => store.dispatch(setSelectedResourceId('/another-resource')));

    await waitFor(() => {
      expect(store.getState().resourceState.selectedAttributionId).toBe('');
    });
  });

  it('does not auto-select when a resource navigation is cancelled', async () => {
    const selectedAttribution = faker.opossum.packageInfo({
      relation: 'unrelated',
    });
    const resourceAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    const { store } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [selectedAttribution.id]: selectedAttribution,
        [resourceAttribution.id]: resourceAttribution,
      }),
      scopeByRelation: false,
      actions: [
        setSelectedAttributionId(selectedAttribution.id),
        setTargetSelectedResourceId('/cancelled-resource'),
      ],
    });

    act(() => store.dispatch(closePopupAndUnsetTargets()));

    expect(store.getState().resourceState.selectedAttributionId).toBe(
      selectedAttribution.id,
    );
  });

  it('selects the first visible manual attribution when the selection is filtered out', async () => {
    const selectedAttribution = faker.opossum.packageInfo();
    const replacementAttribution = faker.opossum.packageInfo();
    const { store } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [replacementAttribution.id]: replacementAttribution,
      }),
      actions: [setSelectedAttributionId(selectedAttribution.id)],
    });

    await waitFor(() => {
      expect(store.getState().resourceState.selectedAttributionId).toBe(
        replacementAttribution.id,
      );
    });
  });

  it('keeps a selected attribution that matches outside the loaded page', async () => {
    const selectedAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    const loadedAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [loadedAttribution.id]: loadedAttribution,
        [selectedAttribution.id]: selectedAttribution,
      }),
      visibleAttributions: faker.opossum.attributions({
        [loadedAttribution.id]: loadedAttribution,
      }),
      actions: [setSelectedAttributionId(selectedAttribution.id)],
      data: {
        ...getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [selectedAttribution.id]: selectedAttribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [selectedAttribution.id],
          }),
          resources: pathsToResources([resource]),
        }),
      },
    });

    await waitFor(() => {
      expect(store.getState().resourceState.selectedAttributionId).toBe(
        selectedAttribution.id,
      );
    });
  });

  it('retries a report navigation at the root resource when needed', async () => {
    const selectedAttribution = faker.opossum.packageInfo({
      relation: 'children',
    });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    vi.mocked(useSelectedAttributionIsExternal).mockReturnValue(false);
    vi.mocked(useAuditAttributionsList).mockImplementation((params) => {
      const isRoot = params.criteria.resourcePathForRelationships === '/';
      return {
        attributions: isRoot
          ? { [selectedAttribution.id]: selectedAttribution }
          : {},
        loading: false,
        relation: params.relation,
        relationCounts: isRoot
          ? { children: { visibleCount: 1, editableCount: 1 } }
          : {},
        hasNextPage: false,
        isFetching: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn(() => Promise.resolve()),
        nextPageError: null,
        navigationLoading: false,
        navigationResult: isRoot
          ? undefined
          : {
              found: false,
            },
        navigationAttributions: isRoot ? {} : {},
        navigationRelation: isRoot ? null : null,
      };
    });

    const { store } = await renderComponent(
      <PackagesPanel
        external={false}
        filterOptions={[]}
        renderActions={() => null}
        useAttributionFilters={() => [initialAttributionFilters, vi.fn()]}
      >
        {() => null}
      </PackagesPanel>,
      {
        actions: [
          setSelectedResourceId(resource),
          setSelectedAttributionId(selectedAttribution.id),
          setPendingAttributionNavigation({
            attributionUuid: selectedAttribution.id,
            fallbackResourcePath: '/',
          }),
        ],
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [selectedAttribution.id]: selectedAttribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [selectedAttribution.id],
          }),
          resources: pathsToResources([resource]),
        }),
      },
    );

    await waitFor(() => {
      expect(store.getState().resourceState.selectedResourceId).toBe('/');
      expect(store.getState().resourceState.selectedAttributionId).toBe(
        selectedAttribution.id,
      );
      expect(store.getState().resourceState.pendingAttributionNavigation).toBe(
        null,
      );
    });
  });

  it('enables select-all checkbox when there are attribution IDs', async () => {
    await renderPackagesPanel({ attributions: faker.opossum.attributions() });

    expect(screen.getByRole('checkbox')).toBeEnabled();
  });

  it('disables select-all checkbox when there are no attribution IDs', async () => {
    await renderPackagesPanel({ attributions: {} });

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('disables select-all checkbox when there are attribution IDs but a picker mode is active', async () => {
    const packageInfo = faker.opossum.packageInfo();
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo.id]: packageInfo,
      }),
      actions: [
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo.id],
        }),
      ],
    });

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('checkbox is indeterminate when some but not all attributions are selected', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
      }),
      children: (props) => (
        <button
          onClick={() =>
            props.toggleAttributionSelection(packageInfo1.id, true)
          }
        >
          {'click me'}
        </button>
      ),
    });

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'true');
  });

  it('checkbox is not indeterminate when no attributions are selected', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
      }),
    });

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'false');
  });

  it('checkbox is not indeterminate when all attributions of active relation are selected', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
      children: (props) => (
        <button
          onClick={() => {
            props.toggleAttributionSelection(packageInfo1.id, true);
            props.toggleAttributionSelection(packageInfo2.id, true);
          }}
        >
          {'click me'}
        </button>
      ),
    });

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'false');
  });

  it('selects all attributions', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));

    expect(screen.getByRole('checkbox', { name: 'select all' })).toBeChecked();
  });

  it('keeps select all symbolic across unloaded rows and tracks exclusions', async () => {
    const visibleAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    const unloadedAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    let latestProps: PackagesPanelChildrenProps | undefined;

    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [visibleAttribution.id]: visibleAttribution,
        [unloadedAttribution.id]: unloadedAttribution,
      }),
      visibleAttributions: faker.opossum.attributions({
        [visibleAttribution.id]: visibleAttribution,
      }),
      children: (props) => {
        latestProps = props;
        return (
          <button
            onClick={() =>
              props.toggleAttributionSelection(visibleAttribution.id, false)
            }
          >
            {'deselect visible'}
          </button>
        );
      },
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));
    expect(latestProps?.selection).toMatchObject({
      mode: 'allMatching',
      excludedAttributionUuids: [],
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'deselect visible' }),
    );
    expect(latestProps?.selection).toMatchObject({
      mode: 'allMatching',
      excludedAttributionUuids: [visibleAttribution.id],
    });
    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'true');

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));
    expect(latestProps?.selection).toMatchObject({
      mode: 'allMatching',
      excludedAttributionUuids: [],
    });
  });

  it('selects only editable attributions when readonly cards are visible', async () => {
    const editableAttribution = faker.opossum.packageInfo({
      relation: 'resource',
    });
    const readonlyAttribution = faker.opossum.packageInfo({
      relation: 'resource',
      resourceAccess: 'readonly',
    });
    let selectedIds: Array<string> = [];

    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [editableAttribution.id]: editableAttribution,
        [readonlyAttribution.id]: readonlyAttribution,
      }),
      children: (props) => {
        selectedIds = props.selectedAttributionIds;
        return null;
      },
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));

    expect(selectedIds).toEqual([editableAttribution.id]);
  });

  it('disables select all when the active relation has no editable attributions', async () => {
    const readonlyAttribution = faker.opossum.packageInfo({
      relation: 'resource',
      resourceAccess: 'readonly',
    });
    const editableAttribution = faker.opossum.packageInfo({
      relation: 'unrelated',
    });

    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [readonlyAttribution.id]: readonlyAttribution,
        [editableAttribution.id]: editableAttribution,
      }),
    });

    expect(screen.getByRole('checkbox', { name: 'select all' })).toBeDisabled();
  });

  it('resets multi-selected IDs when active relation changes', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));
    await userEvent.click(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    );

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).not.toBeChecked();
  });

  it('does not reset multi-selected IDs when active relation changes and in replacement mode', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
      children: (props) => (
        <button
          onClick={() =>
            props.toggleAttributionSelection(packageInfo1.id, true)
          }
        >
          {'click me'}
        </button>
      ),
      actions: [
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo1.id],
        }),
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));
    await userEvent.click(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    );

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'true');
  });

  it('adjusts multi-selected IDs when previously visible attributions become invisible', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const { rerender } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
      children: (props) => (
        <button
          onClick={() =>
            props.toggleAttributionSelection(packageInfo1.id, true)
          }
        >
          {'click me'}
        </button>
      ),
      actions: [
        setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
          mode: 'explicit',
          attributionUuids: [packageInfo1.id],
        }),
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'true');

    rerenderPackagesPanel(
      rerender,
      faker.opossum.attributions({
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
    );

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'false');
  });

  it('shows tabs corresponding to available attributions', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
    });

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    ).toBeInTheDocument();
    expect(
      // eslint-disable-next-line testing-library/no-node-access
      screen.queryByRole('tab', { name: new RegExp(text.relations.children) }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('switches tabs', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
    });

    await userEvent.click(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    );

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'false');
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('selects the first available tab after a resource change', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const { store } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
      }),
    });

    await userEvent.click(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    );
    await act(() => store.dispatch(setSelectedResourceId('/next-resource')));

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('sets active tab to the one containing the selected attribution', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
      scopeByRelation: false,
      actions: [setSelectedAttributionId(packageInfo3.id)],
    });

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'false');
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('resets active tab when active relation no longer available', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const { rerender } = await renderPackagesPanel({
      attributions: faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
        [packageInfo3.id]: packageInfo3,
      }),
      scopeByRelation: false,
      actions: [setSelectedAttributionId(packageInfo3.id)],
    });

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'false');

    rerenderPackagesPanel(
      rerender,
      faker.opossum.attributions({
        [packageInfo1.id]: packageInfo1,
        [packageInfo2.id]: packageInfo2,
      }),
    );

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('renders no tabs when there are no attributions', async () => {
    await renderPackagesPanel({ attributions: {} });

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
