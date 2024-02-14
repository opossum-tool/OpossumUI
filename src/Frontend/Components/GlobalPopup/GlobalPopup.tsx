// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { PopupType } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { FileSupportDotOpossumAlreadyExistsPopup } from '../FileSupportDotOpossumAlreadyExistsPopup/FileSupportDotOpossumAlreadyExistsPopup';
import { FileSupportPopup } from '../FileSupportPopup/FileSupportPopup';
import { NotSavedPopup } from '../NotSavedPopup/NotSavedPopup';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup/ProjectStatisticsPopup';
import { UpdateAppPopup } from '../UpdateAppPopup/UpdateAppPopup';

function getPopupComponent(popupType: PopupType | null) {
  switch (popupType) {
    case PopupType.NotSavedPopup:
      return <NotSavedPopup />;
    case PopupType.InvalidLinkPopup:
      return <ErrorPopup content="Cannot open link." />;
    case PopupType.ProjectMetadataPopup:
      return <ProjectMetadataPopup />;
    case PopupType.ProjectStatisticsPopup:
      return <ProjectStatisticsPopup />;
    case PopupType.FileSupportPopup:
      return <FileSupportPopup />;
    case PopupType.FileSupportDotOpossumAlreadyExistsPopup:
      return <FileSupportDotOpossumAlreadyExistsPopup />;
    case PopupType.UpdateAppPopup:
      return <UpdateAppPopup />;
    case null:
      return null;
  }
}

export function GlobalPopup(): ReactElement | null {
  const openPopupType = useAppSelector(getOpenPopup);
  return getPopupComponent(openPopupType);
}
