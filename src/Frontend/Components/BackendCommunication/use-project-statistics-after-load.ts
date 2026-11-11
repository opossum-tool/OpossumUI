// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { PopupType } from '../../enums/enums';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector, useAppStore } from '../../state/hooks';
import {
  getUserSettings,
  getUserSettingsLoaded,
} from '../../state/selectors/user-settings-selector';
import { getOpenPopups } from '../../state/selectors/view-selector';
import {
  type SetDatabaseInitializedListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { useProcessingState } from '../../util/use-processing-status-updated';
import { useDialogRegistrySnapshot } from '../Dialog/dialog-provider';

export function useProjectStatisticsAfterLoad() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { anyDialogOpen } = useDialogRegistrySnapshot();
  const processing = useProcessingState();
  const settingsLoaded = useAppSelector(getUserSettingsLoaded);
  const showProjectStatistics = useAppSelector(
    (state) => getUserSettings(state).showProjectStatistics,
  );
  const requestedPopups = useAppSelector(getOpenPopups);
  const [pending, setPending] = useState(false);

  useIpcRenderer(
    AllowedFrontendChannels.ProjectOpened,
    () => setPending(true),
    [],
  );
  useIpcRenderer<SetDatabaseInitializedListener>(
    AllowedFrontendChannels.SetDatabaseInitialized,
    (_, initialized) => {
      if (!initialized) {
        setPending(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!pending || !settingsLoaded) {
      return;
    }
    if (!showProjectStatistics) {
      setPending(false);
      return;
    }

    // Read the store at admission time so popup requests made by an earlier
    // effect in this commit (notably startup What's New) take precedence.
    const currentPopups = getOpenPopups(store.getState());
    if (
      currentPopups.some(
        ({ info }) => info.popup === PopupType.ProjectStatisticsPopup,
      )
    ) {
      setPending(false);
      return;
    }
    if (processing || anyDialogOpen || currentPopups.length > 0) {
      return;
    }

    setPending(false);
    dispatch(openPopup(PopupType.ProjectStatisticsPopup));
  }, [
    anyDialogOpen,
    dispatch,
    pending,
    processing,
    requestedPopups,
    settingsLoaded,
    showProjectStatistics,
    store,
  ]);
}
