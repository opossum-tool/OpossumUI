// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import type { FileFormatInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import {
  expectReadonlyIndicatorShown,
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

export const MERGE_DIALOG_LABEL = 'merge split Opossum files dialog';

export async function expectMergeDialogOpen(): Promise<void> {
  await expectPopupShown(MERGE_DIALOG_LABEL);
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

export async function expectSplitDialogOpen(): Promise<void> {
  await expectPopupShown(SPLIT_DIALOG_LABEL);
  const popup = await getPopup(SPLIT_DIALOG_LABEL);
  await waitFor(() => {
    expect(
      within(popup).getByRole('heading', {
        name: text.splitDialog.title,
      }),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectSplitDialogClosed(): Promise<void> {
  await expectPopupHidden(SPLIT_DIALOG_LABEL);
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
    expectReadonlyIndicatorShown(row as HTMLElement);
    expect(within(row as HTMLElement).queryByRole('checkbox')).toBeNull();
  }, SETTLED_TIMEOUT);
}

export const UNSAVED_CHANGES_POPUP_LABEL = 'unsaved changes popup';
export const IMPORT_DIALOG_LABEL = 'import dialog';

export function openImportDialogFromMenu(
  sendToChannel: SendToChannel,
  fileFormat: FileFormatInfo,
  canImportIntoCurrentProject: boolean,
): void {
  sendToChannel(
    AllowedFrontendChannels.ShowImportDialog,
    fileFormat,
    canImportIntoCurrentProject,
  );
}
async function getImportInputFilePathInput(): Promise<HTMLElement> {
  const popup = await getPopup(IMPORT_DIALOG_LABEL);
  return within(popup).getByTestId('import-input-file-path-input');
}

async function getImportOutputFilePathInput(): Promise<HTMLElement> {
  const popup = await getPopup(IMPORT_DIALOG_LABEL);
  return within(popup).getByTestId('import-opossum-file-path-input');
}

export async function selectImportInputFile(): Promise<void> {
  await userEvent.click(await getImportInputFilePathInput());
}

export async function selectImportOutputFile(): Promise<void> {
  await userEvent.click(await getImportOutputFilePathInput());
}

export async function expectImportInputFilePath(path: string): Promise<void> {
  const input = await getImportInputFilePathInput();
  await waitFor(() => {
    expect(input).toBeVisible();
    expect(input).toHaveTextContent(path);
  }, SETTLED_TIMEOUT);
}

export async function expectImportOutputFilePath(path: string): Promise<void> {
  const output = await getImportOutputFilePathInput();
  await waitFor(() => {
    expect(output).toBeVisible();
    expect(output).toHaveTextContent(path);
  }, SETTLED_TIMEOUT);
}

export async function expectUnsavedChangesPopupOpen(): Promise<void> {
  await expectPopupShown(UNSAVED_CHANGES_POPUP_LABEL);
}

export async function expectUnsavedChangesPopupClosed(): Promise<void> {
  await expectPopupHidden(UNSAVED_CHANGES_POPUP_LABEL);
}

export const CONFIRMATION_DIALOG_LABEL = 'confirmation dialog';

export const CONFIRM_SAVE_POPUP_LABEL = text.saveAttributionsPopup.ariaLabel;

export const CONFIRM_DELETE_POPUP_LABEL =
  text.deleteAttributionsPopup.ariaLabel;

export const CONFIRM_REPLACE_POPUP_LABEL = 'confirm replace popup';

export const FORCE_UNLOCK_POPUP_LABEL = 'force unlock popup';

async function expectPopupShown(popupLabel: string): Promise<void> {
  await waitFor(() => {
    const popup = screen.getByLabelText(popupLabel);
    expect(popup).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectPopupHidden(popupLabel: string): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByLabelText(popupLabel)).not.toBeInTheDocument();
  }, SETTLED_TIMEOUT);
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
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(message);
    expect(alerts[0]).toHaveClass(`MuiAlert-color${capitalize(severity)}`);
  }, SETTLED_TIMEOUT);
}

export async function expectNoAlert(container?: HTMLElement): Promise<void> {
  await waitFor(() => {
    // Scoped alerts assert on all alerts within the container so a second
    // banner elsewhere on the page cannot interfere.
    const alerts = container
      ? within(container).queryAllByRole('alert')
      : screen.queryAllByRole('alert');
    expect(alerts).toEqual([]);
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
