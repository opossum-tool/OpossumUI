// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty, isEqual } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import { backend } from '../../../util/backendClient';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import {
  getManualAttributions,
  getManualAttributionsToResources,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../selectors/resource-selectors';
import { AppThunkAction, AsyncAppThunkAction } from '../../types';
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
): AsyncAppThunkAction {
  return async (dispatch, getState) => {
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
      await backend.deleteAttributions.mutate({
        attributionUuids: [attributionId],
      });
    } else if (matchedPackageInfo && attributionId) {
      // REPLACE
      dispatch(
        replaceAttributionWithMatchingAttribution(
          attributionId,
          matchedPackageInfo.id,
          !isSavedPackageInactive,
        ),
      );
      await backend.replaceAttribution.mutate({
        attributionIdToReplace: attributionId,
        attributionIdToReplaceWith: matchedPackageInfo.id,
      });
    } else if (matchedPackageInfo && resourceId) {
      // LINK
      dispatch(
        linkToAttribution(
          resourceId,
          matchedPackageInfo.id,
          !isSavedPackageInactive,
        ),
      );
      await backend.linkAttribution.mutate({
        resourcePath: resourceId,
        attributionUuid: matchedPackageInfo.id,
      });
    } else if (resourceId && !attributionId) {
      // CREATE
      const newAttributionId = uuid4();
      dispatch(
        createAttributionForSelectedResource(newAttributionId, packageInfo),
      );
      const newAttribution =
        getManualAttributions(getState())[newAttributionId];

      await backend.createAttribution.mutate({
        attributionUuid: newAttributionId,
        packageInfo: newAttribution,
        resourcePath: resourceId,
      });
    } else if (attributionId) {
      // UPDATE
      dispatch(
        updateAttribution(attributionId, packageInfo, !isSavedPackageInactive),
      );
      const updatedAttribution =
        getManualAttributions(getState())[attributionId];
      await backend.updateAttributions.mutate({
        attributions: { [attributionId]: updatedAttribution },
      });
    }

    if (!isSavedPackageInactive) {
      dispatch(resetTemporaryDisplayPackageInfo());
    }

    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function saveManualAndResolvedAttributionsToFile(): AppThunkAction {
  return (_) => {
    window.electronAPI.saveFile();
  };
}

export function unlinkAttributionAndSave(
  resourceId: string,
  attributionIds: Array<string>,
): AsyncAppThunkAction {
  return async (dispatch) => {
    attributionIds.forEach((attributionId) => {
      dispatch(unlinkResourceFromAttribution(resourceId, attributionId));
    });
    await backend.unlinkResourceFromAttributions.mutate({
      resourcePath: resourceId,
      attributionUuids: attributionIds,
    });
    dispatch(setSelectedAttributionId(''));
    dispatch(resetTemporaryDisplayPackageInfo());
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function unlinkAttributionAndCreateNew(
  resourceId: string,
  packageInfo: PackageInfo,
): AsyncAppThunkAction {
  return async (dispatch, getState) => {
    const attributionsToResources =
      getManualAttributionsToResources(getState());

    if (attributionsToResources[packageInfo.id]?.length > 1) {
      await backend.unlinkResourceFromAttributions.mutate({
        resourcePath: resourceId,
        attributionUuids: [packageInfo.id],
      });
      dispatch(unlinkResourceFromAttribution(resourceId, packageInfo.id));
      await dispatch(savePackageInfo(resourceId, null, packageInfo));
    }
  };
}

export function addToSelectedResource(
  packageInfo: PackageInfo,
): AsyncAppThunkAction {
  return async (dispatch, getState) => {
    await dispatch(
      savePackageInfo(
        getSelectedResourceId(getState()),
        null,
        packageInfo,
        packageInfo.id !== getSelectedAttributionId(getState()),
        true,
      ),
    );
  };
}

export function deleteAttributionsAndSave(
  attributionIds: Array<string>,
  selectedAttributionId: string,
): AsyncAppThunkAction {
  return async (dispatch) => {
    attributionIds.forEach((attributionId) => {
      dispatch(deleteAttribution(attributionId));
    });
    await backend.deleteAttributions.mutate({
      attributionUuids: attributionIds,
    });
    if (attributionIds.includes(selectedAttributionId)) {
      dispatch(setSelectedAttributionId(''));
      dispatch(resetTemporaryDisplayPackageInfo());
    }
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function addResolvedExternalAttributionAndSave(
  attributionIds: Array<string>,
): AsyncAppThunkAction {
  return async (dispatch) => {
    dispatch(addResolvedExternalAttributions(attributionIds));
    await backend.resolveAttributions.mutate({
      attributionUuids: attributionIds,
    });
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function removeResolvedExternalAttributionAndSave(
  attributionIds: Array<string>,
): AsyncAppThunkAction {
  return async (dispatch) => {
    dispatch(removeResolvedExternalAttributions(attributionIds));
    await backend.unresolveAttributions.mutate({
      attributionUuids: attributionIds,
    });
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function updateAttributionsAndSave(
  updatedAttributions: Attributions,
): AsyncAppThunkAction {
  return async (dispatch, getState) => {
    const selectedAttributionId = getSelectedAttributionId(getState());

    Object.entries(updatedAttributions).forEach(
      ([attributionId, updatedPackageInfo]) => {
        dispatch(updateAttribution(attributionId, updatedPackageInfo, false));
      },
    );
    await backend.updateAttributions.mutate({
      attributions: updatedAttributions,
    });
    // Reset temporary display package info if the currently selected attribution was updated
    if (Object.keys(updatedAttributions).includes(selectedAttributionId)) {
      dispatch(resetTemporaryDisplayPackageInfo());
    }

    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

function createAttributionForSelectedResource(
  attributionId: string,
  packageInfo: PackageInfo,
): CreateAttributionForSelectedResource {
  return {
    type: ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
    payload: { attributionId, packageInfo },
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
