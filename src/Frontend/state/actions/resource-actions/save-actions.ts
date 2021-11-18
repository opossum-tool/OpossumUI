// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionsToResources,
  PackageInfo,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { State } from '../../../types/types';
import {
  DiscreteConfidence,
  PopupType,
  SavePackageInfoOperation,
} from '../../../enums/enums';
import { packageInfoHasNoSignificantFields } from '../../../util/package-info-has-no-significant-fields';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import {
  getIsSavingDisabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getResourcesToManualAttributions,
  wereTemporaryPackageInfoModified,
} from '../../selectors/all-views-resource-selectors';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import {
  resetSelectedPackagePanelIfContainedAttributionWasRemoved,
  resetTemporaryPackageInfo,
} from './navigation-actions';
import {
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../selectors/audit-view-resource-selectors';
import { attributionForTemporaryPackageInfoExists } from '../../helpers/save-action-helpers';
import {
  ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
  ACTION_DELETE_ATTRIBUTION,
  ACTION_LINK_TO_ATTRIBUTION,
  ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
  ACTION_SET_IS_SAVING_DISABLED,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  CreateAttributionForSelectedResource,
  DeleteAttribution,
  LinkToAttributionAction,
  ReplaceAttributionWithMatchingAttributionAction,
  SetIsSavingDisabled,
  UnlinkResourceFromAttributionAction,
  UpdateAttribution,
} from './types';

import { isEmpty } from 'lodash';
import { getAttributionBreakpointCheckForState } from '../../../util/is-attribution-breakpoint';
import { openPopup } from '../view-actions/view-actions';

export function setIsSavingDisabled(
  isSavingDisabled: boolean
): SetIsSavingDisabled {
  return {
    type: ACTION_SET_IS_SAVING_DISABLED,
    payload: isSavingDisabled,
  };
}

export function savePackageInfoIfSavingIsNotDisabled(
  resourceId: string | null,
  attributionId: string | null,
  packageInfo: PackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (getIsSavingDisabled(getState())) {
      dispatch(openPopup(PopupType.UnableToSavePopup));
      return;
    }
    dispatch(savePackageInfo(resourceId, attributionId, packageInfo));
  };
}

export function savePackageInfo(
  resourceId: string | null,
  attributionId: string | null,
  packageInfo: PackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const strippedPackageInfo: PackageInfo = getStrippedPackageInfo(
      getPackageInfoWithDefaultConfidenceIfNotLowOrHigh(packageInfo)
    );
    const state = getState();

    if (
      resourceId &&
      getAttributionBreakpointCheckForState(state)(resourceId)
    ) {
      throw new Error(`${resourceId} is a breakpoint, saving not allowed`);
    }

    const saveOperation: SavePackageInfoOperation = getSavePackageInfoOperation(
      attributionId,
      resourceId,
      strippedPackageInfo,
      state
    );

    switch (saveOperation) {
      case SavePackageInfoOperation.Create:
        dispatch(createAttributionForSelectedResource(strippedPackageInfo));
        break;
      case SavePackageInfoOperation.Update:
        attributionId &&
          dispatch(updateAttribution(attributionId, strippedPackageInfo));
        break;
      case SavePackageInfoOperation.Delete:
        attributionId && dispatch(deleteAttribution(attributionId));
        break;
      case SavePackageInfoOperation.Replace:
        attributionId &&
          dispatch(
            replaceAttributionWithMatchingAttribution(
              attributionId,
              strippedPackageInfo
            )
          );
        break;
      case SavePackageInfoOperation.Link:
        resourceId &&
          dispatch(linkToAttribution(resourceId, strippedPackageInfo));
        break;
    }

    dispatch(resetSelectedPackagePanelIfContainedAttributionWasRemoved());
    dispatch(resetTemporaryPackageInfo());

    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

function getSavePackageInfoOperation(
  attributionId: string | null,
  resourceId: string | null,
  strippedPackageInfo: PackageInfo,
  state: State
): SavePackageInfoOperation {
  if (packageInfoHasNoSignificantFields(strippedPackageInfo)) {
    return SavePackageInfoOperation.Delete;
  }

  if (attributionForTemporaryPackageInfoExists(strippedPackageInfo, state)) {
    return attributionId
      ? SavePackageInfoOperation.Replace
      : SavePackageInfoOperation.Link;
  }

  if (resourceId && !attributionId) {
    return SavePackageInfoOperation.Create;
  }

  return SavePackageInfoOperation.Update;
}

export function saveManualAndResolvedAttributionsToFile(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const saveFileArgs: SaveFileArgs = {
      manualAttributions: getManualAttributions(getState()),
      resourcesToAttributions: getResourcesToManualAttributions(getState()),
      resolvedExternalAttributions: getResolvedExternalAttributions(getState()),
    };

    window.ipcRenderer.invoke(IpcChannel.SaveFile, saveFileArgs);
  };
}

