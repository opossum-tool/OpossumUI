// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { faker } from '../../../../testing/Faker';
import { PopupType } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import {
  getOpenFileRequest,
  getOpenPopup,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { BackendCommunication } from '../BackendCommunication';

describe('BackendCommunication', () => {
  it('stores the external file path in the unsaved-changes flow', async () => {
    const listeners = new Map<
      AllowedFrontendChannels,
      (event: IpcRendererEvent, ...args: Array<unknown>) => void
    >();

    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      listeners.set(
        channel,
        listener as (event: IpcRendererEvent, ...args: Array<unknown>) => void,
      );
      return vi.fn();
    });

    const { store } = await renderComponent(<BackendCommunication />, {
      actions: [setTemporaryDisplayPackageInfo(faker.opossum.packageInfo())],
    });
    const filePath = '/path/to/project.opossum';

    listeners.get(AllowedFrontendChannels.OpenFile)?.(
      {} as IpcRendererEvent,
      filePath,
    );

    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
    expect(getOpenFileRequest(store.getState())).toEqual({
      kind: 'path',
      filePath,
    });
  });

  function setupListeners(): Map<
    AllowedFrontendChannels,
    (event: IpcRendererEvent, ...args: Array<unknown>) => void
  > {
    const listeners = new Map<
      AllowedFrontendChannels,
      (event: IpcRendererEvent, ...args: Array<unknown>) => void
    >();
    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      listeners.set(
        channel,
        listener as (event: IpcRendererEvent, ...args: Array<unknown>) => void,
      );
      return vi.fn();
    });
    return listeners;
  }

  describe('SetDatabaseInitialized', () => {
    it('resets the resource state when the database is uninitialized', async () => {
      const listeners = setupListeners();
      const { store } = await renderComponent(<BackendCommunication />, {
        actions: [
          setTemporaryDisplayPackageInfo(faker.opossum.packageInfo()),
          setSelectedResourceId(
            '/some/resource/from/the/previous/file',
            'preserve',
          ),
        ],
      });

      act(() => {
        listeners.get(AllowedFrontendChannels.SetDatabaseInitialized)?.(
          {} as IpcRendererEvent,
          false,
        );
      });

      expect(getSelectedResourceId(store.getState())).toBe('/');
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        EMPTY_DISPLAY_PACKAGE_INFO,
      );
    });

    it('keeps the resource state when the database is initialized', async () => {
      const listeners = setupListeners();
      const { store } = await renderComponent(<BackendCommunication />, {
        actions: [setSelectedResourceId('/some/resource/in/the/current/file')],
      });

      act(() => {
        listeners.get(AllowedFrontendChannels.SetDatabaseInitialized)?.(
          {} as IpcRendererEvent,
          true,
        );
      });

      expect(getSelectedResourceId(store.getState())).toBe(
        '/some/resource/in/the/current/file',
      );
    });
  });
});
