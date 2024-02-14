// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareIcon from '@mui/icons-material/Compare';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { Fab } from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import { useCallback, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  addResolvedExternalAttributionAndSave,
  addToSelectedResource,
  removeResolvedExternalAttributionAndSave,
  savePackageInfo,
} from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getIsPackageInfoModified,
  getManualAttributionsToResources,
  getPackageInfoOfSelectedAttribution,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { Button } from '../Button/Button';
import { ConfirmDeletionPopup } from '../ConfirmDeletionPopup/ConfirmDeletionPopup';
import { ConfirmSavePopup } from '../ConfirmSavePopup/ConfirmSavePopup';
import { DiffPopup } from '../DiffPopup/DiffPopup';
import { ReplaceAttributionsPopup } from '../ReplaceAttributionsPopup/ReplaceAttributionsPopup';
import { Container } from './ButtonRow.style';

interface Props {
  packageInfo: PackageInfo;
  isEditable: boolean;
}

export function ButtonRow({ packageInfo, isEditable }: Props) {
  const dispatch = useAppDispatch();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoModified);
  const initialPackageInfo = useAppSelector(
    getPackageInfoOfSelectedAttribution,
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const externalAttributions = useAppSelector(getExternalAttributions);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const manualAttributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );

  const [isDiffPopupOpen, setIsDiffPopupOpen] = useState(false);

  const originalDisplayPackageInfo = useMemo(
    () =>
      !!isEditable && !!packageInfo.originIds?.length
        ? Object.values(externalAttributions).find(({ originIds }) =>
            originIds?.some((id) => packageInfo.originIds?.includes(id)),
          )
        : undefined,
    [externalAttributions, isEditable, packageInfo.originIds],
  );

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const [isConfirmDeletionPopupOpen, setIsConfirmDeletionPopupOpen] =
    useState(false);
  const [isReplaceAttributionsPopupOpen, setIsReplaceAttributionsPopupOpen] =
    useState(false);
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);

  const selectedSignalIsResolved = resolvedExternalAttributions.has(
    packageInfo.id,
  );
  const hasMultipleResources =
    (manualAttributionsToResources[packageInfo.id]?.length ?? 0) > 1;
  const isSelectedResourceOnSelectedAttribution =
    manualAttributionsToResources[packageInfo.id]?.includes(selectedResourceId);

  const handleSave = useCallback(() => {
    hasMultipleResources
      ? setIsConfirmSavePopupOpen(true)
      : dispatch(
          savePackageInfo(selectedResourceId, packageInfo.id, packageInfo),
        );
  }, [hasMultipleResources, dispatch, selectedResourceId, packageInfo]);

  useIpcRenderer(AllowedFrontendChannels.SaveFileRequest, () => handleSave(), [
    handleSave,
  ]);

  if (attributionIdsForReplacement.includes(packageInfo.id)) {
    return null;
  }

  return (
    <Container>
      {attributionIdsForReplacement.length ? (
        renderReplaceButton()
      ) : (
        <>
          {renderSaveButton()}
          {renderLinkButton()}
          {renderCompareButton()}
          {renderDeleteButton()}
          {renderDeleteRestoreButton()}
          {renderRevertButton()}
        </>
      )}
    </Container>
  );

  function renderReplaceButton() {
    return (
      <>
        <Button
          buttonText={text.attributionColumn.replace}
          color={'success'}
          onClick={() => setIsReplaceAttributionsPopupOpen(true)}
        />
        <ReplaceAttributionsPopup
          selectedAttribution={packageInfo}
          open={isReplaceAttributionsPopupOpen}
          onClose={() => setIsReplaceAttributionsPopupOpen(false)}
        />
      </>
    );
  }

  function renderSaveButton() {
    if (!isEditable) {
      return null;
    }

    return (
      <>
        <MuiTooltip
          title={
            packageInfo.preSelected && !isPackageInfoModified
              ? text.attributionColumn.confirm
              : text.attributionColumn.save
          }
          disableInteractive
        >
          <span>
            <Fab
              size={'small'}
              color={'secondary'}
              onClick={handleSave}
              disabled={!packageInfo.preSelected && !isPackageInfoModified}
            >
              {packageInfo.preSelected && !isPackageInfoModified ? (
                <CheckCircleIcon />
              ) : (
                <SaveIcon />
              )}
            </Fab>
          </span>
        </MuiTooltip>
        <ConfirmSavePopup
          attributionIdsToSave={[packageInfo.id]}
          open={isConfirmSavePopupOpen}
          onClose={() => setIsConfirmSavePopupOpen(false)}
        />
      </>
    );
  }

  function renderLinkButton() {
    if (
      !initialPackageInfo ||
      !packageInfo.id ||
      (isEditable && isSelectedResourceOnSelectedAttribution)
    ) {
      return null;
    }

    return (
      <MuiTooltip title={text.attributionColumn.link} disableInteractive>
        <span>
          <Fab
            size={'small'}
            color={'secondary'}
            onClick={() => dispatch(addToSelectedResource(initialPackageInfo))}
          >
            <CallMergeIcon />
          </Fab>
        </span>
      </MuiTooltip>
    );
  }

  function renderDeleteButton() {
    if (!isEditable || !packageInfo.id) {
      return null;
    }

    return (
      <>
        <MuiTooltip title={text.attributionColumn.delete} disableInteractive>
          <span>
            <Fab
              size={'small'}
              color={'secondary'}
              onClick={() => setIsConfirmDeletionPopupOpen(true)}
            >
              <DeleteIcon />
            </Fab>
          </span>
        </MuiTooltip>
        <ConfirmDeletionPopup
          open={isConfirmDeletionPopupOpen}
          onClose={() => setIsConfirmDeletionPopupOpen(false)}
          attributionIdsToDelete={[packageInfo.id]}
        />
      </>
    );
  }

  function renderRevertButton() {
    if (!isEditable) {
      return null;
    }

    return (
      <MuiTooltip title={text.attributionColumn.revert} disableInteractive>
        <span>
          <Fab
            size={'small'}
            color={'secondary'}
            disabled={!isPackageInfoModified}
            onClick={() => {
              dispatch(
                setTemporaryDisplayPackageInfo(
                  initialPackageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
                ),
              );
            }}
          >
            <UndoIcon />
          </Fab>
        </span>
      </MuiTooltip>
    );
  }

  function renderDeleteRestoreButton() {
    if (isEditable) {
      return null;
    }

    return (
      <MuiTooltip
        title={
          selectedSignalIsResolved
            ? text.attributionColumn.restore
            : text.attributionColumn.delete
        }
        disableInteractive
      >
        <span>
          <Fab
            size={'small'}
            color={'secondary'}
            onClick={() => {
              dispatch(
                selectedSignalIsResolved
                  ? removeResolvedExternalAttributionAndSave([packageInfo.id])
                  : addResolvedExternalAttributionAndSave([packageInfo.id]),
              );
            }}
          >
            {selectedSignalIsResolved ? (
              <RestoreFromTrashIcon />
            ) : (
              <DeleteIcon />
            )}
          </Fab>
        </span>
      </MuiTooltip>
    );
  }

  function renderCompareButton() {
    if (!originalDisplayPackageInfo) {
      return null;
    }

    return (
      <>
        <MuiTooltip
          title={text.attributionColumn.compareToOriginal}
          disableInteractive
        >
          <span>
            <Fab
              size={'small'}
              color={'secondary'}
              onClick={() => setIsDiffPopupOpen(true)}
            >
              <CompareIcon />
            </Fab>
          </span>
        </MuiTooltip>
        <DiffPopup
          original={originalDisplayPackageInfo}
          current={packageInfo}
          isOpen={isDiffPopupOpen}
          setOpen={setIsDiffPopupOpen}
          key={isDiffPopupOpen.toString()}
        />
      </>
    );
  }
}
