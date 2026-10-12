// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiLinearProgress from '@mui/material/LinearProgress';
import type { Theme } from '@mui/material/styles';
import { useLayoutEffect, useState } from 'react';

import { borderMedium } from '../../shared-styles';
import { acceptSavedPackageInfoEditing } from '../../state/actions/resource-actions/editing-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getIsPackageInfoDirty,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { usePickerMode } from '../../state/variables/use-picker-mode';
import { AttributionForm } from '../AttributionForm/AttributionForm';
import { AttributionFormConfirmSavePopup } from '../ConfirmSavePopup/AttributionFormConfirmSavePopup';
import { ButtonRow } from './ButtonRow/ButtonRow';
import { useAttributionDetailsPresentation } from './use-attribution-details-presentation';
import { useConfirmAttributionEdit } from './use-confirm-attribution-edit';

const PROGRESS_INDICATOR_DELAY_MS = 150;

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
  },
  loadingIndicator: {
    height: borderMedium,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
} satisfies SxProps<Theme>;

export function AttributionDetails() {
  const dispatch = useAppDispatch();
  const { presentation, isLoading, selectionIsPending, hasMainAttribution } =
    useAttributionDetailsPresentation();
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const isPackageInfoDirty = useAppSelector(getIsPackageInfoDirty);
  const pickerMode = usePickerMode();
  const [showProgress, setShowProgress] = useState(false);
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);
  const [saveContext, setSaveContext] = useState<{
    attributionId: string;
    resourceId: string;
    packageInfo: typeof temporaryDisplayPackageInfo;
  }>();

  useLayoutEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (isLoading) {
      setShowProgress(false);
      timeout = setTimeout(
        () => setShowProgress(true),
        PROGRESS_INDICATOR_DELAY_MS,
      );
    } else {
      setShowProgress(false);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isLoading]);

  const isEditable =
    !pickerMode.isActive &&
    !presentation.isExternal &&
    !presentation.isAttributionReadonly;
  const confirmAttributionEdit = useConfirmAttributionEdit(
    temporaryDisplayPackageInfo,
  );

  if (!hasMainAttribution && !isLoading) {
    return null;
  }
  if (
    presentation.isResourceReadonly &&
    !presentation.attributionId &&
    !isLoading
  ) {
    return null;
  }

  return (
    <MuiBox
      aria-label={'attribution column'}
      aria-busy={isLoading}
      data-dirty={isPackageInfoDirty}
      sx={classes.root}
    >
      {showProgress && isLoading && (
        <MuiLinearProgress
          data-testid={'attribution-details-loading'}
          sx={classes.loadingIndicator}
        />
      )}
      <AttributionForm
        packageInfo={temporaryDisplayPackageInfo}
        onEdit={isEditable ? confirmAttributionEdit.confirm : undefined}
        dimmed={pickerMode.isActive}
        interactionBlocked={isLoading}
      />
      <ButtonRow
        key={selectionIsPending ? 'pending' : 'ready'}
        presentation={presentation}
        draft={temporaryDisplayPackageInfo}
        isLoading={isLoading}
        onOpenSave={() => {
          if (temporaryDisplayPackageInfo.id) {
            setSaveContext({
              attributionId: temporaryDisplayPackageInfo.id,
              resourceId: presentation.resourceId,
              packageInfo: temporaryDisplayPackageInfo,
            });
            setIsConfirmSavePopupOpen(true);
          }
        }}
      />
      {saveContext && (
        <AttributionFormConfirmSavePopup
          selection={{
            mode: 'explicit',
            attributionUuids: [saveContext.attributionId],
          }}
          open={isConfirmSavePopupOpen}
          onClose={() => setIsConfirmSavePopupOpen(false)}
          onAcceptDrafts={() => {
            dispatch(
              acceptSavedPackageInfoEditing({
                attributionId: saveContext.attributionId,
                resourceId: saveContext.resourceId,
                submittedPackageInfo: saveContext.packageInfo,
              }),
            );
          }}
        />
      )}
      {confirmAttributionEdit.dialog}
    </MuiBox>
  );
}
