// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen, type Screen } from '@testing-library/react';

import { Criticality } from '../../../../shared/shared-types';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { renderComponent } from '../../../test-helpers/render';
import {
  AttributionCountPerSourcePerLicenseTable,
  type AttributionCountPerSourcePerLicenseTableProps,
} from '../AttributionCountPerSourcePerLicenseTable';

const props: AttributionCountPerSourcePerLicenseTableProps = {
  tableData: {
    perLicense: [
      {
        licenseName: 'licenseA',
        licenseOption: { id: 'licenseA', label: 'licenseA' },
        criticality: Criticality.High,
        classification: 2,
        perSource: { sourceA: 1, sourceB: 3 },
        total: 4,
      },
      {
        licenseName: 'licenseB',
        licenseOption: { id: 'licenseB', label: 'licenseB' },
        criticality: Criticality.Medium,
        classification: 3,
        perSource: { sourceB: 2 },
        total: 2,
      },
    ],
    totals: {
      perSource: { sourceA: 1, sourceB: 5 },
      total: 6,
    },
  },
};

function getHeaderTexts(screen: Screen): Array<string> {
  const isHtmlElement = (
    node: HTMLElement | undefined,
  ): node is HTMLElement => {
    return !!node;
  };
  return screen
    .getAllByTestId('table-cell-with-sorting')
    .filter(isHtmlElement)
    .map((node) => node.textContent || '');
}

describe('Attribution count per source per license table', () => {
  it('keeps equivalent spellings from different sources as distinct rows when sorting', async () => {
    const consoleError = vi.spyOn(console, 'error');
    const rows: AttributionCountPerSourcePerLicenseTableProps['tableData']['perLicense'] =
      [
        {
          licenseName: 'Apache-2.0',
          licenseOption: { id: 'apache2.0', label: 'Apache-2.0' },
          criticality: Criticality.None,
          classification: 0,
          perSource: { ScanCode: 1 },
          total: 1,
        },
        {
          licenseName: 'apache 2.0',
          licenseOption: { id: 'apache2.0', label: 'apache 2.0' },
          criticality: Criticality.None,
          classification: 0,
          perSource: { REUSE: 1 },
          total: 1,
        },
      ];
    try {
      await renderComponent(
        <AttributionCountPerSourcePerLicenseTable
          tableData={{
            perLicense: rows,
            totals: { perSource: { ScanCode: 1, REUSE: 1 }, total: 2 },
          }}
        />,
      );
      fireEvent.click(screen.getByText('Name'));
      expect(screen.getByText('Apache-2.0')).toBeVisible();
      expect(screen.getByText('apache 2.0')).toBeVisible();
      expect(
        consoleError.mock.calls.some((args) =>
          String(args[0]).includes('same key'),
        ),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('shows by default criticality and classification columns', async () => {
    await renderComponent(
      <AttributionCountPerSourcePerLicenseTable {...props} />,
    );

    expect(getHeaderTexts(screen)).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Criticality',
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });

  it('does not show criticality if disabled', async () => {
    await renderComponent(
      <AttributionCountPerSourcePerLicenseTable {...props} />,
      {
        actions: [setUserSetting({ showCriticality: false })],
      },
    );

    expect(getHeaderTexts(screen)).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });

  it('does not show classification if disabled', async () => {
    await renderComponent(
      <AttributionCountPerSourcePerLicenseTable {...props} />,
      {
        actions: [setUserSetting({ showClassifications: false })],
      },
    );

    expect(getHeaderTexts(screen)).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Criticality',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });

  it('switches back to default sorting if the sorted by column is dropped', async () => {
    const { store } = await renderComponent(
      <AttributionCountPerSourcePerLicenseTable {...props} />,
    );
    expect(getHeaderTexts(screen)).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Criticality',
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);

    fireEvent.click(screen.getByText('Criticality'));

    expect(getHeaderTexts(screen)).toEqual([
      'Name',
      'Criticalitysorted descending', //correct, the sorted, descending is for a11y
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);

    act(() => {
      store.dispatch(setUserSetting({ showCriticality: false }));
    });

    expect(getHeaderTexts(screen)).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);

    fireEvent.click(screen.getByText('Name'));

    expect(getHeaderTexts(screen)).toEqual([
      'Namesorted descending', //correct, the sorted, descending is for a11y
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });
});
