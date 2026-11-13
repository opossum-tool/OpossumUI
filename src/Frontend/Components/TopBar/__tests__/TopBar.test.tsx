// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import {
  clickTopBarOpenFileButton,
  expectTextVisible,
} from '../../../../testing/ui';
import { View } from '../../../enums/enums';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import {
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { TopBar } from '../TopBar';

describe('TopBar', () => {
  it('displays the version provided by the main process', async () => {
    vi.mocked(window.electronAPI.getAppVersion).mockResolvedValueOnce(
      'OpossumUI-2026-10-20.2',
    );

    await renderComponent(<TopBar />);

    await expectTextVisible('OpossumUI-2026-10-20.2', true);
  });

  it('renders an open file icon', async () => {
    const { store } = await renderComponent(<TopBar />);

    await clickTopBarOpenFileButton();

    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(window.electronAPI.openFile).toHaveBeenCalledTimes(1);
  });

  it('switches between views', async () => {
    const { store } = await renderComponent(<TopBar />);

    // The view switch controls are styled with pointer-events: none on the
    // label in this component fixture; fireEvent reaches the handler.
    fireEvent.click(screen.getByText(View.Audit));
    expect(isAuditViewSelected(store.getState())).toBe(true);
    expect(isReportViewSelected(store.getState())).toBe(false);

    fireEvent.click(screen.getByText(View.Report));
    expect(isAuditViewSelected(store.getState())).toBe(false);
    expect(isReportViewSelected(store.getState())).toBe(true);
  });
});
