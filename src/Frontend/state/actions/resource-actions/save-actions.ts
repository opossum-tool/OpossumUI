// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty, isEqual, sortBy } from 'lodash';

import {
  DiscreteConfidence,
  PackageInfo,
} from '../../../../shared/shared-types';
import { AllowedSaveOperations, PopupType } from '../../../enums/enums';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import {
  getIsSavingDisabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getResourcesToManualAttributions,
  wereTemporaryDisplayPackageInfoModified,
} from '../../selectors/all-views-resource-selectors';
import {
  getAttributionIdsOfSelectedResource,
  getAttributionIdsOfSelectedResourceClosestParent,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../selectors/audit-view-resource-selectors';
import { AppThunkAction } from '../../types';
import { openPopup } from '../view-actions/view-actions';
import {
  resetSelectedPackagePanelIfContainedAttributionWasRemoved,
  resetTemporaryDisplayPackageInfo,
} from './navigation-actions';
import {
  ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
  ACTION_DELETE_ATTRIBUTION,
  ACTION_LINK_TO_ATTRIBUTION,
  ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
  ACTION_SET_ALLOWED_SAVE_OPERATIONS,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  CreateAttributionForSelectedResource,
  DeleteAttribution,
  LinkToAttributionAction,
  ReplaceAttributionWithMatchingAttributionAction,
  SetAllowedSaveOperation,
  UnlinkResourceFromAttributionAction,
  UpdateAttribution,
} from './types';

export function setAllowedSaveOperations(
  allowedSaveOperations: AllowedSaveOperations,
): SetAllowedSaveOperation {
  return {
    type: ACTION_SET_ALLOWED_SAVE_OPERATIONS,
    payload: allowedSaveOperations,
  };
}

export function savePackageInfoIfSavingIsNotDisabled(
  resourceId: string | null,
  attributionId: string | null,
  packageInfo: PackageInfo,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsSavingDisabled(getState())) {
      dispatch(openPopup(PopupType.UnableToSavePopup));
    } else {
      dispatch(savePackageInfo(resourceId, attributionId, packageInfo));
    }
  };
}

export function unlinkAttributionAndSavePackageInfoIfSavingIsNotDisabled(
  resourceId: string,
  attributionId: string,
  packageInfo: PackageInfo,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getIsSavingDisabled(getState())) {
      dispatch(openPopup(PopupType.UnableToSavePopup));
    } else {
      dispatch(
        unlinkAttributionAndSavePackageInfo(
          resourceId,
          attributionId,
          packageInfo,
        ),
      );
    }
  };
}

