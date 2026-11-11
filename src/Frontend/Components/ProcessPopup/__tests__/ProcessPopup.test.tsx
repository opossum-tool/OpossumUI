// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';
import { noop } from 'lodash-es';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type { ElectronAPI } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PopupType } from '../../../enums/enums';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import {
  closePopup,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';
import { ProcessPopup } from '../ProcessPopup';

type Listener = (event: IpcRendererEvent, ...args: Array<unknown>) => void;

const electronAPI: {
  events: Partial<Record<AllowedFrontendChannels, Listener>>;
  on: (channel: AllowedFrontendChannels, listener: Listener) => () => void;
  send: (channel: AllowedFrontendChannels, ...args: Array<unknown>) => void;
  setFrontendPopupOpen: () => void;
  api: ElectronAPI['api'];
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
  api: window.electronAPI.api,
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

  it('does not open statistics when generic processing completes', async () => {
    const { store } = await renderComponent(<ProcessPopup />, {
      actions: [setUserSetting({ showProjectStatistics: true })],
    });

    simulateBackendProcessingStarted();
    simulateBackendProcessingDone();

    expect(getOpenPopup(store.getState())).toBeNull();
  });

  it('keeps menus disabled while statistics loads after processing', async () => {
    const { store } = await renderComponent(
      <>
        <GlobalPopup />
        <ProcessPopup />
      </>,
      { data: getParsedInputFileEnrichedWithTestData({}) },
    );

    simulateBackendProcessingStarted();
    await waitFor(() =>
      expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(true),
    );
    vi.mocked(electronAPI.setFrontendPopupOpen).mockClear();

    let resolveStatisticsRequests!: () => void;
    const statisticsRequestsPending = new Promise<void>((resolve) => {
      resolveStatisticsRequests = resolve;
    });
    const api = vi.mocked(electronAPI.api);
    const originalApiImplementation = api.getMockImplementation();
    if (!originalApiImplementation) {
      throw new Error('Expected backend API integration to be initialized');
    }
    api.mockImplementation(async (command, params) => {
      if (
        command === 'manualAttributionStatistics' ||
        command === 'externalAttributionStatistics' ||
        command === 'licenseTable'
      ) {
        await statisticsRequestsPending;
      }
      return originalApiImplementation(command, params);
    });

    act(() => {
      electronAPI.send(AllowedFrontendChannels.ProcessingStateChanged, {
        type: 'ProcessingDone',
      });
      store.dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(await screen.findByRole('status')).toHaveTextContent(
      text.projectStatisticsPopup.loading,
    );
    expect(electronAPI.setFrontendPopupOpen).not.toHaveBeenCalled();

    resolveStatisticsRequests();
    await screen.findByText(
      text.projectStatisticsPopup.charts.attributionProperties.title,
    );
    api.mockImplementation(originalApiImplementation);
    expect(electronAPI.setFrontendPopupOpen).toHaveBeenCalledTimes(0);

    act(() => {
      store.dispatch(closePopup());
    });

    await waitFor(() =>
      expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(false),
    );
  });

  it('resumes menu updates when a global popup closes during processing', async () => {
    const { store } = await renderComponent(
      <>
        <GlobalPopup />
        <ProcessPopup />
      </>,
      { data: getParsedInputFileEnrichedWithTestData({}) },
    );

    simulateBackendProcessingStarted();
    act(() => {
      store.dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    });
    await waitFor(() =>
      expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(true),
    );

    act(() => {
      store.dispatch(closePopup());
    });
    expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(true);

    simulateBackendProcessingDone();

    await waitFor(() =>
      expect(electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(false),
    );
  });
});
