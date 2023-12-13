// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, within } from '@testing-library/react';
import { IpcRendererEvent } from 'electron';
import { noop } from 'lodash';

import { faker } from '../../../../shared/Faker';
import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { ElectronAPI, Log } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
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

describe('ProcessPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    electronAPI.events = {};
    global.window.electronAPI = electronAPI as unknown as ElectronAPI;
  });

  it('renders no dialog when loading is false', () => {
    renderComponent(<ProcessPopup />);

    expect(screen.queryByText(text.processPopup.title)).not.toBeInTheDocument();
  });

  it('renders dialog when loading is true', () => {
    renderComponent(<ProcessPopup />);

    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.FileLoading, {
          isLoading: true,
        }),
    );

    expect(screen.getByText(text.processPopup.title)).toBeInTheDocument();
  });

  it('shows log messages with expected icon', () => {
    const date = faker.date.recent();
    const message1 = faker.lorem.sentence();
    const message2 = faker.lorem.sentence();
    renderComponent(<ProcessPopup />);

    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.FileLoading, {
          isLoading: true,
        }),
    );
    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.Logging, {
          date,
          message: message1,
          level: 'info',
        } satisfies Log),
    );
    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.Logging, {
          date,
          message: message2,
          level: 'info',
        } satisfies Log),
    );

    expect(screen.getByText(message1)).toBeInTheDocument();
    expect(
      within(screen.getByTestId('message-1')).getByTestId('CheckIcon'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('message-1')).queryByTestId('spinner'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(message2)).toBeInTheDocument();
    expect(
      within(screen.getByTestId('message-2')).queryByTestId('CheckIcon'),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('message-2')).getByTestId('spinner'),
    ).toBeInTheDocument();
  });

  it('clears previous log messages when loading begins another time', () => {
    const date = faker.date.recent();
    const message = faker.lorem.sentence();
    renderComponent(<ProcessPopup />);

    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.FileLoading, {
          isLoading: true,
        }),
    );
    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.Logging, {
          date,
          message,
          level: 'info',
        } satisfies Log),
    );
    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.FileLoading, {
          isLoading: true,
        }),
    );

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
