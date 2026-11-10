// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { text } from '../../../shared/text';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { ReleaseNotes, revision } from '../../whats-new/release-notes';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { releaseNotesContentSx } from './whats-new-popup.style';

export function WhatsNewPopup() {
  const dispatch = useAppDispatch();

  function close() {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      header={text.whatsNew.title}
      aria-label={text.whatsNew.title}
      isOpen={true}
      width="60rem"
      fullWidth
      rightButtonConfig={{ buttonText: text.buttons.close, onClick: close }}
      onEscapeKeyDown={close}
      onBackdropClick={close}
    >
      <MuiBox component="article" sx={releaseNotesContentSx}>
        {revision > 0 ? <ReleaseNotes /> : <p>{text.whatsNew.empty}</p>}
      </MuiBox>
    </NotificationPopup>
  );
}
