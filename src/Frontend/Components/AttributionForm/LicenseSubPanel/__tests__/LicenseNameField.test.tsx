// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { renderComponent } from '../../../../test-helpers/render';
import { LicenseNameField } from '../LicenseNameField';

vi.mock('../../../../util/backendClient', () => ({
  backend: {
    getFrequentLicenseNames: { useQuery: () => ({ data: [] }) },
    autoCompleteOptions: {
      useQuery: () => ({ data: { manual: [], external: [] } }),
    },
  },
}));

function TestLicenseNameField({ onToggle }: { onToggle: () => void }) {
  const [showLicenseText, setShowLicenseText] = useState(false);

  return (
    <LicenseNameField
      licenseName={'MIT'}
      licenseText={'MIT License'}
      onUpdate={() => undefined}
      showLicenseText={showLicenseText}
      onToggleLicenseText={() => {
        onToggle();
        setShowLicenseText((visible) => !visible);
      }}
    />
  );
}

describe('LicenseNameField', () => {
  it('forwards toggle interactions and exposes the expanded state', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    await renderComponent(<TestLicenseNameField onToggle={onToggle} />);

    const toggle = screen.getByLabelText('license-text-toggle-button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(onToggle).toHaveBeenCalledOnce();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the stored-text badge', async () => {
    const { container } = await renderComponent(
      <TestLicenseNameField onToggle={() => undefined} />,
    );

    // The visibility class is applied to MUI's internal badge slot.
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.MuiBadge-invisible')).toBeNull();
  });
});
