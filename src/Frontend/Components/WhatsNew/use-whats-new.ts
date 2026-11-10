// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from 'react';

import { PopupType } from '../../enums/enums';
import { updateUserSettings } from '../../state/actions/user-settings-actions/user-settings-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getUserSettingsLoaded } from '../../state/selectors/user-settings-selector';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { isProductionBuild } from '../../util/environment';
import { revision } from '../../whats-new/release-notes';

export function useWhatsNew() {
  const startupCheckCompletedRef = useRef(false);
  const displayedRevisionRef = useRef<number | null>(null);
  const recordedRevisionRef = useRef<number | null>(null);
  const dispatch = useAppDispatch();
  const [settings] = useUserSettings();
  const settingsLoaded = useAppSelector(getUserSettingsLoaded);
  const currentPopup = useAppSelector(getOpenPopup);
  const isOpen = currentPopup?.popup === PopupType.WhatsNewPopup;

  useEffect(() => {
    if (isOpen) {
      startupCheckCompletedRef.current = true;
      displayedRevisionRef.current = revision;
    }
    if (startupCheckCompletedRef.current || !settingsLoaded) {
      return;
    }
    startupCheckCompletedRef.current = true;
    if (
      isProductionBuild() &&
      revision > 0 &&
      settings.lastSeenWhatsNewRevision < revision
    ) {
      dispatch(openPopup(PopupType.WhatsNewPopup));
    }
  }, [settings, settingsLoaded, isOpen, dispatch]);

  useEffect(() => {
    if (
      displayedRevisionRef.current !== revision ||
      revision <= 0 ||
      !settingsLoaded ||
      settings.lastSeenWhatsNewRevision >= revision ||
      recordedRevisionRef.current === revision
    ) {
      return;
    }
    recordedRevisionRef.current = revision;
    void dispatch(
      updateUserSettings({ lastSeenWhatsNewRevision: revision }),
    ).catch((error: unknown) => {
      console.error('Could not remember the displayed release notes.', error);
    });
  }, [isOpen, settings, settingsLoaded, dispatch]);
}
