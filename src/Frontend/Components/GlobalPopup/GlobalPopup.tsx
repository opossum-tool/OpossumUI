// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { PopupType } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { ChangedInputFilePopup } from '../ChangedInputFilePopup/ChangedInputFilePopup';
import { ChangePreferredStatusGloballyPopup } from '../ChangePreferredStatusGloballyPopup/ChangePreferredStatusGloballyPopup';
import { ConfirmDeletionGloballyPopup } from '../ConfirmDeletionGloballyPopup/ConfirmDeletionGloballyPopup';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup/ConfirmDeletionPopup';
import { ConfirmMultiSelectDeletionPopup } from '../ConfirmMultiSelectDeletionPopup/ConfirmMultiSelectDeletionPopup';
import { EditAttributionPopup } from '../EditAttributionPopup/EditAttributionPopup';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { FileSearchPopup } from '../FileSearchPopup/FileSearchPopup';
import { FileSupportDotOpossumAlreadyExistsPopup } from '../FileSupportDotOpossumAlreadyExistsPopup/FileSupportDotOpossumAlreadyExistsPopup';
import { FileSupportPopup } from '../FileSupportPopup/FileSupportPopup';
import { LocatorPopup } from '../LocatorPopup/LocatorPopup';
import { ModifyWasPreferredAttributionPopup } from '../ModifyWasPreferredAttributionPopup/ModifyWasPreferredAttributionPopup';
import { NotSavedPopup } from '../NotSavedPopup/NotSavedPopup';
import { PackageSearchPopup } from '../PackageSearchPopup/PackageSearchPopup';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup/ProjectStatisticsPopup';
import { ReplaceAttributionPopup } from '../ReplaceAttributionPopup/ReplaceAttributionPopup';
import { UpdateAppPopup } from '../UpdateAppPopup/UpdateAppPopup';

function getPopupComponent(popupType: PopupType | null): ReactElement | null {
  switch (popupType) {
    case PopupType.NotSavedPopup:
      return <NotSavedPopup />;
    case PopupType.UnableToSavePopup:
      return <ErrorPopup content="Unable to save." />;
    case PopupType.InvalidLinkPopup:
      return <ErrorPopup content="Cannot open link." />;
    case PopupType.FileSearchPopup:
      return <FileSearchPopup />;
    case PopupType.ProjectMetadataPopup:
      return <ProjectMetadataPopup />;
    case PopupType.ProjectStatisticsPopup:
      return <ProjectStatisticsPopup />;
    case PopupType.ReplaceAttributionPopup:
      return <ReplaceAttributionPopup />;
    case PopupType.ConfirmDeletionGloballyPopup:
      return <ConfirmDeletionGloballyPopup />;
    case PopupType.ConfirmDeletionPopup:
      return <ConfirmDeletionPopup />;
    case PopupType.ConfirmMultiSelectDeletionPopup:
      return <ConfirmMultiSelectDeletionPopup />;
    case PopupType.EditAttributionPopup:
      return <EditAttributionPopup />;
    case PopupType.PackageSearchPopup:
      return <PackageSearchPopup />;
    case PopupType.ChangedInputFilePopup:
      return <ChangedInputFilePopup />;
    case PopupType.FileSupportPopup:
      return <FileSupportPopup />;
    case PopupType.FileSupportDotOpossumAlreadyExistsPopup:
      return <FileSupportDotOpossumAlreadyExistsPopup />;
    case PopupType.UpdateAppPopup:
      return <UpdateAppPopup />;
    case PopupType.LocatorPopup:
      return <LocatorPopup />;
    case PopupType.ModifyWasPreferredAttributionPopup:
      return <ModifyWasPreferredAttributionPopup />;
    case PopupType.ChangePreferredStatusGloballyPopup:
      return <ChangePreferredStatusGloballyPopup />;
    default:
      return null;
  }
}

export function GlobalPopup(): ReactElement | null {
  const openPopupType = useAppSelector(getOpenPopup);
  return getPopupComponent(openPopupType);
}
