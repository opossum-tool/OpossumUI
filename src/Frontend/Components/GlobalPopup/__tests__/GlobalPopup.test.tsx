// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { Attributions } from '../../../../shared/shared-types';
import { PopupType } from '../../../enums/enums';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../GlobalPopup';

describe('The GlobalPopUp', () => {
  it('does not open by default', () => {
    renderComponent(<GlobalPopup />);

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
  });

  it('opens the NotSavedPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.NotSavedPopup));
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('opens the ErrorPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.UnableToSavePopup));
    });

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('opens the FileSearchPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.FileSearchPopup));
    });

    expect(
      screen.getByText('Search for Files and Directories'),
    ).toBeInTheDocument();
  });

  it('opens the ProjectMetadataPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ProjectMetadataPopup));
    });

    expect(screen.getByText('Project Metadata')).toBeInTheDocument();
  });

  it('opens the ProjectStatisticsPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    });

    expect(screen.getByText('Project Statistics')).toBeInTheDocument();
  });

  it('opens the ReplaceAttributionPopup', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'name 1' },
    };
    renderComponent(<GlobalPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: testAttributions,
          }),
        ),
        openPopup(PopupType.ReplaceAttributionPopup, 'uuid1'),
      ],
    });

    expect(
      screen.getByText('This removes the following attribution'),
    ).toBeInTheDocument();
  });

  it('opens the ConfirmDeletionPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
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
    const { store } = renderComponent(<GlobalPopup />);
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
    const { store } = renderComponent(<GlobalPopup />);
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

  it('opens the FileSupportPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
    act(() => {
      store.dispatch(openPopup(PopupType.FileSupportPopup));
    });

    const header = 'Warning: Outdated input file format';
    expect(screen.getByText(header)).toBeInTheDocument();
  });

  it('opens the FileSupportDotOpossumAlreadyExistsPopup', () => {
    const { store } = renderComponent(<GlobalPopup />);
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
    const { store } = renderComponent(
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
