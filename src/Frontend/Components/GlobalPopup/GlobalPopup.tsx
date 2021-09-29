// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { PopupType } from '../../enums/enums';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { NotSavedPopup } from '../NotSavedPopup/NotSavedPopup';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { FileSearchPopup } from '../FileSearchPopup/FileSearchPopup';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup/ProjectMetadataPopup';
import { ReplaceAttributionPopup } from '../ReplaceAttributionPopup/ReplaceAttributionPopup';

function getPopupComponent(popupType: PopupType | null): ReactElement | null {
  switch (popupType) {
    case PopupType.NotSavedPopup:
      return <NotSavedPopup />;
    case PopupType.ErrorPopup:
      return <ErrorPopup />;
    case PopupType.FileSearchPopup:
      return <FileSearchPopup />;
    case PopupType.ProjectMetadataPopup:
      return <ProjectMetadataPopup />;
    case PopupType.ReplaceAttributionPopup:
      return <ReplaceAttributionPopup />;
    default:
      return null;
  }
}

export function GlobalPopup(): ReactElement | null {
  const openPopupType = useSelector(getOpenPopup);
  return getPopupComponent(openPopupType);
}
