// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { View } from '../../../enums/enums';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import {
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { TopBar } from '../TopBar';

describe('TopBar', () => {
  it('renders an open file icon', async () => {
    const { store } = await renderComponent(<TopBar />);

    fireEvent.click(screen.getByLabelText('open file'));

    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(window.electronAPI.openFile).toHaveBeenCalledTimes(1);
  });

  it('switches between views', async () => {
    const { store } = await renderComponent(<TopBar />);

    fireEvent.click(screen.getByText(View.Audit));
    expect(isAuditViewSelected(store.getState())).toBe(true);
    expect(isReportViewSelected(store.getState())).toBe(false);

    fireEvent.click(screen.getByText(View.Report));
    expect(isAuditViewSelected(store.getState())).toBe(false);
    expect(isReportViewSelected(store.getState())).toBe(true);
  });
});
