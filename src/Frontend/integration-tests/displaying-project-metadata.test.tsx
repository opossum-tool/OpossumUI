// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';

describe('displaying project metadata', () => {
  it('opens, displays, and closes project metadata', async () => {
    const metadata = faker.opossum.metadata();
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({ metadata }),
    });

    // The native app menu sends this channel to show the popup.
    sendToChannel(AllowedFrontendChannels.ShowProjectMetadataPopup, true);

    const popup = await screen.findByLabelText('project metadata');
    expect(within(popup).getByText('Project Metadata')).toBeVisible();
    expect(
      await within(popup).findByText(metadata.projectId, { exact: true }),
    ).toBeVisible();

    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    expect(screen.queryByLabelText('project metadata')).toBeNull();
  });
});
