// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import {
  Criticality,
  type PackageInfo,
} from '../../../../../shared/shared-types';
import { renderComponent } from '../../../../test-helpers/render';
import {
  type LicensePatch,
  LicenseSubPanelAutocomplete,
} from '../LicenseSubPanelAutocomplete';
import { LicenseTextField } from '../LicenseTextField';

const frequentLicenses = {
  nameOrder: [
    { shortName: 'MIT', fullName: 'MIT License' },
    { shortName: 'Apache-2.0', fullName: 'Apache License 2.0' },
  ],
  texts: { MIT: 'Default MIT text' },
};

vi.mock('../../../../util/backendClient', () => ({
  backend: {
    getFrequentLicenseNames: {
      useQuery: () => ({ data: frequentLicenses.nameOrder }),
    },
    autoCompleteOptions: {
      useQuery: () => ({ data: { manual: [], external: [] } }),
    },
    getFrequentLicenseText: {
      useQuery: () => ({ data: frequentLicenses.texts.MIT }),
    },
  },
}));

function TestLicenseAutocomplete({
  onUpdate,
  readOnly,
}: {
  onUpdate: (patch: LicensePatch) => void;
  readOnly?: boolean;
}) {
  const [packageInfo, setPackageInfo] = useState<PackageInfo>({
    id: 'test-package',
    criticality: Criticality.None,
    licenseName: '',
    licenseText: 'stored text',
  });

  return (
    <LicenseSubPanelAutocomplete
      licenseName={packageInfo.licenseName}
      licenseText={packageInfo.licenseText}
      onUpdate={(patch) => {
        onUpdate(patch);
        setPackageInfo((current) => ({ ...current, ...patch }));
      }}
      readOnly={readOnly}
      inputDataTestId={'license-name'}
    />
  );
}

describe('LicenseSubPanelAutocomplete', () => {
  it('clears stored text when selecting a suggestion', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    await renderComponent(<TestLicenseAutocomplete onUpdate={onUpdate} />);

    await user.click(screen.getByTestId('license-name'));
    await user.type(screen.getByTestId('license-name'), 'M');
    await user.click(await screen.findByRole('option', { name: /MIT/ }));

    expect(onUpdate).toHaveBeenLastCalledWith({
      licenseName: 'MIT',
      licenseText: '',
    });
  });

  it('keeps stored text when typing and applying an SPDX fix', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    await renderComponent(<TestLicenseAutocomplete onUpdate={onUpdate} />);

    await user.type(screen.getByTestId('license-name'), 'MIT and Apache-2.0');
    expect(onUpdate).toHaveBeenLastCalledWith({
      licenseName: 'MIT and Apache-2.0',
    });

    await user.click(screen.getByText('capitalized'));
    expect(onUpdate).toHaveBeenLastCalledWith({
      licenseName: 'MIT AND Apache-2.0',
    });
  });

  it('does not update when it is read-only', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    await renderComponent(
      <TestLicenseAutocomplete onUpdate={onUpdate} readOnly={true} />,
    );

    await user.type(screen.getByTestId('license-name'), 'MIT');

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('shows inferred license text as a display-only placeholder', async () => {
    const onUpdate = vi.fn();
    await renderComponent(
      <LicenseTextField
        packageInfo={{
          id: 'test-package',
          criticality: Criticality.None,
          licenseName: 'MIT',
          licenseText: '',
        }}
        onUpdate={onUpdate}
        inputDataTestId={'license-text'}
      />,
    );

    expect(await screen.findByTestId('license-text')).toHaveValue('');
    expect(screen.getByTestId('license-text')).toHaveAttribute(
      'placeholder',
      'Default MIT text',
    );
  });
});
