// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CheckIcon from '@mui/icons-material/Check';
import CompareIcon from '@mui/icons-material/Compare';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import MuiButton from '@mui/material/Button';
import MuiCircularProgress from '@mui/material/CircularProgress';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type {
  Attributions,
  PackageInfo,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setTargetAttributionRelation } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getIsPackageInfoDirty } from '../../../state/selectors/resource-selectors';
import { useAttributionSelectionForReplacement } from '../../../state/variables/use-attribution-selection-for-replacement';
import { useCompareSelectionSource } from '../../../state/variables/use-compare-selection';
import { usePickerMode } from '../../../state/variables/use-picker-mode';
import { backend } from '../../../util/backendClient';
import { getCardLabels } from '../../../util/get-card-labels';
import { isPackageInvalid } from '../../../util/input-validation';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../../../util/use-focused-attribution-outcome';
import { useIpcRenderer } from '../../../util/use-ipc-renderer';
import { ConfirmDeletePopup } from '../../ConfirmDeletePopup/ConfirmDeletePopup';
import { ConfirmReplacePopup } from '../../ConfirmReplacePopup/ConfirmReplacePopup';
import { AttributionFormConfirmSavePopup } from '../../ConfirmSavePopup/AttributionFormConfirmSavePopup';
import { DiffPopup } from '../../DiffPopup/DiffPopup';
import type { AttributionDetailsPresentation } from '../use-attribution-details-presentation';
import { Container, Fab } from './ButtonRow.style';

interface Props {
  presentation: AttributionDetailsPresentation;
  draft: PackageInfo;
  isLoading: boolean;
}

