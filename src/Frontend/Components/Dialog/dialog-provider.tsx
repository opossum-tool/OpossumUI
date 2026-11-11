// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createContext, use, useCallback, useRef } from 'react';

interface DialogRegistry {
  register(id: string): void;
  unregister(id: string): void;
}

const DialogRegistryContext = createContext<DialogRegistry | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const openDialogsRef = useRef(new Set<string>());
  const scheduledReportRef = useRef(false);
  const lastReportedStateRef = useRef<boolean | undefined>(undefined);

  const scheduleReport = useCallback(() => {
    if (scheduledReportRef.current) {
      return;
    }
    scheduledReportRef.current = true;
    queueMicrotask(() => {
      scheduledReportRef.current = false;
      const anyDialogOpen = openDialogsRef.current.size > 0;
      if (
        anyDialogOpen === lastReportedStateRef.current ||
        (!anyDialogOpen && lastReportedStateRef.current === undefined)
      ) {
        return;
      }
      lastReportedStateRef.current = anyDialogOpen;
      void Promise.resolve()
        .then(() => window.electronAPI.setFrontendPopupOpen(anyDialogOpen))
        .catch((error: unknown) => {
          console.error('Failed to update native menu dialog state', error);
        });
    });
  }, []);

  const register = useCallback(
    (id: string) => {
      openDialogsRef.current.add(id);
      scheduleReport();
    },
    [scheduleReport],
  );

  const unregister = useCallback(
    (id: string) => {
      openDialogsRef.current.delete(id);
      scheduleReport();
    },
    [scheduleReport],
  );

  return (
    <DialogRegistryContext value={{ register, unregister }}>
      {children}
    </DialogRegistryContext>
  );
}

export function useDialogRegistration() {
  const registry = use(DialogRegistryContext);
  if (!registry) {
    throw new Error('Dialog must be rendered within a DialogProvider');
  }
  return registry;
}
