// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, within } from '@testing-library/react';

export function dismissWithEscape(element: HTMLElement): void {
  fireEvent.keyDown(element, { key: 'Escape' });
}

export function dismissWithBackdrop(popupLabel: string): void {
  const backdrop = within(screen.getByLabelText(popupLabel)).getByRole(
    'presentation',
  );
  fireEvent.mouseDown(backdrop);
  fireEvent.click(backdrop);
}
