// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../../shared/text';
import { faker } from '../../../../../testing/Faker';
import { setSelectedAttributionId } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { setVariable } from '../../../../state/actions/variables-actions/variables-actions';
import { ATTRIBUTION_IDS_FOR_REPLACEMENT } from '../../../../state/variables/use-attribution-ids-for-replacement';
import {
  initialFilteredAttributions,
  UseFilteredData,
} from '../../../../state/variables/use-filtered-data';
import { renderComponent } from '../../../../test-helpers/render';
import { PackagesPanel } from '../PackagesPanel';

describe('PackagesPanel', () => {
  it('enables select-all checkbox when there are attribution IDs', () => {
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions(),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(screen.getByRole('checkbox')).toBeEnabled();
  });

  it('disables select-all checkbox when there are no attribution IDs', () => {
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: {},
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('disables select-all checkbox when there are attribution IDs but checkbox is externally disabled', () => {
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions(),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
        disableSelectAll
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('checkbox is indeterminate when some but not all attributions are selected', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {(props) => (
          <button
            onClick={() =>
              props.setMultiSelectedAttributionIds([packageInfo1.id])
            }
          >
            {'click me'}
          </button>
        )}
      </PackagesPanel>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'true');
  });

  it('checkbox is not indeterminate when no attributions are selected', () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {(props) => (
          <button
            onClick={() =>
              props.setMultiSelectedAttributionIds([packageInfo1.id])
            }
          >
            {'click me'}
          </button>
        )}
      </PackagesPanel>,
    );

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'false');
  });

  it('checkbox is not indeterminate when all attributions of active relation are selected', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {(props) => (
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
        )}
      </PackagesPanel>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'false');
  });

  it('selects all attributions', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));

    expect(screen.getByRole('checkbox', { name: 'select all' })).toBeChecked();
  });

  it('resets multi-selected IDs when active relation changes', async () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

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
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
      {
        actions: [
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            packageInfo1.id,
          ]),
        ],
      },
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'select all' }));
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
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    const { rerender } = renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {(props) => (
          <button
            onClick={() =>
              props.setMultiSelectedAttributionIds([packageInfo1.id])
            }
          >
            {'click me'}
          </button>
        )}
      </PackagesPanel>,
      {
        actions: [
          setVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, [
            packageInfo1.id,
          ]),
        ],
      },
    );

    await userEvent.click(screen.getByRole('button', { name: 'click me' }));

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'true');

    const updatedUseFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];

    rerender(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={updatedUseFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'select all' }),
    ).toHaveAttribute('data-indeterminate', 'false');
  });

  it('shows tabs corresponding to available attributions', () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    ).toBeInTheDocument();
    expect(
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
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

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

  it('sets active tab to the one containing the selected attribution', () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
      { actions: [setSelectedAttributionId(packageInfo3.id)] },
    );

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'false');
    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.unrelated) }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('resets active tab when active relation no longer available', () => {
    const packageInfo1 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo2 = faker.opossum.packageInfo({ relation: 'resource' });
    const packageInfo3 = faker.opossum.packageInfo({ relation: 'unrelated' });
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
      },
      setFilteredData,
    ];
    const { rerender } = renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
      { actions: [setSelectedAttributionId(packageInfo3.id)] },
    );

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'false');

    const updatedUseFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
      },
      setFilteredData,
    ];
    rerender(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={updatedUseFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(
      screen.getByRole('tab', { name: new RegExp(text.relations.resource) }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('renders no tabs when there are no attributions', () => {
    const setFilteredData = jest.fn();
    const useFilteredData: UseFilteredData = () => [
      { ...initialFilteredAttributions, attributions: {} },
      setFilteredData,
    ];
    renderComponent(
      <PackagesPanel
        availableFilters={[]}
        renderActions={() => null}
        useFilteredData={useFilteredData}
      >
        {() => null}
      </PackagesPanel>,
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
