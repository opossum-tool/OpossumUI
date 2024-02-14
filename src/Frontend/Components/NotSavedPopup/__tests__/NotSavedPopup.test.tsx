// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PopupType, View } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  openPopup,
  setOpenFileRequest,
  setTargetView,
  setView,
} from '../../../state/actions/view-actions/view-actions';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import {
  getOpenPopup,
  getSelectedView,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { NotSavedPopup } from '../NotSavedPopup';

describe('NotSavedPopup', () => {
  it('cancels without changes', async () => {
    const currentResourceId = faker.system.filePath();
    const targetResourceId = faker.system.filePath();
    const currentView = View.Audit;
    const targetView = View.Report;
    const currentAttributionId = faker.string.uuid();
    const targetAttributionId = faker.string.uuid();
    const packageInfo = faker.opossum.packageInfo();
    const { store } = renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setSelectedAttributionId(currentAttributionId),
        setSelectedResourceId(currentResourceId),
        setTargetSelectedAttributionId(targetAttributionId),
        setTargetSelectedResourceId(targetResourceId),
        setTargetView(targetView),
        setTemporaryDisplayPackageInfo(packageInfo),
        setView(currentView),
      ],
    });

    await userEvent.click(screen.getByText(text.buttons.cancel));

    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedView(store.getState())).toBe(currentView);
    expect(getSelectedResourceId(store.getState())).toBe(currentResourceId);
    expect(getSelectedAttributionId(store.getState())).toBe(
      currentAttributionId,
    );
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      packageInfo,
    );
  });

  it('discards changes and navigates to target', async () => {
    const currentResourceId = faker.system.filePath();
    const targetResourceId = faker.system.filePath();
    const currentView = View.Audit;
    const targetView = View.Report;
    const currentAttributionId = faker.string.uuid();
    const targetAttributionId = faker.string.uuid();
    const packageInfo = faker.opossum.packageInfo();
    const { store } = renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setSelectedAttributionId(currentAttributionId),
        setSelectedResourceId(currentResourceId),
        setTargetSelectedAttributionId(targetAttributionId),
        setTargetSelectedResourceId(targetResourceId),
        setTargetView(targetView),
        setTemporaryDisplayPackageInfo(packageInfo),
        setView(currentView),
      ],
    });

    await userEvent.click(screen.getByText(text.unsavedChangesPopup.discard));

    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedView(store.getState())).toBe(targetView);
    expect(getSelectedResourceId(store.getState())).toBe(targetResourceId);
    expect(getSelectedAttributionId(store.getState())).toBe(
      targetAttributionId,
    );
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
  });

  it('handles request to open a file', async () => {
    renderComponent(<NotSavedPopup />, {
      actions: [openPopup(PopupType.NotSavedPopup), setOpenFileRequest(true)],
    });

    await userEvent.click(screen.getByText(text.unsavedChangesPopup.discard));

    expect(global.window.electronAPI.openFile).toHaveBeenCalledTimes(1);
  });
});
