// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import commitInfo from '../../../../commitInfo.json';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { UpdateAppPopup } from '../UpdateAppPopup';
import * as util from '../UpdateAppPopup.util';

describe('UpdateAppPopup', () => {
  it('shows message that a new release is available', async () => {
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: {
        name: faker.system.semver(),
        url: faker.internet.url(),
      },
      latestReleaseError: null,
      latestReleaseLoading: false,
    });
    await renderComponent(<UpdateAppPopup />);

    expect(
      screen.getByText(text.updateAppPopup.updateAvailable),
    ).toBeInTheDocument();
  });

  it('shows message that no newer release is available', async () => {
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: {
        name: commitInfo.commitInfo,
        url: faker.internet.url(),
      },
      latestReleaseError: null,
      latestReleaseLoading: false,
    });
    await renderComponent(<UpdateAppPopup />);

    expect(
      screen.getByText(text.updateAppPopup.noUpdateAvailable),
    ).toBeInTheDocument();
  });

  it('shows error message', async () => {
    const error = faker.lorem.sentence();
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: undefined,
      latestReleaseError: Error(error),
      latestReleaseLoading: false,
    });
    await renderComponent(<UpdateAppPopup />);

    expect(
      screen.getByText(text.updateAppPopup.fetchFailed(error)),
    ).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: undefined,
      latestReleaseError: null,
      latestReleaseLoading: true,
    });
    await renderComponent(<UpdateAppPopup />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
