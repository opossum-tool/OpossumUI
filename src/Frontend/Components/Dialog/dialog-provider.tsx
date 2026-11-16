// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

interface DialogRegistry {
  register(id: string, classification: DialogClassification): void;
  unregister(id: string): void;
  registerActivity(id: string): void;
  unregisterActivity(id: string): void;
  getSnapshot(): DialogRegistrySnapshot;
  subscribe(subscriber: () => void): () => void;
}

export type DialogClassification = 'workflow' | 'reference';

export interface DialogRegistrySnapshot {
  referenceDialogOpen: boolean;
  anyDialogOpen: boolean;
  activityActive: boolean;
}

const DialogRegistryContext = createContext<DialogRegistry | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const openDialogsRef = useRef(new Map<string, DialogClassification>());
  const activitiesRef = useRef(new Set<string>());
  const scheduledReportRef = useRef(false);
  const lastReportedStateRef = useRef<DialogRegistrySnapshot>({
    anyDialogOpen: false,
    activityActive: false,
    referenceDialogOpen: false,
  });
  const snapshotRef = useRef<DialogRegistrySnapshot>({
    referenceDialogOpen: false,
    activityActive: false,
    anyDialogOpen: false,
  });
  const subscribersRef = useRef(new Set<() => void>());

  const scheduleReport = useCallback(() => {
    if (scheduledReportRef.current) {
      return;
    }
    scheduledReportRef.current = true;
    queueMicrotask(() => {
      scheduledReportRef.current = false;
      const snapshot = getCurrentSnapshot();
      const { anyDialogOpen, activityActive } = snapshot;
      if (
        anyDialogOpen === lastReportedStateRef.current.anyDialogOpen &&
        activityActive === lastReportedStateRef.current.activityActive
      ) {
        return;
      }
      lastReportedStateRef.current = snapshot;
      void Promise.resolve()
        .then(() =>
          window.electronAPI.setFrontendDialogState({
            anyDialogOpen,
            activityActive,
          }),
        )
        .catch((error: unknown) => {
          console.error('Failed to update native menu dialog state', error);
        });
    });
  }, []);

  function getCurrentSnapshot(): DialogRegistrySnapshot {
    return {
      anyDialogOpen: openDialogsRef.current.size > 0,
      activityActive: activitiesRef.current.size > 0,
      referenceDialogOpen: [...openDialogsRef.current.values()].some(
        (classification) => classification === 'reference',
      ),
    };
  }
  const notifySnapshotChanged = useCallback(() => {
    const nextSnapshot = getCurrentSnapshot();
    const previousSnapshot = snapshotRef.current;
    if (
      nextSnapshot.anyDialogOpen === previousSnapshot.anyDialogOpen &&
      nextSnapshot.activityActive === previousSnapshot.activityActive &&
      nextSnapshot.referenceDialogOpen === previousSnapshot.referenceDialogOpen
    ) {
      return;
    }
    snapshotRef.current = nextSnapshot;
    subscribersRef.current.forEach((subscriber) => subscriber());
  }, []);

  const register = useCallback(
    (id: string, classification: DialogClassification) => {
      openDialogsRef.current.set(id, classification);
      notifySnapshotChanged();
      scheduleReport();
    },
    [notifySnapshotChanged, scheduleReport],
  );

  const registerActivity = useCallback(
    (id: string) => {
      activitiesRef.current.add(id);
      notifySnapshotChanged();
      scheduleReport();
    },
    [notifySnapshotChanged, scheduleReport],
  );
  const unregisterActivity = useCallback(
    (id: string) => {
      activitiesRef.current.delete(id);
      notifySnapshotChanged();
      scheduleReport();
    },
    [notifySnapshotChanged, scheduleReport],
  );
  const getSnapshot = useCallback(() => snapshotRef.current, []);
  const subscribe = useCallback((subscriber: () => void) => {
    subscribersRef.current.add(subscriber);
    return () => {
      subscribersRef.current.delete(subscriber);
    };
  }, []);

  const unregister = useCallback(
    (id: string) => {
      openDialogsRef.current.delete(id);
      notifySnapshotChanged();
      scheduleReport();
    },
    [notifySnapshotChanged, scheduleReport],
  );

  const registry = useMemo(
    () => ({
      register,
      unregister,
      registerActivity,
      unregisterActivity,
      getSnapshot,
      subscribe,
    }),
    [
      register,
      unregister,
      registerActivity,
      unregisterActivity,
      getSnapshot,
      subscribe,
    ],
  );

  return (
    <DialogRegistryContext value={registry}>{children}</DialogRegistryContext>
  );
}

export function useDialogRegistration() {
  const registry = use(DialogRegistryContext);
  if (!registry) {
    throw new Error('Dialog must be rendered within a DialogProvider');
  }
  return registry;
}

export function useDialogRegistrySnapshot() {
  const registry = useDialogRegistration();
  return useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot,
    registry.getSnapshot,
  );
}
