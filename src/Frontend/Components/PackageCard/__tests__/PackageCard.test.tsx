// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { Criticality, RawCriticality } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { setConfig } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { renderComponent } from '../../../test-helpers/render';
import { PackageCard } from '../PackageCard';

describe('The PackageCard', () => {
  it('renders with preferred icon', async () => {
    await renderComponent(
      <PackageCard
        packageInfo={faker.opossum.packageInfo({
          wasPreferred: true,
          preferred: true,
        })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId('preferred-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('was-preferred-icon')).not.toBeInTheDocument();
  });

  it('renders with was-preferred icon', async () => {
    await renderComponent(
      <PackageCard
        packageInfo={faker.opossum.packageInfo({ wasPreferred: true })}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('preferred-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('was-preferred-icon')).toBeInTheDocument();
  });

  it('renders package card with count', async () => {
    const packageInfo = faker.opossum.packageInfo({ count: 13 });

    await renderComponent(
      <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
    );

    expect(
      screen.getByText(
        `${packageInfo.packageName!}, ${packageInfo.packageVersion!}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(packageInfo.licenseName!)).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('renders package card with checkbox', async () => {
    const packageInfo = faker.opossum.packageInfo();

    await renderComponent(
      <PackageCard
        packageInfo={packageInfo}
        onClick={vi.fn()}
        checkbox={{ checked: true, onChange: vi.fn() }}
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
    it('renders the classification icon for classification > 0', async () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 1 });

      await renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
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

    it('does not render the classification icon for classification 0', async () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 0 });

      await renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
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

    it('does render the classification icon for un-configured classifications', async () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 3 });

      await renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
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

    it('does not render the classification icon if classification display is disabled', async () => {
      const packageInfo = faker.opossum.packageInfo({ classification: 3 });

      await renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
        {
          actions: [
            setConfig({
              classifications: {
                1: faker.opossum.classificationEntry(),
              },
            }),
            setUserSetting({ showClassifications: false }),
          ],
        },
      );

      const classificationIcon = screen.queryByTestId('classification-tooltip');
      expect(classificationIcon).not.toBeInTheDocument();
    });
  });

  describe('criticality icon', () => {
    [Criticality.Medium, Criticality.High].forEach((criticality) => {
      it(`renders the criticality icon for criticality ${RawCriticality[criticality]}`, async () => {
        const packageInfo = faker.opossum.packageInfo({
          criticality,
        });

        await renderComponent(
          <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
        );

        const criticalityIcon = screen.getByLabelText('Criticality icon');
        expect(criticalityIcon).toBeVisible();
      });
    });

    it('does not render the criticality icon for criticality none', async () => {
      const packageInfo = faker.opossum.packageInfo({
        criticality: Criticality.None,
      });

      await renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
      );

      const criticalityIcon = screen.queryByLabelText('Criticality icon');
      expect(criticalityIcon).not.toBeInTheDocument();
    });

    it('does not render the criticality icon if disabled', async () => {
      const packageInfo = faker.opossum.packageInfo({
        criticality: Criticality.High,
      });

      await renderComponent(
        <PackageCard packageInfo={packageInfo} onClick={vi.fn()} />,
        { actions: [setUserSetting({ showCriticality: false })] },
      );

      const criticalityIcon = screen.queryByLabelText('Criticality icon');
      expect(criticalityIcon).not.toBeInTheDocument();
    });
  });
});