export function unlinkAttributionAndSavePackageInfo(
  resourceId: string,
  attributionId: string,
  packageInfo: PackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const attributionsToResources: AttributionsToResources =
      getManualAttributionsToResources(getState());

    if (attributionsToResources[attributionId].length > 1) {
      dispatch(unlinkResourceFromAttribution(resourceId, attributionId));
    }

    dispatch(savePackageInfo(resourceId, null, packageInfo));
  };
}

export function addToSelectedResource(
  packageInfo: PackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(
        savePackageInfo(
          getSelectedResourceId(getState()),
          null,
          getPackageInfoWithDefaultConfidence(packageInfo)
        )
      );
    }
  };
}

export function deleteAttributionGloballyAndSave(
  attributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(savePackageInfo(null, attributionId, {}));
  };
}

export function deleteAttributionAndSave(
  resourceId: string,
  attributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const attributionsToResources: AttributionsToResources =
      getManualAttributionsToResources(getState());

    if (attributionsToResources[attributionId].length > 1) {
      dispatch(unlinkResourceFromAttributionAndSave(resourceId, attributionId));
    } else {
      dispatch(deleteAttributionGloballyAndSave(attributionId));
    }
  };
}

function unlinkResourceFromAttributionAndSave(
  resourceId: string,
  attributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(unlinkResourceFromAttribution(resourceId, attributionId));

    dispatch(resetSelectedPackagePanelIfContainedAttributionWasRemoved());
    dispatch(resetTemporaryPackageInfo());

    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

function createAttributionForSelectedResource(
  strippedPackageInfo: PackageInfo
): CreateAttributionForSelectedResource {
  return {
    type: ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
    payload: strippedPackageInfo,
  };
}

function updateAttribution(
  attributionId: string,
  strippedPackageInfo: PackageInfo
): UpdateAttribution {
  return {
    type: ACTION_UPDATE_ATTRIBUTION,
    payload: { attributionId, strippedPackageInfo },
  };
}

function deleteAttribution(attributionIdToDelete: string): DeleteAttribution {
  return {
    type: ACTION_DELETE_ATTRIBUTION,
    payload: attributionIdToDelete,
  };
}

function replaceAttributionWithMatchingAttribution(
  attributionId: string,
  strippedPackageInfo: PackageInfo
): ReplaceAttributionWithMatchingAttributionAction {
  return {
    type: ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
    payload: { attributionId, strippedPackageInfo },
  };
}

function linkToAttribution(
  resourceId: string,
  strippedPackageInfo: PackageInfo
): LinkToAttributionAction {
  return {
    type: ACTION_LINK_TO_ATTRIBUTION,
    payload: { resourceId, strippedPackageInfo },
  };
}

function unlinkResourceFromAttribution(
  resourceId: string,
  attributionId: string
): UnlinkResourceFromAttributionAction {
  return {
    type: ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
    payload: { resourceId, attributionId },
  };
}

function getPackageInfoWithDefaultConfidence(
  packageInfo: PackageInfo
): PackageInfo {
  return isEmpty(packageInfo)
    ? packageInfo
    : {
        ...packageInfo,
        attributionConfidence: DiscreteConfidence.High,
      };
}

function getPackageInfoWithDefaultConfidenceIfNotLowOrHigh(
  packageInfo: PackageInfo
): PackageInfo {
  return packageInfo.attributionConfidence &&
    [
      DiscreteConfidence.Low.valueOf(),
      DiscreteConfidence.High.valueOf(),
    ].includes(packageInfo.attributionConfidence)
    ? packageInfo
    : getPackageInfoWithDefaultConfidence(packageInfo);
}
