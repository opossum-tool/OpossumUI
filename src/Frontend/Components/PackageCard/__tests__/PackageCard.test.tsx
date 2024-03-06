// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { PackageCard } from '../PackageCard';

describe('The PackageCard', () => {
  it('renders with preferred icon', () => {
    renderComponent(
      <PackageCard
        packageInfo={faker.opossum.packageInfo({
          wasPreferred: true,
          preferred: true,
        })}
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByTestId('preferred-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('was-preferred-icon')).not.toBeInTheDocument();
  });

  it('renders with was-preferred icon', () => {
    renderComponent(
      <PackageCard
        packageInfo={faker.opossum.packageInfo({ wasPreferred: true })}
        onClick={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('preferred-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('was-preferred-icon')).toBeInTheDocument();
  });

  it('renders package card with count', () => {
    const packageInfo = faker.opossum.packageInfo({ count: 13 });

    renderComponent(
      <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
    );

    expect(
      screen.getByText(
        `${packageInfo.packageName!}, ${packageInfo.packageVersion!}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(packageInfo.licenseName!)).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('renders package card with checkbox', () => {
    const packageInfo = faker.opossum.packageInfo();

    renderComponent(
      <PackageCard
        packageInfo={packageInfo}
        onClick={jest.fn()}
        checkbox={{ checked: true, onChange: jest.fn() }}
      />,
    );

    expect(
      screen.getByText(
        `${packageInfo.packageName!}, ${packageInfo.packageVersion!}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(packageInfo.licenseName!)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
