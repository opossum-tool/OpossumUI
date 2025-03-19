// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { Criticality } from '../../../../shared/shared-types';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { renderComponent } from '../../../test-helpers/render';
import { LicenseCounts } from '../../../types/types';
import {
  AttributionCountPerSourcePerLicenseTable,
  AttributionCountPerSourcePerLicenseTableProps,
} from '../AttributionCountPerSourcePerLicenseTable';

const licenseCounts: LicenseCounts = {
  attributionCountPerSourcePerLicense: {
    licenseA: {
      sourceA: 1,
      sourceB: 3,
    },
    licenseB: {
      sourceB: 2,
    },
  },
  totalAttributionsPerLicense: {
    licenseA: 4,
    licenseB: 2,
  },
  totalAttributionsPerSource: {
    sourceA: 1,
    sourceB: 5,
  },
};
const props: AttributionCountPerSourcePerLicenseTableProps = {
  licenseCounts,
  licenseNamesWithCriticality: {
    licenseA: Criticality.High,
    licenseB: Criticality.Medium,
  },
  licenseNamesWithClassification: {
    licenseA: 2,
    licenseB: 3,
  },
};

describe('Attribution count per source per license table', () => {
  it('shows by default criticality and classification columns', () => {
    renderComponent(<AttributionCountPerSourcePerLicenseTable {...props} />);

    const headerTexts = screen
      .getAllByTestId('classification-table-row-header')
      .map((node) => node.textContent);

    expect(headerTexts).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Criticality',
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });

  it('does not show criticality if disabled', () => {
    renderComponent(<AttributionCountPerSourcePerLicenseTable {...props} />, {
      actions: [setUserSetting({ showCriticality: false })],
    });

    const headerTexts = screen
      .getAllByTestId('classification-table-row-header')
      .map((node) => node.textContent);

    expect(headerTexts).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Classification',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });

  it('does not show classification if disabled', () => {
    renderComponent(<AttributionCountPerSourcePerLicenseTable {...props} />, {
      actions: [setUserSetting({ showClassifications: false })],
    });

    const headerTexts = screen
      .getAllByTestId('classification-table-row-header')
      .map((node) => node.textContent);

    expect(headerTexts).toEqual([
      'Namesorted ascending', //correct, the sorted, ascending is for a11y
      'Criticality',
      'SourceA',
      'SourceB',
      'Total',
    ]);
  });
});
