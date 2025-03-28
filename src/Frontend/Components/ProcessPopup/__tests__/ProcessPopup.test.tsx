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
} = {
  events: {},
  on(channel: AllowedFrontendChannels, listener: Listener): () => void {
    this.events[channel] = listener;
    return noop;
  },
  send(channel: AllowedFrontendChannels, ...args: Array<unknown>): void {
    this.events[channel]?.({} as IpcRendererEvent, ...args);
  },
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

  it('renders no dialog when loading is false', () => {
    renderComponent(<ProcessPopup />);

    expect(screen.queryByText(text.processPopup.title)).not.toBeInTheDocument();
  });

  it('renders dialog when loading is true', () => {
    renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();

    expect(screen.getByText(text.processPopup.title)).toBeInTheDocument();
  });

  it('shows messages during processing', () => {
    const message = faker.lorem.sentence();

    renderComponent(<ProcessPopup />);
    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('shows multiple messages', () => {
    const message = faker.lorem.sentence();
    renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    expect(screen.getByText(message)).toBeInTheDocument();

    const secondMessage = faker.lorem.sentence();
    simulateMessageFromBackend(secondMessage);

    expect(screen.getByText(secondMessage)).toBeInTheDocument();
  });

  it('clears previous log messages when loading begins another time', () => {
    const message = faker.lorem.sentence();
    renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    simulateBackendProcessingStarted();

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('does not render a dialog after processing is done', () => {
    const message = faker.lorem.sentence();
    renderComponent(<ProcessPopup />);

    simulateBackendProcessingStarted();
    simulateMessageFromBackend(message);

    simulateBackendProcessingDone();

    expect(screen.queryByText(text.processPopup.title)).not.toBeVisible();
  });
});
