// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { text } from '../../../../shared/text';
import {
  expectReadonlyIndicator,
  getPopup,
  isNodeEnabled,
  type SendToChannel,
  SETTLED_TIMEOUT,
} from './common';

export async function expectComparingWithAlertIsVisible(): Promise<void> {
  await waitFor(() => {
    expect(
      screen.getByText(text.packageLists.selectComparisonAttribution),
    ).toBeVisible();
    expect(
      screen.getByText(text.packageLists.selectComparisonSignal),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectPopupHasText(
  popupLabel: string,
  expectedText: string,
): Promise<void> {
  await waitFor(() => {
    const popup = screen.queryByLabelText(popupLabel);
    expect(popup).not.toBeNull();
    expect(
      within(popup as HTMLElement).getByText(expectedText, { exact: false }),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function clickPopupButton(
  popupLabel: string,
  buttonName: string,
): Promise<void> {
  const popup = await getPopup(popupLabel);
  await userEvent.click(
    await waitFor(() => {
      const button = within(popup).getByRole('button', {
        name: buttonName,
      });
      if (!isNodeEnabled(button)) {
        throw new Error(`Button '${buttonName}' still disabled`);
      }
      return button;
    }, SETTLED_TIMEOUT),
  );
}

const MERGE_DIALOG_LABEL = 'merge split Opossum files dialog';

export async function expectMergeDialogVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const dialog = screen.queryByLabelText(MERGE_DIALOG_LABEL);
    if (visible) {
      expect(dialog).not.toBeNull();
      expect(dialog).toBeVisible();
    } else {
      expect(dialog).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectMergeDialogMergesIntoCurrentProject(): Promise<void> {
  await waitFor(() => {
    expect(
      within(screen.getByLabelText(MERGE_DIALOG_LABEL)).getByLabelText(
        text.mergeOpossumFilesDialog.mergeIntoCurrentProject,
      ),
    ).toBeChecked();
  }, SETTLED_TIMEOUT);
}

export async function expectMergeDialogShowsCurrentFile(
  currentFilePath: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(screen.getByLabelText(MERGE_DIALOG_LABEL)).getByText(
        currentFilePath,
      ),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

const SPLIT_DIALOG_LABEL = 'split dialog';

export function openSplitDialogFromMenu(sendToChannel: SendToChannel): void {
  // The native File-menu item sends this exact IPC channel; simulate the menu
  // click instead of the menu itself.
  sendToChannel(AllowedFrontendChannels.ShowSplitDialog);
}

export async function expectSplitDialogVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const popup = screen.queryByLabelText(SPLIT_DIALOG_LABEL);
    if (visible) {
      expect(popup).not.toBeNull();
      expect(popup).toBeVisible();
      expect(
        within(popup as HTMLElement).getByRole('heading', {
          name: text.splitDialog.title,
        }),
      ).toBeVisible();
    } else {
      expect(popup).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectSplitDialogCreateButtonEnabled(
  enabled: boolean,
): Promise<void> {
  const popup = await getPopup(SPLIT_DIALOG_LABEL);
  const button = within(popup).getByRole('button', {
    name: text.splitDialog.create,
  });
  await waitFor(() => {
    expect(isNodeEnabled(button)).toBe(enabled);
  }, SETTLED_TIMEOUT);
}

export async function cancelSplitDialog(): Promise<void> {
  await clickPopupButton(SPLIT_DIALOG_LABEL, text.buttons.cancel);
}

export async function expectSplitDialogResourceIsReadonly(
  name: string,
): Promise<void> {
  const popup = await getPopup(SPLIT_DIALOG_LABEL);
  await waitFor(() => {
    const row = within(popup).getByText(name, { exact: true }).parentElement;
    expect(row).not.toBeNull();
    expectReadonlyIndicator(row as HTMLElement, true);
    expect(within(row as HTMLElement).queryByRole('checkbox')).toBeNull();
  }, SETTLED_TIMEOUT);
}

const UNSAVED_CHANGES_POPUP_LABEL = 'unsaved changes popup';

export async function expectUnsavedChangesPopupVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const popup = screen.queryByLabelText(UNSAVED_CHANGES_POPUP_LABEL);
    if (visible) {
      expect(popup).not.toBeNull();
      expect(popup).toBeVisible();
    } else {
      expect(popup).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

const CONFIRM_SAVE_POPUP_LABEL = text.saveAttributionsPopup.ariaLabel;

export async function expectConfirmSavePopupIsVisible(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByLabelText(CONFIRM_SAVE_POPUP_LABEL)).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectConfirmSavePopupSaveOnlyOnSelectedIsHidden(): Promise<void> {
  await waitFor(() => {
    const popup = screen.getByLabelText(CONFIRM_SAVE_POPUP_LABEL);
    expect(
      within(popup).queryByRole('button', {
        name: text.saveAttributionsPopup.saveLocally,
      }),
    ).toBeNull();
  }, SETTLED_TIMEOUT);
}
