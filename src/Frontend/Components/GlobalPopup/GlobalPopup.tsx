// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback } from 'react';

import { PopupType } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getOpenPopups } from '../../state/selectors/view-selector';
import type { PopupInfo } from '../../types/types';
import { ErrorPopup } from '../ErrorPopup/ErrorPopup';
import { ForceUnlockPopup } from '../ForceUnlockPopup/ForceUnlockPopup';
import { ImportDialog } from '../ImportDialog/ImportDialog';
import { MergeOpossumFilesDialog } from '../MergeOpossumFilesDialog/MergeOpossumFilesDialog';
import { NotSavedPopup } from '../NotSavedPopup/NotSavedPopup';
import { ProjectMetadataPopup } from '../ProjectMetadataPopup/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup/ProjectStatisticsPopup';
import { SplitDialogPopup } from '../SplitDialog/SplitDialogPopup';
import { WhatsNewPopup } from '../WhatsNew/whats-new-popup';
import { PopupCloseContext } from './popup-close-context';

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
    case PopupType.ImportDialog:
      return (
        <ImportDialog
          fileFormat={popupInfo.fileFormat}
          canImportIntoCurrentProject={popupInfo.canImportIntoCurrentProject}
        />
      );
    case PopupType.MergeOpossumFilesDialog:
      return (
        <MergeOpossumFilesDialog
          canMergeIntoCurrentFile={popupInfo.canMergeIntoCurrentFile}
          currentFilePath={popupInfo.currentFilePath}
        />
      );
    case PopupType.SplitDialog:
      return <SplitDialogPopup resourcePath={popupInfo.resourcePath} />;
    case PopupType.ForceUnlockPopup:
      return <ForceUnlockPopup />;
    case PopupType.WhatsNewPopup:
      return <WhatsNewPopup />;
    default:
      return null;
  }
}

/** Renders and owns the lifecycle of each registered global popup instance. */
export const GlobalPopup: React.FC = () => {
  const openPopups = useAppSelector(getOpenPopups);
  return openPopups.map((entry) => (
    <PopupInstanceHost key={entry.id} id={entry.id} info={entry.info} />
  ));
};

interface PopupInstanceHostProps {
  id: string;
  info: PopupInfo;
}

const PopupInstanceHost: React.FC<PopupInstanceHostProps> = ({ id, info }) => {
  const dispatch = useAppDispatch();
  const close = useCallback(() => {
    dispatch(closePopup(id));
  }, [dispatch, id]);
  const popupComponent = getPopupComponent(info);

  return (
    <PopupCloseContext value={{ close, id }}>
      {popupComponent}
    </PopupCloseContext>
  );
};
