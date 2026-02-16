// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import { IpcRendererEvent } from 'electron';
import { noop } from 'lodash';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { ElectronAPI } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
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

  it('renders no dialog when loading is false', async () => {
    await renderComponent(<ProcessPopup />);

    expect(screen.queryByText(text.processPopup.title)).not.toBeInTheDocument();
    expect(electronAPI.setFrontendPopupOpen).not.toHaveBeenLastCalledWith(true);
  });

  it('renders dialog when loading is true', async () => {
    await renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();

    expect(screen.getByText(text.processPopup.title)).toBeInTheDocument();
    expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(true);
  });

  it('shows messages during processing', async () => {
    const message = faker.lorem.sentence();

    await renderComponent(<ProcessPopup />);
    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(true);
  });

  it('shows multiple messages', async () => {
    const message = faker.lorem.sentence();
    await renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    expect(screen.getByText(message)).toBeInTheDocument();

    const secondMessage = faker.lorem.sentence();
    simulateMessageFromBackend(secondMessage);

    expect(screen.getByText(secondMessage)).toBeInTheDocument();
    expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(true);
  });

  it('clears previous log messages when loading begins another time', async () => {
    const message = faker.lorem.sentence();
    await renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    simulateBackendProcessingStarted();

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('does not render a dialog after processing is done', async () => {
    const message = faker.lorem.sentence();
    await renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    simulateBackendProcessingDone();

    expect(screen.queryByText(text.processPopup.title)).not.toBeVisible();
    expect(electronAPI.setFrontendPopupOpen).not.toHaveBeenLastCalledWith(true);
  });
});
