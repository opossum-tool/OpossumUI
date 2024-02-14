// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CheckIcon from '@mui/icons-material/Check';
import CompareIcon from '@mui/icons-material/Compare';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import MuiButton from '@mui/material/Button';
import MuiFab from '@mui/material/Fab';
import MuiTooltip from '@mui/material/Tooltip';
import { useCallback, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  addResolvedExternalAttributionAndSave,
  addToSelectedResource,
  removeResolvedExternalAttributionAndSave,
  savePackageInfo,
} from '../../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getExternalAttributions,
  getIsPackageInfoModified,
  getIsSelectedResourceBreakpoint,
  getManualAttributionsToResources,
  getPackageInfoOfSelectedAttribution,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { useIpcRenderer } from '../../../util/use-ipc-renderer';
import { ConfirmDeletionPopup } from '../../ConfirmDeletionPopup/ConfirmDeletionPopup';
import { ConfirmSavePopup } from '../../ConfirmSavePopup/ConfirmSavePopup';
import { DiffPopup } from '../../DiffPopup/DiffPopup';
import { ReplaceAttributionsPopup } from '../../ReplaceAttributionsPopup/ReplaceAttributionsPopup';
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
  const isSelectedResourceBreakpoint = useAppSelector(
    getIsSelectedResourceBreakpoint,
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
  const isCreatingNewAttribution = !packageInfo.id;

  const handleSave = useCallback(() => {
    if (packageInfo.preSelected || isPackageInfoModified) {
      hasMultipleResources
        ? setIsConfirmSavePopupOpen(true)
        : dispatch(
            savePackageInfo(selectedResourceId, packageInfo.id, packageInfo),
          );
    }
  }, [
    packageInfo,
    isPackageInfoModified,
    hasMultipleResources,
    dispatch,
    selectedResourceId,
  ]);

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
          {renderDeleteAttributionButton()}
          {renderDeleteRestoreSignalButton()}
          {renderRevertButton()}
        </>
      )}
    </Container>
  );

  function renderReplaceButton() {
    return (
      <>
        <MuiButton
          variant={'contained'}
          color={'success'}
          onClick={() => setIsReplaceAttributionsPopupOpen(true)}
        >
          {text.attributionColumn.replace}
        </MuiButton>
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

    const isConfirming = packageInfo.preSelected && !isPackageInfoModified;
    const label = isConfirming
      ? text.attributionColumn.confirm
      : text.attributionColumn.save;

    return (
      <>
        <MuiTooltip title={label} disableInteractive>
          <span>
            <MuiFab
              aria-label={label}
              size={'small'}
              color={'secondary'}
              onClick={handleSave}
              disabled={!packageInfo.preSelected && !isPackageInfoModified}
            >
              {isConfirming ? <CheckIcon /> : <SaveIcon />}
            </MuiFab>
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
      isSelectedResourceBreakpoint ||
      isCreatingNewAttribution ||
      (isEditable && isSelectedResourceOnSelectedAttribution)
    ) {
      return null;
    }

    return (
      <MuiTooltip title={text.attributionColumn.link} disableInteractive>
        <span>
          <MuiFab
            aria-label={text.attributionColumn.link}
            size={'small'}
            color={'secondary'}
            disabled={isPackageInfoModified}
            onClick={() => dispatch(addToSelectedResource(packageInfo))}
          >
            <CallMergeIcon />
          </MuiFab>
        </span>
      </MuiTooltip>
    );
  }

  function renderDeleteAttributionButton() {
    if (isCreatingNewAttribution || !isEditable) {
      return null;
    }

    return (
      <>
        <MuiTooltip title={text.attributionColumn.delete} disableInteractive>
          <span>
            <MuiFab
              aria-label={text.attributionColumn.delete}
              size={'small'}
              color={'secondary'}
              onClick={() => setIsConfirmDeletionPopupOpen(true)}
            >
              <DeleteIcon />
            </MuiFab>
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
          <MuiFab
            aria-label={text.attributionColumn.revert}
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
          </MuiFab>
        </span>
      </MuiTooltip>
    );
  }

  function renderDeleteRestoreSignalButton() {
    if (isEditable) {
      return null;
    }

    const label = selectedSignalIsResolved
      ? text.attributionColumn.restore
      : text.attributionColumn.delete;

    return (
      <MuiTooltip title={label} disableInteractive>
        <span>
          <MuiFab
            aria-label={label}
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
          </MuiFab>
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
            <MuiFab
              aria-label={text.attributionColumn.compareToOriginal}
              size={'small'}
              color={'secondary'}
              onClick={() => setIsDiffPopupOpen(true)}
            >
              <CompareIcon />
            </MuiFab>
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
