// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IpcRenderer } from 'electron';
import React from 'react';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import { initialViewState } from '../../../state/reducers/view-reducer';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ErrorBoundary } from '../ErrorBoundary';
import { IpcChannel } from '../../../../shared/ipc-channels';

let originalIpcRenderer: IpcRenderer;

describe('ErrorBoundary', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  function TestComponent(props: { throws: boolean }): JSX.Element {
    if (props.throws) {
      throw new Error();
    }

    return <div>{'Test'}</div>;
  }

  test('renders its children', () => {
    const { getByText } = renderComponentWithStore(
      <ErrorBoundary>
        <TestComponent throws={false} />
      </ErrorBoundary>
    );

    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(0);
    expect(window.ipcRenderer.on).toHaveBeenCalledTimes(1);

    getByText('Test');
  });

  test('renders fallback and restores state', () => {
    // we expect warnings that we do not want to see
    jest.spyOn(console, 'error').mockImplementation();

    const { queryByText, store } = renderComponentWithStore(
      <ErrorBoundary>
        <TestComponent throws={true} />
      </ErrorBoundary>
    );

    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      IpcChannel['SendErrorInformation'],
      expect.anything()
    );
    expect(window.ipcRenderer.on).toHaveBeenCalledTimes(1);
    expect(window.ipcRenderer.on).toHaveBeenCalledWith(
      IpcChannel['RestoreFrontend'],
      expect.anything()
    );

    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(store.getState().viewState).toMatchObject(initialViewState);

    expect(queryByText('Test')).toBeFalsy();
  });
});
