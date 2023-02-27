// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import { initialViewState } from '../../../state/reducers/view-reducer';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ErrorBoundary } from '../ErrorBoundary';
import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { screen } from '@testing-library/react';

describe('ErrorBoundary', () => {
  function TestComponent(props: { throws: boolean }): JSX.Element {
    if (props.throws) {
      throw new Error();
    }

    return <div>{'Test'}</div>;
  }

  it('renders its children', () => {
    renderComponentWithStore(
      <ErrorBoundary>
        <TestComponent throws={false} />
      </ErrorBoundary>
    );

    expect(window.electronAPI.openFile).toHaveBeenCalledTimes(0);
    expect(window.electronAPI.on).toHaveBeenCalledTimes(1);

    screen.getByText('Test');
  });

  it('renders fallback and restores state', () => {
    // we expect warnings that we do not want to see
    jest.spyOn(console, 'error').mockImplementation();

    const { store } = renderComponentWithStore(
      <ErrorBoundary>
        <TestComponent throws={true} />
      </ErrorBoundary>
    );

    const expectedNumberOfCalls = 3;
    expect(window.electronAPI.sendErrorInformation).toHaveBeenCalledTimes(
      expectedNumberOfCalls
    );

    expect(window.electronAPI.on).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.on).toHaveBeenCalledWith(
      AllowedFrontendChannels.RestoreFrontend,
      expect.anything()
    );

    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(store.getState().viewState).toMatchObject(initialViewState);

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
});
