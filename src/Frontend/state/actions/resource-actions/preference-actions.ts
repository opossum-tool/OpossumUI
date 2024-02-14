// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { cloneDeep } from 'lodash';

import {
  Attributions,
  AttributionsToResources,
  ExternalAttributionSources,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { State } from '../../../types/types';
import { getSubtree } from '../../../util/get-attributions-with-resources';
import { CalculatePreferredOverOriginIds } from '../../helpers/save-action-helpers';
import { ResourceState } from '../../reducers/resource-reducer';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getResourceIdsOfSelectedAttribution,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
} from '../../selectors/resource-selectors';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { setTemporaryDisplayPackageInfo } from './all-views-simple-actions';

export function toggleIsSelectedPackagePreferred(
  packageInfo: PackageInfo,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const state = getState();

    const newTemporaryDisplayPackageInfo = cloneDeep(packageInfo);
    newTemporaryDisplayPackageInfo.preferred =
      !newTemporaryDisplayPackageInfo.preferred;

    if (newTemporaryDisplayPackageInfo.preferred) {
      newTemporaryDisplayPackageInfo.preferredOverOriginIds =
        getOriginIdsToPreferOver(
          getResourceIdsOfSelectedAttribution(state),
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

export function setOriginIdsToPreferOverGlobally(
  packageInfo: PackageInfo,
): AppThunkAction {
  return (dispatch, getState): void => {
    const state = getState();

    dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        preferredOverOriginIds: getOriginIdsToPreferOver(
          getResourceIdsOfSelectedAttribution(state),
          getResources(state) ?? {},
          getResourcesToExternalAttributions(state),
          getResourcesToManualAttributions(state),
          getExternalAttributions(state),
          getExternalAttributionSources(state),
        ),
      }),
    );
  };
}

export function getOriginIdsToPreferOver(
  pathsToRootResources: string | Array<string>,
  resources: Resources,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
  externalAttributionSources: ExternalAttributionSources,
): Array<string> {
  let originIds: Array<string> = [];

  if (typeof pathsToRootResources === 'string') {
    pathsToRootResources = [pathsToRootResources];
  }

  for (const pathToRootResource of pathsToRootResources) {
    const rootResource = getSubtree(resources, pathToRootResource);

    const subtreeResourcesIds = getResourceIdsInSubtreeWithBreakpoints(
      pathToRootResource,
      rootResource,
      resourcesToManualAttributions,
    );

    const packageInfos = getPackageInfosFromResources(
      subtreeResourcesIds,
      resourcesToExternalAttributions,
      externalAttributions,
    );

    const originIdsForResource = getOriginIdsToPreferOverFromPackageInfos(
      packageInfos,
      externalAttributionSources,
    );

    originIds = originIds.concat(originIdsForResource);
  }

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
  resourcesToManualAttributions: ResourcesToAttributions,
): Array<string> {
  const resources: Array<string> = [pathToRootResource];

  for (const childResourceName of Object.keys(rootResource)) {
    const pathToChildResource = pathToRootResource + childResourceName;
    if (pathToChildResource in resourcesToManualAttributions) {
      continue;
    }
    if (rootResource[childResourceName] === 1) {
      resources.push(pathToChildResource);
    } else {
      const results = getResourceIdsInSubtreeWithBreakpoints(
        `${pathToChildResource}/`,
        rootResource[childResourceName] as Resources,
        resourcesToManualAttributions,
      );
      for (const result of results) {
        resources.push(result);
      }
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

export function getCalculatePreferredOverOriginIds(
  state: ResourceState,
): CalculatePreferredOverOriginIds {
  return (
    pathToResource: string,
    newManualAttributionToResources: AttributionsToResources,
  ) =>
    getOriginIdsToPreferOver(
      pathToResource,
      state.resources ?? {},
      state.externalData.resourcesToAttributions,
      newManualAttributionToResources,
      state.externalData.attributions,
      state.externalAttributionSources,
    );
}
