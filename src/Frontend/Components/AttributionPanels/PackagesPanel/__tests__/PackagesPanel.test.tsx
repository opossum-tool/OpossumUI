// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Attributions } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { closePopupAndUnsetTargets } from '../../../../state/actions/popup-actions/popup-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import type { Action } from '../../../../state/configure-store';
import { ATTRIBUTION_IDS_FOR_REPLACEMENT } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { initialAttributionFilters } from '../../../../state/variables/use-filters';
import { renderComponent } from '../../../../test-helpers/render';
import { useFilteredAttributionsList } from '../../../../util/use-attribution-lists';
import { useSelectedAttributionIsExternal } from '../../../../util/use-selected-attribution';
import {
  PackagesPanel,
  type PackagesPanelChildrenProps,
} from '../PackagesPanel';

vi.mock('../../../../util/use-attribution-lists', () => ({
  useFilteredAttributionsList: vi.fn(),
}));

vi.mock('../../../../util/use-selected-attribution', () => ({
  useSelectedAttributionIsExternal: vi.fn(),
}));

function mockAttributions(attributions: Attributions) {
  vi.mocked(useFilteredAttributionsList).mockReturnValue({
    attributions,
    loading: false,
  });
}

function renderPackagesPanel({
  attributions,
  children,
  actions,
}: {
  attributions: Attributions;
  children?: (props: PackagesPanelChildrenProps) => React.ReactNode;
  actions?: Array<Action>;
}) {
  mockAttributions(attributions);
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
    { actions },
  );
}

function rerenderPackagesPanel(
  rerender: (ui: React.ReactElement) => void,
  attributions: Attributions,
) {
  mockAttributions(attributions);
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

    await act(() => store.dispatch(setSelectedResourceId('/another-resource')));

    await waitFor(() => {
      expect(store.getState().resourceState.selectedAttributionId).toBe(
        resourceAttribution.id,
      );
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
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo.id,
        ]),
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
            props.setMultiSelectedAttributionIds([packageInfo1.id])
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
          onClick={() =>
            props.setMultiSelectedAttributionIds([
              packageInfo1.id,
              packageInfo2.id,
            ])
          }
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
            props.setMultiSelectedAttributionIds([packageInfo1.id])
          }
        >
          {'click me'}
        </button>
      ),
      actions: [
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo1.id,
        ]),
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
            props.setMultiSelectedAttributionIds([packageInfo1.id])
          }
        >
          {'click me'}
        </button>
      ),
      actions: [
        setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
          packageInfo1.id,
        ]),
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
