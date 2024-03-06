// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty, isEqual } from 'lodash';

import { PackageInfo } from '../../../../shared/shared-types';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import {
  getManualAttributions,
  getManualAttributionsToResources,
  getResolvedExternalAttributions,
  getResourcesToManualAttributions,
  getSelectedResourceId,
} from '../../selectors/resource-selectors';
import { AppThunkAction } from '../../types';
import {
  addResolvedExternalAttributions,
  removeResolvedExternalAttributions,
  setSelectedAttributionId,
} from './audit-view-simple-actions';
import { resetTemporaryDisplayPackageInfo } from './navigation-actions';
import {
  ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
  ACTION_DELETE_ATTRIBUTION,
  ACTION_LINK_TO_ATTRIBUTION,
  ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  CreateAttributionForSelectedResource,
  DeleteAttribution,
  LinkToAttributionAction,
  ReplaceAttributionWithMatchingAttributionAction,
  UnlinkResourceFromAttributionAction,
  UpdateAttribution,
} from './types';

export function savePackageInfo(
  resourceId: string | null,
  attributionId: string | null,
  packageInfo: PackageInfo,
  isSavedPackageInactive?: boolean,
  ignorePreSelected?: boolean,
): AppThunkAction {
  return (dispatch, getState) => {
    const strippedPackageInfo = getStrippedPackageInfo(packageInfo);
    const matchedPackageInfo = Object.values(
      getManualAttributions(getState()),
    ).find(
      (attribution) =>
        (ignorePreSelected || !attribution.preSelected) &&
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
      dispatch(
        linkToAttribution(
          resourceId,
          matchedPackageInfo.id,
          !isSavedPackageInactive,
        ),
      );
    } else if (resourceId && !attributionId) {
      // CREATE
      dispatch(createAttributionForSelectedResource(packageInfo));
    } else if (attributionId) {
      // UPDATE
      dispatch(
        updateAttribution(attributionId, packageInfo, !isSavedPackageInactive),
      );
    }

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

export function unlinkAttributionAndSave(
  resourceId: string,
  attributionIds: Array<string>,
): AppThunkAction {
  return (dispatch) => {
    attributionIds.forEach((attributionId) => {
      dispatch(unlinkResourceFromAttribution(resourceId, attributionId));
    });
    dispatch(setSelectedAttributionId(''));
    dispatch(resetTemporaryDisplayPackageInfo());
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function unlinkAttributionAndCreateNew(
  resourceId: string,
  packageInfo: PackageInfo,
): AppThunkAction {
  return (dispatch, getState) => {
    const attributionsToResources =
      getManualAttributionsToResources(getState());

    if (attributionsToResources[packageInfo.id]?.length > 1) {
      dispatch(unlinkResourceFromAttribution(resourceId, packageInfo.id));
      dispatch(savePackageInfo(resourceId, null, packageInfo));
    }
  };
}

export function addToSelectedResource(
  packageInfo: PackageInfo,
  selectedAttributionId?: string,
): AppThunkAction {
  return (dispatch, getState) => {
    dispatch(
      savePackageInfo(
        getSelectedResourceId(getState()),
        null,
        packageInfo,
        selectedAttributionId ? packageInfo.id !== selectedAttributionId : true,
        true,
      ),
    );
  };
}

export function deleteAttributionAndSave(
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

export function addResolvedExternalAttributionAndSave(
  attributionIds: Array<string>,
): AppThunkAction {
  return (dispatch) => {
    dispatch(addResolvedExternalAttributions(attributionIds));
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function removeResolvedExternalAttributionAndSave(
  attributionIds: Array<string>,
): AppThunkAction {
  return (dispatch) => {
    dispatch(removeResolvedExternalAttributions(attributionIds));
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

function createAttributionForSelectedResource(
  packageInfo: PackageInfo,
): CreateAttributionForSelectedResource {
  return {
    type: ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
    payload: packageInfo,
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
  jumpToMatchingAttribution = true,
): LinkToAttributionAction {
  return {
    type: ACTION_LINK_TO_ATTRIBUTION,
    payload: { resourceId, attributionId, jumpToMatchingAttribution },
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
