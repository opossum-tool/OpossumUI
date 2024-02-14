// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { setResources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import {
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { TopBar } from '../TopBar';

describe('TopBar', () => {
  it('renders an Open file icon', () => {
    const { store } = renderComponent(<TopBar />);

    fireEvent.click(screen.getByLabelText('open file'));

    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(window.electronAPI.openFile).toHaveBeenCalledTimes(1);
  });

  it('switches between views', () => {
    const { store } = renderComponent(<TopBar />);

    fireEvent.click(screen.getByText('Attribution'));
    expect(isAuditViewSelected(store.getState())).toBe(true);
    expect(isReportViewSelected(store.getState())).toBe(false);

    fireEvent.click(screen.getByText('Report'));
    expect(isAuditViewSelected(store.getState())).toBe(false);
    expect(isReportViewSelected(store.getState())).toBe(true);
  });

  it('does not display the TopProgressBar when no file has been opened', () => {
    renderComponent(<TopBar />);
    expect(screen.queryByLabelText('TopProgressBar')).not.toBeInTheDocument();
  });

  it('displays the TopProgressBar after a file has been opened', () => {
    renderComponent(<TopBar />, {
      actions: [setResources({ '': 1 })],
    });
    expect(screen.getByLabelText('TopProgressBar')).toBeInTheDocument();
  });
});