export function savePackageInfo(
  resourceId: string | null,
  attributionId: string | null,
  packageInfo: PackageInfo,
  isSavedPackageInactive?: boolean,
): AppThunkAction {
  return (dispatch, getState) => {
    const strippedPackageInfo = getStrippedPackageInfo(packageInfo);
    const matchedPackageInfo = Object.values(
      getManualAttributions(getState()),
    ).find(
      (attribution) =>
        !attribution.preSelected &&
        isEqual(getStrippedPackageInfo(attribution), strippedPackageInfo),
    );

    if (attributionId && isEmpty(strippedPackageInfo)) {
      // DELETE
      dispatch(deleteAttribution(attributionId));
    } else if (matchedPackageInfo && attributionId) {
      // REPLACE
      dispatch(
        replaceAttributionWithMatchingAttribution(
          attributionId,
          matchedPackageInfo.id,
          !isSavedPackageInactive,
        ),
      );
    } else if (matchedPackageInfo && resourceId) {
      // LINK
      dispatch(linkToAttribution(resourceId, matchedPackageInfo.id));
    } else if (resourceId && !attributionId) {
      // CREATE
      dispatch(
        createAttributionForSelectedResource(
          packageInfo,
          !isSavedPackageInactive,
        ),
      );
    } else if (attributionId) {
      // UPDATE
      dispatch(
        updateAttribution(attributionId, packageInfo, !isSavedPackageInactive),
      );
    }

    dispatch(resetSelectedPackagePanelIfContainedAttributionWasRemoved());
    if (!isSavedPackageInactive) {
      dispatch(resetTemporaryDisplayPackageInfo());
    }

    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function saveManualAndResolvedAttributionsToFile(): AppThunkAction {
  return (_, getState) => {
    window.electronAPI.saveFile({
      manualAttributions: getManualAttributions(getState()),
      resourcesToAttributions: getResourcesToManualAttributions(getState()),
      resolvedExternalAttributions: getResolvedExternalAttributions(getState()),
    });
  };
}

export function unlinkAttributionAndSavePackageInfo(
  resourceId: string,
  attributionId: string,
  packageInfo: PackageInfo,
  selectedAttributionId?: string,
): AppThunkAction {
  return (dispatch, getState) => {
    const attributionsToResources =
      getManualAttributionsToResources(getState());

    if (attributionsToResources[attributionId]?.length > 1) {
      dispatch(unlinkResourceFromAttribution(resourceId, attributionId));
    }

    dispatch(
      savePackageInfo(
        resourceId,
        null,
        packageInfo,
        selectedAttributionId
          ? attributionId !== selectedAttributionId
          : undefined,
      ),
    );
  };
}

export function addToSelectedResource(
  packageInfo: PackageInfo,
): AppThunkAction {
  return (dispatch, getState) => {
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(
        savePackageInfo(getSelectedResourceId(getState()), null, {
          ...packageInfo,
          attributionConfidence: DiscreteConfidence.High,
        }),
      );
    }
  };
}

export function deleteAttributionGloballyAndSave(
  attributionId: string,
  selectedAttributionId?: string,
): AppThunkAction {
  return (dispatch) => {
    dispatch(
      savePackageInfo(
        null,
        attributionId,
        { id: attributionId },
        selectedAttributionId
          ? attributionId !== selectedAttributionId
          : undefined,
      ),
    );
  };
}

export function deleteAttributionAndSave(
  resourceId: string,
  attributionId: string,
  selectedAttributionId?: string,
): AppThunkAction {
  return (dispatch, getState) => {
    const attributionsToResources =
      getManualAttributionsToResources(getState());

    if (attributionsToResources[attributionId].length > 1) {
      dispatch(
        unlinkResourceFromAttributionAndSave(
          resourceId,
          attributionId,
          selectedAttributionId,
        ),
      );
    } else {
      dispatch(
        deleteAttributionGloballyAndSave(attributionId, selectedAttributionId),
      );
    }
  };
}

function unlinkResourceFromAttributionAndSave(
  resourceId: string,
  attributionId: string,
  selectedAttributionId?: string,
): AppThunkAction {
  return (dispatch) => {
    const differentAttributionIsDeleted = selectedAttributionId
      ? attributionId !== selectedAttributionId
      : undefined;
    dispatch(unlinkResourceFromAttribution(resourceId, attributionId));

    dispatch(unlinkAttributionsIfParentAttributionsAreIdentical(resourceId));
    dispatch(resetSelectedPackagePanelIfContainedAttributionWasRemoved());
    if (!differentAttributionIsDeleted) {
      dispatch(resetTemporaryDisplayPackageInfo());
    }
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

function unlinkAttributionsIfParentAttributionsAreIdentical(
  resourceId: string,
): AppThunkAction {
  return (dispatch, getState) => {
    const attributionsIdsForResource =
      getAttributionIdsOfSelectedResource(getState());
    const attributionIdsForClosestParent =
      getAttributionIdsOfSelectedResourceClosestParent(getState());
    if (
      isEqual(
        sortBy(attributionsIdsForResource),
        sortBy(attributionIdsForClosestParent),
      )
    ) {
      attributionIdsForClosestParent.forEach((attributionId) => {
        dispatch(unlinkResourceFromAttribution(resourceId, attributionId));
      });
    }
  };
}

function createAttributionForSelectedResource(
  packageInfo: PackageInfo,
  jumpToCreatedAttribution = true,
): CreateAttributionForSelectedResource {
  return {
    type: ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
    payload: { packageInfo, jumpToCreatedAttribution },
  };
}

function updateAttribution(
  attributionId: string,
  packageInfo: PackageInfo,
  jumpToUpdatedAttribution = true,
): UpdateAttribution {
  return {
    type: ACTION_UPDATE_ATTRIBUTION,
    payload: {
      attributionId,
      packageInfo,
      jumpToUpdatedAttribution,
    },
  };
}

function deleteAttribution(attributionIdToDelete: string): DeleteAttribution {
  return {
    type: ACTION_DELETE_ATTRIBUTION,
    payload: attributionIdToDelete,
  };
}

function replaceAttributionWithMatchingAttribution(
  attributionIdToReplace: string,
  attributionIdToReplaceWith: string,
  jumpToMatchingAttribution = true,
): ReplaceAttributionWithMatchingAttributionAction {
  return {
    type: ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
    payload: {
      attributionIdToReplace,
      attributionIdToReplaceWith,
      jumpToMatchingAttribution,
    },
  };
}

function linkToAttribution(
  resourceId: string,
  attributionId: string,
): LinkToAttributionAction {
  return {
    type: ACTION_LINK_TO_ATTRIBUTION,
    payload: { resourceId, attributionId },
  };
}

function unlinkResourceFromAttribution(
  resourceId: string,
  attributionId: string,
): UnlinkResourceFromAttributionAction {
  return {
    type: ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
    payload: { resourceId, attributionId },
  };
}
