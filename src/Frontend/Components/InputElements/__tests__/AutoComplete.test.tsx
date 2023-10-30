// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import { ChangeEvent } from 'react';

import { expectElementsInAutoCompleteAndSelectFirst } from '../../../test-helpers/general-test-helpers';
import { doNothing } from '../../../util/do-nothing';
import { AutoComplete } from '../AutoComplete';

describe('The AutoComplete', () => {
  it('renders text and label', () => {
    const testLicenseNames = ['MIT', 'GPL'];
    render(
      <AutoComplete
        title={'Test Title'}
        options={testLicenseNames}
        inputValue={''}
        showTextBold={false}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expect(screen.queryAllByText('Test Title')).toHaveLength(2);

    expectElementsInAutoCompleteAndSelectFirst(screen, testLicenseNames);
  });

  it('renders end adornment', () => {
    const testLicenseNames = ['MIT', 'GPL'];
    render(
      <AutoComplete
        title={'Test Title'}
        options={testLicenseNames}
        inputValue={''}
        showTextBold={false}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
        endAdornmentText={'Adornment Text'}
      />,
    );

    screen.getByText('Adornment Text');
  });
});
