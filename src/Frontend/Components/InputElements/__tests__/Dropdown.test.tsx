// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent } from 'react';
import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { Dropdown } from '../Dropdown';
import { DiscreteConfidence } from '../../../../shared/shared-types';

describe('The Dropdown', () => {
  it('renders value ', () => {
    render(
      <Dropdown
        isEditable={true}
        title={'Confidence'}
        value={DiscreteConfidence.High}
        menuItems={[
          {
            value: DiscreteConfidence.High,
            name: `High (${DiscreteConfidence.High})`,
          },
          {
            value: DiscreteConfidence.Low,
            name: `Low (${DiscreteConfidence.Low})`,
          },
        ]}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expect(screen.getByText('High (80)'));
  });

  it('renders value not in menuItems', () => {
    render(
      <Dropdown
        isEditable={true}
        title={'Confidence'}
        value={10}
        menuItems={[
          {
            value: DiscreteConfidence.High,
            name: `High (${DiscreteConfidence.High})`,
          },
          {
            value: DiscreteConfidence.Low,
            name: `Low (${DiscreteConfidence.Low})`,
          },
        ]}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expect(screen.getByText('10'));
  });
});
