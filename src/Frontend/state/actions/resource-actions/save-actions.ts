// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty, isEqual } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { type PackageInfo } from '../../../../shared/shared-types';
import { backend } from '../../../util/backendClient';
import { getStrippedPackageInfo } from '../../../util/get-stripped-package-info';
import {
  getManualAttributions,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../selectors/resource-selectors';
import { type AppThunkAction, type AsyncAppThunkAction } from '../../types';
import {
  ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
  ACTION_DELETE_ATTRIBUTION,
  ACTION_LINK_TO_ATTRIBUTION,
  ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  type CreateAttributionForSelectedResource,
  type DeleteAttribution,
  type LinkToAttributionAction,
  type ReplaceAttributionWithMatchingAttributionAction,
  type UnlinkResourceFromAttributionAction,
  type UpdateAttribution,
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
    const attributionBreakpoints =
      await backend.getAttributionBreakpoints.query();

    if (attributionId && isEmpty(strippedPackageInfo)) {
      // DELETE
      dispatch(deleteAttribution(attributionId, attributionBreakpoints));
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
          attributionBreakpoints,
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
          attributionBreakpoints,
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

    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function saveManualAndResolvedAttributionsToFile(): AppThunkAction {
  return (_) => {
    window.electronAPI.saveFile();
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

function deleteAttribution(
  attributionIdToDelete: string,
  attributionBreakpoints: Set<string>,
): DeleteAttribution {
  return {
    type: ACTION_DELETE_ATTRIBUTION,
    payload: { attributionId: attributionIdToDelete, attributionBreakpoints },
  };
}

function replaceAttributionWithMatchingAttribution(
  attributionIdToReplace: string,
  attributionIdToReplaceWith: string,
  jumpToMatchingAttribution = true,
  attributionBreakpoints: Set<string>,
): ReplaceAttributionWithMatchingAttributionAction {
  return {
    type: ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
    payload: {
      attributionIdToReplace,
      attributionIdToReplaceWith,
      jumpToMatchingAttribution,
      attributionBreakpoints,
    },
  };
}

function linkToAttribution(
  resourceId: string,
  attributionId: string,
  jumpToMatchingAttribution = true,
  attributionBreakpoints: Set<string>,
): LinkToAttributionAction {
  return {
    type: ACTION_LINK_TO_ATTRIBUTION,
    payload: {
      resourceId,
      attributionId,
      jumpToMatchingAttribution,
      attributionBreakpoints,
    },
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
