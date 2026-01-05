// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PopupType } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { PopupInfo } from '../../types/types';
import { useFrontendPopupOpen } from '../../util/use-app-menu-disabled';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { ImportDialog } from '../ImportDialog/ImportDialog';
import { MergeDialog } from '../MergeDialog/MergeDialog';
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
    case PopupType.ImportDialog:
      return popupInfo?.fileFormat ? (
        <ImportDialog fileFormat={popupInfo?.fileFormat} />
      ) : null;
    case PopupType.MergeDialog:
      return popupInfo?.fileFormat ? (
        <MergeDialog fileFormat={popupInfo?.fileFormat} />
      ) : null;
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
  const popupComponent = getPopupComponent(openPopupInfo);

  useFrontendPopupOpen(popupComponent !== null);

  return popupComponent;
};
