// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { Criticality, RawCriticality } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { setConfig } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { SHOW_CLASSIFICATIONS_KEY } from '../../../state/variables/use-show-classifications';
import { renderComponent } from '../../../test-helpers/render';
import { setUserSetting } from '../../../test-helpers/user-settings-helpers';
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

  describe('classification icon', () => {
    it('renders the classification icon for classification > 0', () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 1 });

      renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
        {
          actions: [
            setConfig({
              classifications: {
                1: faker.opossum.classificationEntry(),
              },
            }),
          ],
        },
      );

      const classificationIcon = screen.getByTestId('classification-tooltip');
      expect(classificationIcon).toBeVisible();
    });

    it('does not render the classification icon for classification 0', () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 0 });

      renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
        {
          actions: [
            setConfig({
              classifications: {
                1: faker.opossum.classificationEntry(),
              },
            }),
          ],
        },
      );

      const classificationIcon = screen.queryByTestId('classification-tooltip');
      expect(classificationIcon).not.toBeInTheDocument();
    });

    it('does render the classification icon for un-configured classifications', () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 3 });

      renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
        {
          actions: [
            setConfig({
              classifications: {
                1: faker.opossum.classificationEntry(),
              },
            }),
          ],
        },
      );

      const classificationIcon = screen.getByTestId('classification-tooltip');
      expect(classificationIcon).toBeVisible();
    });

    it('does not render the classification icon if classification display is disabled', () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 3 });

      renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
        {
          actions: [
            setConfig({
              classifications: {
                1: faker.opossum.classificationEntry(),
              },
            }),
            setUserSetting(SHOW_CLASSIFICATIONS_KEY, false),
          ],
        },
      );

      const classificationIcon = screen.queryByTestId('classification-tooltip');
      expect(classificationIcon).not.toBeInTheDocument();
    });
  });

  describe('criticality icon', () => {
    [Criticality.Medium, Criticality.High].forEach((criticality) => {
      it(`renders the criticality icon for criticality ${RawCriticality[criticality]}`, () => {
        const packageInfo = faker.opossum.packageInfo({
          criticality,
        });

        renderComponent(
          <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
        );

        const criticalityIcon = screen.getByLabelText('Criticality icon');
        expect(criticalityIcon).toBeVisible();
      });
    });

    it('does not render the criticality icon for criticality none', () => {
      const packageInfo = faker.opossum.packageInfo({
        criticality: Criticality.None,
      });

      renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
      );

      const criticalityIcon = screen.queryByLabelText('Criticality icon');
      expect(criticalityIcon).not.toBeInTheDocument();
    });

    it('does not render the criticality icon if disabled', () => {
      const packageInfo = faker.opossum.packageInfo({
        criticality: Criticality.High,
      });

      renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={jest.fn()} />,
        { actions: [setUserSetting('showCriticality', false)] },
      );

      const criticalityIcon = screen.queryByLabelText('Criticality icon');
      expect(criticalityIcon).not.toBeInTheDocument();
    });
  });
});
