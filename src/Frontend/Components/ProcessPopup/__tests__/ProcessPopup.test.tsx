// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';
import { noop } from 'lodash-es';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type { ElectronAPI } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PopupType } from '../../../enums/enums';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { renderComponent } from '../../../test-helpers/render';
import { ProcessPopup } from '../ProcessPopup';

type Listener = (event: IpcRendererEvent, ...args: Array<unknown>) => void;

const electronAPI: {
  events: Partial<Record<AllowedFrontendChannels, Listener>>;
  on: (channel: AllowedFrontendChannels, listener: Listener) => () => void;
  send: (channel: AllowedFrontendChannels, ...args: Array<unknown>) => void;
  setFrontendPopupOpen: () => void;
} = {
  events: {},
  on(channel: AllowedFrontendChannels, listener: Listener): () => void {
    this.events[channel] = listener;
    return noop;
  },
  send(channel: AllowedFrontendChannels, ...args: Array<unknown>): void {
    this.events[channel]?.({} as IpcRendererEvent, ...args);
  },
  setFrontendPopupOpen: vi.fn(),
};

function simulateMessageFromBackend(message: string) {
  act(() =>
    electronAPI.send(AllowedFrontendChannels.ProcessingStateChanged, {
      type: 'ProcessingStateUpdated',
      date: faker.date.recent(),
      message,
      level: 'info',
    }),
  );
}

function simulateBackendProcessingStarted() {
  act(() =>
    electronAPI.send(AllowedFrontendChannels.ProcessingStateChanged, {
      type: 'ProcessingStarted',
    }),
  );
}

function simulateBackendProcessingDone() {
  act(() =>
    electronAPI.send(AllowedFrontendChannels.ProcessingStateChanged, {
      type: 'ProcessingDone',
    }),
  );
}

describe('ProcessPopup', () => {
  beforeEach(() => {
    electronAPI.events = {};
    global.window.electronAPI = electronAPI as unknown as ElectronAPI;
  });

  it('renders no dialog when processing is false', async () => {
    await renderComponent(<ProcessPopup />);

    expect(screen.queryByText(text.processPopup.title)).not.toBeInTheDocument();
  });

  it('renders on top of another popup while processing', async () => {
    const message = faker.lorem.sentence();
    await renderComponent(<ProcessPopup />, {
      actions: [openPopup(PopupType.ProjectMetadataPopup)],
    });

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    expect(screen.getByText(text.processPopup.title)).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(electronAPI.setFrontendPopupOpen).not.toHaveBeenLastCalledWith(true);
  });

  it('shows every processing message', async () => {
    const firstMessage = faker.lorem.sentence();
    const secondMessage = faker.lorem.sentence();
    await renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(firstMessage);
    simulateMessageFromBackend(secondMessage);

    expect(screen.getByText(firstMessage)).toBeInTheDocument();
    expect(screen.getByText(secondMessage)).toBeInTheDocument();
  });

  it('closes after processing has completed', async () => {
    await renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateBackendProcessingDone();

    expect(screen.queryByText(text.processPopup.title)).not.toBeVisible();
  });
});
