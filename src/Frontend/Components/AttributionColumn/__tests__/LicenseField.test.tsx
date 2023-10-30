// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeEvent } from 'react';

import { FrequentLicenseName } from '../../../../shared/shared-types';
import { expectElementsInAutoCompleteAndSelectFirst } from '../../../test-helpers/general-test-helpers';
import { doNothing } from '../../../util/do-nothing';
import { LicenseField } from '../LicenseField';

describe('The LicenseField', () => {
  it('renders text and label', () => {
    const testLicenseNames: Array<FrequentLicenseName> = [
      { shortName: 'MIT', fullName: 'MIT license' },
      { shortName: 'GPL', fullName: 'General Public License' },
    ];
    render(
      <LicenseField
        title={'Test Title'}
        frequentLicenseNames={testLicenseNames}
        text={'MIT License'}
        endAdornmentText={'Test Adornment Text'}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expect(screen.queryAllByText('Test Title')).toHaveLength(2);
    screen.getByText('Test Adornment Text');
    expect(screen.getByDisplayValue('MIT License'));
    expectElementsInAutoCompleteAndSelectFirst(screen, ['MIT - MIT license']);
  });

  it('shows options with substring matching', () => {
    const testLicenseNames: Array<FrequentLicenseName> = [
      { shortName: 'MIT', fullName: 'MIT license' },
      { shortName: 'GPL', fullName: 'General Public License' },
    ];
    render(
      <LicenseField
        title={'Test Title'}
        frequentLicenseNames={testLicenseNames}
        text={'Public Lic'}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expectElementsInAutoCompleteAndSelectFirst(screen, [
      'GPL - General Public License',
    ]);
  });

  it('sorts entries', () => {
    const testLicenseNames: Array<FrequentLicenseName> = [
      { shortName: 'MIT', fullName: 'MIT license' },
      { shortName: 'GPL', fullName: 'General Public License' },
    ];
    render(
      <LicenseField
        title={'Test Title'}
        frequentLicenseNames={testLicenseNames}
        text={''}
        endAdornmentText={'Test Adornment Text'}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    const autoComplete = screen.getByRole('combobox');
    autoComplete.focus();
    fireEvent.keyDown(autoComplete, { key: 'ArrowDown' });

    const licenseDropdownList = screen.getByRole('listbox');
    expect(licenseDropdownList.children[0]).toHaveTextContent(
      'GPL - General Public License',
    );
    expect(licenseDropdownList.children[1]).toHaveTextContent(
      'MIT - MIT license',
    );
  });
});
