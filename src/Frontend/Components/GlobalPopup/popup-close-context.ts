// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createContext, use } from 'react';

export const PopupCloseContext = createContext<{
  close: () => void;
  id: string;
} | null>(null);

export function useCloseGlobalPopup(): () => void {
  const hostContext = use(PopupCloseContext);
  if (!hostContext) {
    throw new Error('Global popup components must be rendered by GlobalPopup');
  }
  return hostContext.close;
}

export function useGlobalPopupId(): string {
  const hostContext = use(PopupCloseContext);
  if (!hostContext) {
    throw new Error('Global popup components must be rendered by GlobalPopup');
  }
  return hostContext.id;
}
