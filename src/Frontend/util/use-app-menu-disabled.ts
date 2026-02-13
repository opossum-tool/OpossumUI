// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from 'react';

export function useFrontendPopupOpen(open: boolean) {
  const wasEverDisabledRef = useRef(false);

  useEffect(() => {
    if (open) {
      wasEverDisabledRef.current = true;
    }
    if (wasEverDisabledRef.current) {
      void window.electronAPI.setFrontendPopupOpen(open);
    }
  }, [open]);
}
