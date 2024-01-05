// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import commitInfo from '../../../../commitInfo.json';
import { faker } from '../../../../shared/Faker';
import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { UpdateAppPopup } from '../UpdateAppPopup';
import * as util from '../UpdateAppPopup.util';

describe('UpdateAppPopup', () => {
  it('shows message that a new release is available', () => {
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: {
        name: faker.system.semver(),
        url: faker.internet.url(),
      },
      latestReleaseError: null,
      latestReleaseLoading: false,
    });
    renderComponent(<UpdateAppPopup />);

    expect(
      screen.getByText(text.updateAppPopup.updateAvailable),
    ).toBeInTheDocument();
  });

  it('shows message that no newer release is available', () => {
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: {
        name: commitInfo.commitInfo,
        url: faker.internet.url(),
      },
      latestReleaseError: null,
      latestReleaseLoading: false,
    });
    renderComponent(<UpdateAppPopup />);

    expect(
      screen.getByText(text.updateAppPopup.noUpdateAvailable),
    ).toBeInTheDocument();
  });

  it('shows error message', () => {
    const error = faker.lorem.sentence();
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: undefined,
      latestReleaseError: Error(error),
      latestReleaseLoading: false,
    });
    renderComponent(<UpdateAppPopup />);

    expect(
      screen.getByText(text.updateAppPopup.fetchFailed(error)),
    ).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.spyOn(util, 'useLatestRelease').mockReturnValue({
      latestRelease: undefined,
      latestReleaseError: null,
      latestReleaseLoading: true,
    });
    renderComponent(<UpdateAppPopup />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
