// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponent } from '../../../../test-helpers/render';
import { LicenseAutocomplete } from '../LicenseAutocomplete';

describe('LicenseAutocomplete', () => {
  it('is disabled when no licenses are available', async () => {
    await renderComponent(
      <LicenseAutocomplete
        licenses={[]}
        selectedLicense={''}
        setSelectedLicense={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('textbox', { name: 'license names' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'popup indicator' }),
    ).not.toBeInTheDocument();
  });

  it('stays enabled when an unavailable license is selected', async () => {
    await renderComponent(
      <LicenseAutocomplete
        licenses={[]}
        selectedLicense={'MIT'}
        setSelectedLicense={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('textbox', { name: 'license names' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'clear button' }),
    ).toBeInTheDocument();
  });
});
