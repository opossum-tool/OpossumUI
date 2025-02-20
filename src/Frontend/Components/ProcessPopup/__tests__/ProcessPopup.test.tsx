// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import { IpcRendererEvent } from 'electron';
import { noop } from 'lodash';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { ElectronAPI, Log } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setLoading } from '../../../state/actions/view-actions/view-actions';
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
    electronAPI.events = {};
    global.window.electronAPI = electronAPI as unknown as ElectronAPI;
  });

  it('renders no dialog when loading is false', () => {
    renderComponent(<ProcessPopup />);

    expect(screen.queryByText(text.processPopup.title)).not.toBeInTheDocument();
  });

  it('renders dialog when loading is true', async () => {
    const { store } = renderComponent(<ProcessPopup />);

    await act(() => store.dispatch(setLoading(true)));

    expect(screen.getByText(text.processPopup.title)).toBeInTheDocument();
  });

  it('clears previous log messages when loading begins another time', async () => {
    const date = faker.date.recent();
    const message = faker.lorem.sentence();
    const { store } = renderComponent(<ProcessPopup />);

    await act(() => store.dispatch(setLoading(true)));
    act(
      () =>
        void electronAPI.send(AllowedFrontendChannels.Logging, {
          date,
          message,
          level: 'info',
        } satisfies Log),
    );
    await act(() => store.dispatch(setLoading(false)));
    await act(() => store.dispatch(setLoading(true)));

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
