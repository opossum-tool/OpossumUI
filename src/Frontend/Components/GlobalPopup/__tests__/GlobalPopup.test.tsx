// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { openPopup } from '../../../state/actions/view-actions/view-actions';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { GlobalPopup } from '../GlobalPopup';
import { PopupType } from '../../../enums/enums';
import { screen } from '@testing-library/react';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { act } from 'react-dom/test-utils';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { openAttributionWizardPopup } from '../../../state/actions/popup-actions/popup-actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('The GlobalPopUp', () => {
  it('does not open by default', () => {
    renderComponentWithStore(<GlobalPopup />);

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
  });

  it('opens the NotSavedPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.NotSavedPopup));
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('opens the ErrorPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.UnableToSavePopup));
    });

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('opens the FileSearchPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.FileSearchPopup));
    });

    expect(
      screen.getByText('Search for Files and Directories'),
    ).toBeInTheDocument();
  });

  it('opens the ProjectMetadataPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ProjectMetadataPopup));
    });

    expect(screen.getByText('Project Metadata')).toBeInTheDocument();
  });

  it('opens the ProjectStatisticsPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    });

    expect(screen.getByText('Project Statistics')).toBeInTheDocument();
  });

  it('opens the ReplaceAttributionPopup', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'name 1' },
    };
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testAttributions,
        }),
      ),
    );

    renderComponentWithStore(<GlobalPopup />, {
      store: testStore,
    });
    act(() => {
      testStore.dispatch(openPopup(PopupType.ReplaceAttributionPopup, 'uuid1'));
    });

    expect(
      screen.getByText('This removes the following attribution'),
    ).toBeInTheDocument();
  });

  it('opens the ConfirmDeletionPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ConfirmDeletionPopup, 'test'));
    });

    expect(
      screen.getByText(
        'Do you really want to delete this attribution for the current file?',
      ),
    ).toBeInTheDocument();
  });

  it('opens the ConfirmDeletionGloballyPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ConfirmDeletionGloballyPopup, 'test'));
    });

    expect(
      screen.getByText(
        'Do you really want to delete this attribution for all files?',
      ),
    ).toBeInTheDocument();
  });

  it('opens the ConfirmMultiSelectDeletionPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ConfirmMultiSelectDeletionPopup));
      store.dispatch(
        setMultiSelectSelectedAttributionIds(['uuid_1', 'uuid_2']),
      );
    });

    expect(
      screen.getByText(
        'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.',
      ),
    ).toBeInTheDocument();
  });

  it('opens the AttributionWizardPopup', () => {
    const store = createTestAppStore();
    const selectedResourceId = '/samplepath/';
    const testExternalAttributions: Attributions = {
      uuid_0: {
        packageName: 'react',
        packageNamespace: 'npm',
      },
    };
    const testManualAttributions: Attributions = {
      uuid_0: {
        packageName: 'react',
        packageNamespace: 'npm',
      },
    };
    const testExternalResourcesToAttributions: ResourcesToAttributions = {
      '/samplepath/subfolder': ['uuid_0'],
    };
    const testManualResourcesToAttributions: ResourcesToAttributions = {
      selectedResourceId: ['uuid_0'],
    };

    store.dispatch(setSelectedResourceId(selectedResourceId));
    store.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions,
      ),
    );
    store.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions),
    );

    renderComponentWithStore(<GlobalPopup />, { store });

    act(() => {
      store.dispatch(openAttributionWizardPopup('uuid_0'));
    });
    expect(screen.getByText('Attribution Wizard')).toBeInTheDocument();
  });

  it('opens the FileSupportPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.FileSupportPopup));
    });

    const header = 'Warning: Outdated input file format';
    expect(screen.getByText(header)).toBeInTheDocument();
  });

  it('opens the FileSupportDotOpossumAlreadyExistsPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    act(() => {
      store.dispatch(
        openPopup(PopupType.FileSupportDotOpossumAlreadyExistsPopup),
      );
    });

    const header = 'Warning: Outdated input file format';
    expect(screen.getByText(header)).toBeInTheDocument();
  });

  it('opens the UpdateAppPopup', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const { store } = renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <GlobalPopup />
      </QueryClientProvider>,
    );
    act(() => {
      store.dispatch(openPopup(PopupType.UpdateAppPopup));
    });

    const header = 'Check for updates';
    expect(screen.getByText(header)).toBeInTheDocument();
  });
});
