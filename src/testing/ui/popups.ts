// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { text } from '../../shared/text';
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
      within(popup as HTMLElement).getByText(expectedText, { exact: true }),
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
export { MERGE_DIALOG_LABEL };

export async function expectMergeDialogVisibility(
  visible: boolean,
): Promise<void> {
  await expectPopupVisibility(MERGE_DIALOG_LABEL, visible);
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

export const SPLIT_DIALOG_LABEL = 'split dialog';

export function openSplitDialogFromMenu(sendToChannel: SendToChannel): void {
  // The native File-menu item sends this exact IPC channel; simulate the menu
  // click instead of the menu itself.
  sendToChannel(AllowedFrontendChannels.ShowSplitDialog);
}

export async function expectSplitDialogVisibility(
  visible: boolean,
): Promise<void> {
  await expectPopupVisibility(SPLIT_DIALOG_LABEL, visible);
  if (visible) {
    const popup = await getPopup(SPLIT_DIALOG_LABEL);
    await waitFor(() => {
      expect(
        within(popup).getByRole('heading', {
          name: text.splitDialog.title,
        }),
      ).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
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

export const UNSAVED_CHANGES_POPUP_LABEL = 'unsaved changes popup';

export async function expectUnsavedChangesPopupVisibility(
  visible: boolean,
): Promise<void> {
  await expectPopupVisibility(UNSAVED_CHANGES_POPUP_LABEL, visible);
}

export const CONFIRMATION_DIALOG_LABEL = 'confirmation dialog';

export const CONFIRM_SAVE_POPUP_LABEL = text.saveAttributionsPopup.ariaLabel;

export const CONFIRM_DELETE_POPUP_LABEL =
  text.deleteAttributionsPopup.ariaLabel;

export const CONFIRM_REPLACE_POPUP_LABEL = 'confirm replace popup';

export const FORCE_UNLOCK_POPUP_LABEL = 'force unlock popup';

export const PROJECT_METADATA_POPUP_LABEL = 'project metadata';

export async function expectPopupVisibility(
  popupLabel: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const popup = screen.queryByLabelText(popupLabel);
    if (visible) {
      expect(popup).not.toBeNull();
      expect(popup).toBeVisible();
    } else {
      expect(popup).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectPopupHidden(popupLabel: string): Promise<void> {
  await expectPopupVisibility(popupLabel, false);
}

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

export function dismissWithEscape(element: HTMLElement): void {
  fireEvent.keyDown(element, { key: 'Escape' });
}

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

export async function expectAlert(
  message: string | RegExp,
  visible: boolean,
  // No default: a forgotten severity would otherwise silently assert the
  // wrong MUI color class.
  severity: AlertSeverity,
  container?: HTMLElement,
): Promise<void> {
  await waitFor(() => {
    // Scoped alerts assert on all alerts within the container so a second
    // banner elsewhere on the page cannot interfere.
    const alerts = container
      ? within(container).queryAllByRole('alert')
      : screen.queryAllByRole('alert');
    if (visible) {
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent(message);
      expect(alerts[0]).toHaveClass(`MuiAlert-color${capitalize(severity)}`);
    } else {
      expect(alerts).toEqual([]);
    }
  }, SETTLED_TIMEOUT);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function dismissWithBackdrop(popupLabel: string): void {
  const backdrop = within(screen.getByLabelText(popupLabel)).getByRole(
    'presentation',
  );
  fireEvent.mouseDown(backdrop);
  fireEvent.click(backdrop);
}
