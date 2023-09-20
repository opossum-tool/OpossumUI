// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { cloneDeep } from 'lodash';
import {
  Resources,
  ResourcesToAttributions,
  Attributions,
  ExternalAttributionSources,
  PackageInfo,
  DisplayPackageInfo,
} from '../../../../shared/shared-types';
import { PathPredicate, State } from '../../../types/types';
import { getSubtree } from '../../../util/get-attributions-with-resources';
import {
  getResources,
  getExternalAttributions,
  getExternalAttributionSources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
} from '../../selectors/all-views-resource-selectors';
import { getSelectedResourceId } from '../../selectors/audit-view-resource-selectors';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { setTemporaryDisplayPackageInfo } from './all-views-simple-actions';

export function toggleIsSelectedPackagePreferred(
  packageInfo: DisplayPackageInfo,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const state = getState();

    const newTemporaryDisplayPackageInfo = cloneDeep(packageInfo);
    newTemporaryDisplayPackageInfo.preferred =
      !newTemporaryDisplayPackageInfo.preferred;

    if (newTemporaryDisplayPackageInfo.preferred) {
      newTemporaryDisplayPackageInfo.preferredOverOriginIds =
        _getOriginIdsToPreferOver(
          getSelectedResourceId(state),
          getResources(state) ?? {},
          getResourcesToExternalAttributions(state),
          getResourcesToManualAttributions(state),
          getExternalAttributions(state),
          getExternalAttributionSources(state),
        );
    } else {
      newTemporaryDisplayPackageInfo.preferredOverOriginIds = undefined;
    }

    dispatch(setTemporaryDisplayPackageInfo(newTemporaryDisplayPackageInfo));
  };
}

export function _getOriginIdsToPreferOver(
  pathToRootResource: string,
  resources: Resources,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
  externalAttributionSources: ExternalAttributionSources,
): Array<string> {
  const rootResource = getSubtree(resources, pathToRootResource);

  const isBreakpoint: PathPredicate = (path: string) =>
    path in resourcesToManualAttributions;

  const subtreeResourcesIds = getResourceIdsInSubtreeWithBreakpoints(
    pathToRootResource,
    rootResource,
    isBreakpoint,
  );

  const packageInfos = getPackageInfosFromResources(
    subtreeResourcesIds,
    resourcesToExternalAttributions,
    externalAttributions,
  );

  const originIds = getOriginIdsToPreferOverFromPackageInfos(
    packageInfos,
    externalAttributionSources,
  );

  return originIds;
}

function getPackageInfosFromResources(
  resourceIds: Array<string>,
  resourcesToAttributions: ResourcesToAttributions,
  attributions: Attributions,
): Array<PackageInfo> {
  const attributionIds = resourceIds.flatMap(
    (resourceId) => resourcesToAttributions[resourceId] ?? [],
  );
  const deduplicatedAttributionIds = Array.from(new Set(attributionIds));
  const packageInfos = deduplicatedAttributionIds.flatMap(
    (attributionId) => attributions[attributionId],
  );
  return packageInfos;
}

function getResourceIdsInSubtreeWithBreakpoints(
  pathToRootResource: string,
  rootResource: Resources,
  isBreakpoint: PathPredicate,
): Array<string> {
  const resources: Array<string> = [pathToRootResource];

  for (const [childResourceName, childResource] of Object.entries(
    rootResource,
  )) {
    const pathToChildResource = pathToRootResource + childResourceName;
    if (isBreakpoint(pathToChildResource)) {
      continue;
    }
    if (childResource === 1) {
      resources.push(pathToChildResource);
    } else {
      resources.push(
        ...getResourceIdsInSubtreeWithBreakpoints(
          pathToChildResource + '/',
          childResource,
          isBreakpoint,
        ),
      );
    }
  }

  return resources;
}

function getOriginIdsToPreferOverFromPackageInfos(
  packageInfos: Array<PackageInfo>,
  externalAttributionSources: ExternalAttributionSources,
): Array<string> {
  const originIds: Array<string> = [];

  packageInfos.forEach((packageInfo) => {
    const isRelevantForPreferred =
      externalAttributionSources[packageInfo.source?.name ?? '']
        ?.isRelevantForPreferred;
    if (isRelevantForPreferred && packageInfo.originIds) {
      originIds.push(...packageInfo.originIds);
    }
  });

  return Array.from(new Set(originIds));
}
