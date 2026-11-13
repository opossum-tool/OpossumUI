// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useId, useState } from 'react';

import {
  useDialogRegistration,
  useDialogRegistrySnapshot,
} from './dialog-provider';

export function useProgressPresentation(processing: boolean): boolean {
  const { registerActivity, unregisterActivity } = useDialogRegistration();
  const { referenceDialogOpen } = useDialogRegistrySnapshot();
  const activityId = useId();
  const [presented, setPresented] = useState(false);

  useEffect(() => {
    if (processing) {
      registerActivity(activityId);
      return () => unregisterActivity(activityId);
    }
    unregisterActivity(activityId);
    return undefined;
  }, [activityId, processing, registerActivity, unregisterActivity]);

  useEffect(() => {
    if (!processing) {
      setPresented(false);
    } else if (!referenceDialogOpen) {
      setPresented(true);
    }
  }, [processing, referenceDialogOpen]);

  return processing && presented;
}