export function ButtonRow(props: Props) {
  const dispatch = useAppDispatch();
  const isPackageInfoDirty = useAppSelector(getIsPackageInfoDirty);

  const resolveAttributions = backend.resolveAttributions.useMutation();
  const unresolveAttributions = backend.unresolveAttributions.useMutation();
  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const linkAttribution = backend.createOrMatchAttributions.useMutation({
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const updateOrMatch = backend.updateOrMatchAttributions.useMutation({
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const createOrMatch = backend.createOrMatchAttributions.useMutation({
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const mutationPending = useIsMutating() > 0;

  const currentAttribution = props.presentation;
  const currentPackageInfo = props.draft;
  const pickerMode = usePickerMode();
  const attribution = {
    packageInfo: currentPackageInfo,
    initialPackageInfo: currentAttribution.packageInfo,
    resourceId: currentAttribution.resourceId,
    selectedAttributionId: currentAttribution.attributionId,
    isExternal: currentAttribution.isExternal,
    isReadonly: currentAttribution.isAttributionReadonly,
    isBreakpoint: currentAttribution.isBreakpoint,
    isResourceReadonly: currentAttribution.isResourceReadonly,
    isEditable:
      !pickerMode.isActive &&
      !currentAttribution.isExternal &&
      !currentAttribution.isAttributionReadonly,
  };
  const queries = {
    originalAttribution: currentAttribution.originalAttribution,
    originalAttributionIsExternal:
      currentAttribution.originalAttributionIsExternal,
    resolvedExternalAttributions:
      currentAttribution.resolvedExternalAttributions,
    isLinked: currentAttribution.isLinked,
    readiness: {
      resourceInfo: currentAttribution.hasResourceInfo,
      linkage: currentAttribution.hasLinkage,
      original: currentAttribution.hasOriginalAttribution,
      resolved: currentAttribution.hasResolvedAttributions,
    },
  };
  const isDirty = isPackageInfoDirty;
  const interactionBlocked = props.isLoading;

  const [isDiffPopupOpen, setIsDiffPopupOpen] = useState(false);

  const {
    compareSelectionSource,
    compareSelectionSourceIsExternal,
    clearCompareSelectionAfterSave,
    setCompareSelectionSource,
  } = useCompareSelectionSource();
  const acceptDiffAttributions = useCallback(
    (acceptedAttributions: Attributions) => {
      const acceptedPackageInfo = acceptedAttributions[currentPackageInfo.id];
      if (acceptedPackageInfo !== undefined) {
        dispatch(setTemporaryDisplayPackageInfo(acceptedPackageInfo));
      }
    },
    [dispatch, currentPackageInfo.id],
  );
  const handleCompareSelectionAcceptDrafts = useCallback(
    (acceptedAttributions: Attributions) => {
      acceptDiffAttributions(acceptedAttributions);
      clearCompareSelectionAfterSave();
    },
    [acceptDiffAttributions, clearCompareSelectionAfterSave],
  );
  const [isCompareSelectionDiffOpen, setIsCompareSelectionDiffOpen] =
    useState(false);

  const [selectionForReplacement, setSelectionForReplacement] =
    useAttributionSelectionForReplacement();
  const [isConfirmDeletionPopupOpen, setIsConfirmDeletionPopupOpen] =
    useState(false);
  const [isReplaceAttributionsPopupOpen, setIsReplaceAttributionsPopupOpen] =
    useState(false);
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);

  const hasMultipleResources = currentAttribution.hasMultipleResources;
  const packageInfo = currentPackageInfo;
  const isInvalid = useMemo(() => isPackageInvalid(packageInfo), [packageInfo]);
  const isCreatingNewAttribution = !packageInfo.id;
  const selectedSignalIsResolved = queries.resolvedExternalAttributions?.has(
    packageInfo.id,
  );
  const isSelectedResourceOnSelectedAttribution =
    !attribution.isExternal && queries.isLinked;

  const handleSave = useCallback(async () => {
    if (interactionBlocked) {
      return;
    }
    if (packageInfo.preSelected || isDirty) {
      if (!queries.readiness.resourceInfo) {
        return;
      }
      if (hasMultipleResources) {
        setIsConfirmSavePopupOpen(true);
      } else if (packageInfo.id) {
        await updateOrMatch.mutateAsync({
          attributions: {
            [packageInfo.id]: packageInfo,
          },
          focusedAttributionUuid: packageInfo.id,
        });
      } else {
        await createOrMatch.mutateAsync({
          resourcePath: attribution.resourceId,
          attributions: {
            [packageInfo.id]: packageInfo,
          },
          focusedAttributionUuid: packageInfo.id,
        });
      }
    }
  }, [
    updateOrMatch,
    createOrMatch,
    isDirty,
    hasMultipleResources,
    packageInfo,
    queries.readiness.resourceInfo,
    attribution.resourceId,
    interactionBlocked,
  ]);

  useLayoutEffect(() => {
    if (!interactionBlocked) {
      return;
    }
    setIsDiffPopupOpen(false);
    setIsCompareSelectionDiffOpen(false);
    setIsConfirmDeletionPopupOpen(false);
    setIsReplaceAttributionsPopupOpen(false);
    setIsConfirmSavePopupOpen(false);
  }, [interactionBlocked]);

  useIpcRenderer(AllowedFrontendChannels.SaveFileRequest, () => handleSave(), [
    handleSave,
  ]);

  return (
    <Container
      data-testid={'attribution-details-footer'}
      inert={interactionBlocked}
    >
      {selectionForReplacement ? (
        renderReplaceButton()
      ) : compareSelectionSource ? (
        renderCompareSelectionControls()
      ) : (
        <>
          {!attribution.isReadonly && renderSaveButton()}
          {!attribution.isReadonly && renderLinkButton()}
          {renderCompareButton()}
          {renderCompareWithButton()}
          {!attribution.isReadonly && renderDeleteAttributionButton()}
          {!attribution.isReadonly && renderDeleteRestoreSignalButton()}
          {!attribution.isReadonly && renderRevertButton()}
        </>
      )}
    </Container>
  );

  function renderReplaceButton() {
    const isPreviewingSource =
      selectionForReplacement?.mode === 'explicit' &&
      selectionForReplacement.attributionUuids.includes(packageInfo.id);
    const canUseAsReplacement =
      !attribution.isReadonly && !isPreviewingSource && !attribution.isExternal;

    return (
      <>
        {canUseAsReplacement && (
          <MuiButton
            variant={'contained'}
            color={'success'}
            loading={mutationPending}
            onClick={() => setIsReplaceAttributionsPopupOpen(true)}
          >
            {text.attributionColumn.replace}
          </MuiButton>
        )}
        {renderPickerModeCancelButton(() => setSelectionForReplacement(null))}
        {canUseAsReplacement && (
          <ConfirmReplacePopup
            selectedAttribution={packageInfo}
            open={isReplaceAttributionsPopupOpen}
            onClose={() => setIsReplaceAttributionsPopupOpen(false)}
          />
        )}
      </>
    );
  }

  function renderPickerModeCancelButton(onCancel: () => void) {
    return (
      <MuiButton variant={'contained'} color={'secondary'} onClick={onCancel}>
        {text.buttons.cancel}
      </MuiButton>
    );
  }

  function renderSaveButton() {
    if (!attribution.isEditable) {
      return null;
    }

    const isConfirming = packageInfo.preSelected && !isDirty;
    const label = isConfirming
      ? text.attributionColumn.confirm
      : text.attributionColumn.save;

    return (
      <>
        <MuiTooltip title={label} disableInteractive>
          <span>
            <Fab
              aria-label={label}
              size={'small'}
              color={'secondary'}
              onClick={handleSave}
              disabled={
                isInvalid ||
                !queries.readiness.resourceInfo ||
                (!packageInfo.preSelected && !isDirty) ||
                mutationPending
              }
            >
              {updateOrMatch.isPending || createOrMatch.isPending ? (
                <MuiCircularProgress size={16} color={'inherit'} />
              ) : isConfirming ? (
                <CheckIcon />
              ) : (
                <SaveIcon />
              )}
            </Fab>
          </span>
        </MuiTooltip>
        <AttributionFormConfirmSavePopup
          selection={{
            mode: 'explicit',
            attributionUuids: [packageInfo.id],
          }}
          open={isConfirmSavePopupOpen}
          onClose={() => setIsConfirmSavePopupOpen(false)}
        />
      </>
    );
  }

  function renderLinkButton() {
    if (
      attribution.isBreakpoint ||
      attribution.isResourceReadonly ||
      isCreatingNewAttribution ||
      (attribution.isEditable &&
        isSelectedResourceOnSelectedAttribution === true)
    ) {
      return null;
    }

    return (
      <MuiTooltip title={text.attributionColumn.link} disableInteractive>
        <span>
          <Fab
            aria-label={text.attributionColumn.link}
            size={'small'}
            color={'secondary'}
            disabled={!queries.readiness.linkage || isDirty || mutationPending}
            onClick={async () => {
              await linkAttribution.mutateAsync({
                resourcePath: attribution.resourceId,
                attributions: {
                  [packageInfo.id]: packageInfo,
                },
                focusedAttributionUuid: packageInfo.id,
              });
              dispatch(setTargetAttributionRelation('resource'));
            }}
          >
            {linkAttribution.isPending ? (
              <MuiCircularProgress size={16} color={'inherit'} />
            ) : (
              <CallMergeIcon />
            )}
          </Fab>
        </span>
      </MuiTooltip>
    );
  }

  function renderDeleteAttributionButton() {
    if (isCreatingNewAttribution || !attribution.isEditable) {
      return null;
    }

    return (
      <>
        <MuiTooltip title={text.attributionColumn.delete} disableInteractive>
          <span>
            <Fab
              aria-label={text.attributionColumn.delete}
              size={'small'}
              color={'secondary'}
              disabled={mutationPending}
              onClick={() => setIsConfirmDeletionPopupOpen(true)}
            >
              <DeleteIcon />
            </Fab>
          </span>
        </MuiTooltip>
        <ConfirmDeletePopup
          open={isConfirmDeletionPopupOpen}
          onClose={() => setIsConfirmDeletionPopupOpen(false)}
          selection={{
            mode: 'explicit',
            attributionUuids: [packageInfo.id],
          }}
        />
      </>
    );
  }

  function renderRevertButton() {
    if (!attribution.isEditable) {
      return null;
    }

    return (
      <MuiTooltip title={text.attributionColumn.revert} disableInteractive>
        <span>
          <Fab
            aria-label={text.attributionColumn.revert}
            size={'small'}
            color={'secondary'}
            disabled={!isDirty || mutationPending}
            onClick={() => {
              dispatch(
                setTemporaryDisplayPackageInfo(
                  attribution.initialPackageInfo || EMPTY_DISPLAY_PACKAGE_INFO,
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

  function renderDeleteRestoreSignalButton() {
    if (attribution.isEditable) {
      return null;
    }

    const label = selectedSignalIsResolved
      ? text.attributionColumn.restore
      : text.attributionColumn.delete;

    return (
      <MuiTooltip title={label} disableInteractive>
        <span>
          <Fab
            aria-label={label}
            size={'small'}
            color={'secondary'}
            disabled={mutationPending || !queries.readiness.resolved}
            onClick={async () => {
              selectedSignalIsResolved
                ? await unresolveAttributions.mutateAsync({
                    selection: {
                      mode: 'explicit',
                      attributionUuids: [packageInfo.id],
                    },
                  })
                : await resolveAttributions.mutateAsync({
                    selection: {
                      mode: 'explicit',
                      attributionUuids: [packageInfo.id],
                    },
                  });
            }}
          >
            {unresolveAttributions.isPending ||
            resolveAttributions.isPending ? (
              <MuiCircularProgress size={16} color={'inherit'} />
            ) : selectedSignalIsResolved ? (
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
    if (
      attribution.isExternal ||
      (!queries.originalAttribution && !packageInfo.originalAttributionId)
    ) {
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
              aria-label={text.attributionColumn.compareToOriginal}
              size={'small'}
              color={'secondary'}
              onClick={() => setIsDiffPopupOpen(true)}
              disabled={
                mutationPending ||
                !queries.readiness.original ||
                !queries.originalAttribution
              }
            >
              <CompareIcon />
            </Fab>
          </span>
        </MuiTooltip>
        {queries.originalAttribution && (
          <DiffPopup
            leftItem={{
              packageInfo: queries.originalAttribution,
              isExternal: queries.originalAttributionIsExternal ?? true,
              label: text.attributionColumn.original,
            }}
            rightItem={{
              packageInfo,
              originalPackageInfo: attribution.initialPackageInfo,
              isExternal: attribution.isExternal,
              label: text.attributionColumn.current,
            }}
            isOpen={isDiffPopupOpen}
            onClose={() => setIsDiffPopupOpen(false)}
            onAcceptDrafts={acceptDiffAttributions}
          />
        )}
      </>
    );
  }

  function renderCompareWithButton() {
    if (!packageInfo.id) {
      return null;
    }

    return (
      <MuiTooltip title={text.attributionColumn.compareWith} disableInteractive>
        <span>
          <Fab
            aria-label={text.attributionColumn.compareWith}
            size={'small'}
            color={'secondary'}
            disabled={mutationPending || isDirty}
            onClick={() => {
              setCompareSelectionSource(packageInfo.id);
            }}
          >
            <CompareArrowsIcon />
          </Fab>
        </span>
      </MuiTooltip>
    );
  }

  function renderCompareSelectionControls() {
    if (!compareSelectionSource) {
      return null;
    }

    const isPreviewingSource = compareSelectionSource.id === packageInfo.id;

    return (
      <>
        {!isPreviewingSource && (
          <MuiButton
            variant={'contained'}
            color={'success'}
            disabled={!packageInfo.id || !compareSelectionSource}
            onClick={() => setIsCompareSelectionDiffOpen(true)}
          >
            {text.attributionColumn.compareConfirm}
          </MuiButton>
        )}
        {renderPickerModeCancelButton(() => setCompareSelectionSource(null))}
        {compareSelectionSource && !isPreviewingSource && (
          <DiffPopup
            leftItem={{
              packageInfo: compareSelectionSource,
              isExternal: compareSelectionSourceIsExternal ?? false,
              label:
                getCardLabels(compareSelectionSource)[0] ??
                compareSelectionSource.id,
            }}
            rightItem={{
              packageInfo,
              originalPackageInfo: attribution.initialPackageInfo,
              isExternal: attribution.isExternal,
              label: getCardLabels(packageInfo)[0] ?? packageInfo.id,
            }}
            isOpen={isCompareSelectionDiffOpen}
            onClose={() => setIsCompareSelectionDiffOpen(false)}
            onAcceptDrafts={handleCompareSelectionAcceptDrafts}
          />
        )}
      </>
    );
  }
}
