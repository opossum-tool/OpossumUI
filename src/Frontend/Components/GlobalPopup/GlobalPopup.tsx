// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { PopupType } from '../../enums/enums';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { NotSavedPopup } from '../NotSavedPopup/NotSavedPopup';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { FileSearchPopup } from '../FileSearchPopup/FileSearchPopup';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup/ProjectMetadataPopup';
import { ReplaceAttributionPopup } from '../ReplaceAttributionPopup/ReplaceAttributionPopup';
import { ConfirmDeletionGloballyPopup } from '../ConfirmDeletionGloballyPopup/ConfirmDeletionGloballyPopup';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup/ConfirmDeletionPopup';
import { useAppSelector } from '../../state/hooks';
import { ConfirmMultiSelectDeletionPopup } from '../ConfirmMultiSelectDeletionPopup/ConfirmMultiSelectDeletionPopup';
import { EditAttributionPopup } from '../EditAttributionPopup/EditAttributionPopup';

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
    default:
      return null;
  }
}

export function GlobalPopup(): ReactElement | null {
  const openPopupType = useAppSelector(getOpenPopup);
  return getPopupComponent(openPopupType);
}
