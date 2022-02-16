// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  ButtonText,
  DiscreteConfidence,
  PopupType,
} from '../../../enums/enums';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import {
  createTestAppStore,
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';

import { ReplaceAttributionPopup } from '../ReplaceAttributionPopup';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  setAttributionIdMarkedForReplacement,
  setMultiSelectSelectedAttributionIds,
  setSelectedAttributionId,
} from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { Attributions, Resources } from '../../../../shared/shared-types';
import { IpcRenderer } from 'electron';
import { IpcChannel } from '../../../../shared/ipc-channels';

function setupTestState(store: EnhancedTestStore): void {
  const testResources: Resources = {
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
    },
  };
  const testAttributions: Attributions = {
    test_selected_id: {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
    },
    test_marked_id: { packageName: 'Vue' },
  };
  const testResourcesToManualAttributions = {
    'package_1.tr.gz': ['test_selected_id'],
    'package_2.tr.gz': ['test_marked_id'],
  };

  store.dispatch(setSelectedAttributionId('test_selected_id'));
  store.dispatch(setAttributionIdMarkedForReplacement('test_marked_id'));
  store.dispatch(
    openPopup(PopupType.ReplaceAttributionPopup, 'test_selected_id')
  );
  store.dispatch(
    loadFromFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    )
  );
}

let originalIpcRenderer: IpcRenderer;

describe('ReplaceAttributionPopup and do not change view', () => {
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

  test('renders a ReplaceAttributionPopup and click cancel', () => {
    const testStore = createTestAppStore();
    setupTestState(testStore);

    const { store } = renderComponentWithStore(<ReplaceAttributionPopup />, {
      store: testStore,
    });

    expect(screen.getByText('Replacing an attribution')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
  });

  test('does not show ContextMenu for attributions', () => {
    const testStore = createTestAppStore();
    setupTestState(testStore);

    renderComponentWithStore(<ReplaceAttributionPopup />, {
      store: testStore,
    });

    expect(screen.getByText('Replacing an attribution')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();

    fireEvent.contextMenu(screen.queryByText('React') as Element);
    expect(screen.queryByText(ButtonText.Delete)).not.toBeInTheDocument();
    expect(screen.queryByText(ButtonText.Hide)).not.toBeInTheDocument();
    expect(
      screen.queryByText(ButtonText.ShowResources)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(ButtonText.Confirm)).not.toBeInTheDocument();
    expect(
      screen.queryByText(ButtonText.ConfirmGlobally)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(ButtonText.DeleteGlobally)
    ).not.toBeInTheDocument();
  });

  test('does not show multi-select checkbox for attributions', () => {
    const testStore = createTestAppStore();
    setupTestState(testStore);
    testStore.dispatch(
      setMultiSelectSelectedAttributionIds(['test_marked_id'])
    );

    renderComponentWithStore(<ReplaceAttributionPopup />, {
      store: testStore,
    });

    expect(screen.getByText('Replacing an attribution')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.queryByText('checkbox')).not.toBeInTheDocument();
  });

  test('renders a ReplaceAttributionPopup and click replace', () => {
    const testStore = createTestAppStore();
    setupTestState(testStore);

    const { store } = renderComponentWithStore(<ReplaceAttributionPopup />, {
      store: testStore,
    });

    expect(screen.getByText('Replacing an attribution')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Replace) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      IpcChannel['SaveFile'],
      {
        manualAttributions: {
          test_selected_id: {
            packageName: 'React',
            attributionConfidence: DiscreteConfidence.High,
          },
        },
        resolvedExternalAttributions: new Set(),
        resourcesToAttributions: {
          'package_1.tr.gz': ['test_selected_id'],
          'package_2.tr.gz': ['test_selected_id'],
        },
      }
    );
  });
});
