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
import { skipToken } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { type PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getIsPackageInfoDirty,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import {
  addAttributionsToSelectedResource,
  saveAttributions,
} from '../../../util/attribution-actions';
import { backend } from '../../../util/backendClient';
import { isPackageInvalid } from '../../../util/input-validation';
import { useIpcRenderer } from '../../../util/use-ipc-renderer';
import { useSelectedAttributionPackageInfo } from '../../../util/use-selected-attribution';
import { useIsSelectedResourceBreakpoint } from '../../../util/use-selected-resource';
import { ConfirmDeletePopup } from '../../ConfirmDeletePopup/ConfirmDeletePopup';
import { ConfirmReplacePopup } from '../../ConfirmReplacePopup/ConfirmReplacePopup';
import { ConfirmSavePopup } from '../../ConfirmSavePopup/ConfirmSavePopup';
import { DiffPopup } from '../../DiffPopup/DiffPopup';
import { Container } from './ButtonRow.style';

interface Props {
  packageInfo: PackageInfo;
  isEditable: boolean;
}

export function ButtonRow({ packageInfo, isEditable }: Props) {
  const dispatch = useAppDispatch();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoDirty);
  const isInvalid = useMemo(() => isPackageInvalid(packageInfo), [packageInfo]);
  const initialPackageInfo = useSelectedAttributionPackageInfo();
  const { data: resolvedExternalAttributions } =
    backend.resolvedAttributionUuids.useQuery();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();

  const originalAttributionQuery = backend.getAttributionData.useQuery(
    packageInfo.originalAttributionId
      ? {
          attributionUuid: packageInfo.originalAttributionId,
        }
      : skipToken,
  );

  const originalAttribution = packageInfo.originalAttributionId
    ? originalAttributionQuery.data?.packageInfo
    : undefined;

  const [isDiffPopupOpen, setIsDiffPopupOpen] = useState(false);

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const [isConfirmDeletionPopupOpen, setIsConfirmDeletionPopupOpen] =
    useState(false);
  const [isReplaceAttributionsPopupOpen, setIsReplaceAttributionsPopupOpen] =
    useState(false);
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);

  const selectedSignalIsResolved = resolvedExternalAttributions?.has(
    packageInfo.id,
  );

  const { data: attributionData } =
    backend.getResourceCountOnAttribution.useQuery({
      attributionUuid: packageInfo.id,
    });
  const hasMultipleResources =
    attributionData?.isManual && attributionData?.resourceCount > 1;

  const { data: attributions } = backend.listAttributions.useQuery({
    resourcePathForRelationships: selectedResourceId,
    uuids: [packageInfo.id],
  });
  const isSelectedResourceOnSelectedAttribution =
    attributionData?.isManual &&
    attributions?.[packageInfo.id]?.relation === 'resource';

  const isCreatingNewAttribution = !packageInfo.id;

  const handleSave = useCallback(async () => {
    if (packageInfo.preSelected || isPackageInfoModified) {
      if (hasMultipleResources) {
        setIsConfirmSavePopupOpen(true);
      } else {
        if (packageInfo.id) {
          const newId = await saveAttributions({
            [packageInfo.id]: packageInfo,
          });
          dispatch(setSelectedAttributionId(newId));
          return;
        }
        const newId = await addAttributionsToSelectedResource(
          selectedResourceId,
          { [packageInfo.id]: packageInfo },
        );
        dispatch(setSelectedAttributionId(newId));
      }
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
        <ConfirmReplacePopup
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
              disabled={
                isInvalid ||
                (!packageInfo.preSelected && !isPackageInfoModified)
              }
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
      (isEditable && isSelectedResourceOnSelectedAttribution !== false)
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
            onClick={async () => {
              const newId = await addAttributionsToSelectedResource(
                selectedResourceId,
                { [packageInfo.id]: packageInfo },
              );
              dispatch(setSelectedAttributionId(newId));
            }}
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
        <ConfirmDeletePopup
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
            onClick={async () => {
              selectedSignalIsResolved
                ? await backend.unresolveAttributions.mutate({
                    attributionUuids: [packageInfo.id],
                  })
                : await backend.resolveAttributions.mutate({
                    attributionUuids: [packageInfo.id],
                  });
              window.electronAPI.saveFile();
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
    if (!isEditable || !originalAttribution) {
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
          original={originalAttribution}
          current={packageInfo}
          isOpen={isDiffPopupOpen}
          setOpen={setIsDiffPopupOpen}
          key={isDiffPopupOpen.toString()}
        />
      </>
    );
  }
}
