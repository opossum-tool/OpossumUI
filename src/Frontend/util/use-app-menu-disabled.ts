// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from 'react';

export function useFrontendPopupOpen(open: boolean) {
  const wasEverDisabled = useRef(false);

  useEffect(() => {
    if (open) {
      wasEverDisabled.current = true;
    }
    if (wasEverDisabled.current) {
      console.log('Setting app menu disabled to', open);
      void window.electronAPI.setFrontendPopupOpen(open);
    }
  }, [open]);
}
