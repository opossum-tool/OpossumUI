// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PopupType } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { PopupInfo } from '../../types/types';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { NotSavedPopup } from '../NotSavedPopup/NotSavedPopup';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup/ProjectStatisticsPopup';
import { UpdateAppPopup } from '../UpdateAppPopup/UpdateAppPopup';

function getPopupComponent(popupInfo: PopupInfo | null) {
  switch (popupInfo?.popup) {
    case PopupType.NotSavedPopup:
      return <NotSavedPopup />;
    case PopupType.InvalidLinkPopup:
      return <ErrorPopup content="Cannot open link." />;
    case PopupType.ProjectMetadataPopup:
      return <ProjectMetadataPopup />;
    case PopupType.ProjectStatisticsPopup:
      return <ProjectStatisticsPopup />;
    case PopupType.UpdateAppPopup:
      return <UpdateAppPopup />;
    default:
      return null;
  }
}

/**
 * @deprecated GlobalPopup is a deprecated mechanism for managing popups.
 * Do not use this for new popups!
 */
export const GlobalPopup: React.FC = () => {
  const openPopupInfo = useAppSelector(getOpenPopup);
  return getPopupComponent(openPopupInfo);
};
