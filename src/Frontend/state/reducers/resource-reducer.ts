// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  BaseUrlsForSources,
  ExternalAttributionSources,
  FrequentLicenses,
  PackageInfo,
  ProjectMetadata,
  Resources,
} from '../../../shared/shared-types';
import {
  EMPTY_ATTRIBUTION_DATA,
  EMPTY_DISPLAY_PACKAGE_INFO,
  EMPTY_FREQUENT_LICENSES,
  EMPTY_PROJECT_METADATA,
  ROOT_PATH,
} from '../../shared-constants';
import { getCalculatePreferredOverOriginIds } from '../actions/resource-actions/preference-actions';
import {
  ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
  ACTION_DELETE_ATTRIBUTION,
  ACTION_LINK_TO_ATTRIBUTION,
  ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_ATTRIBUTION_BREAKPOINTS,
  ACTION_SET_BASE_URLS_FOR_SOURCES,
  ACTION_SET_ENABLE_PREFERENCE_FEATURE,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
  ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES,
  ACTION_SET_FILES_WITH_CHILDREN,
  ACTION_SET_FREQUENT_LICENSES,
  ACTION_SET_MANUAL_ATTRIBUTION_DATA,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_SET_RESOURCES,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  ResourceAction,
} from '../actions/resource-actions/types';
import { getResourceIdsFromResources } from '../helpers/resources-helpers';
import {
  computeChildrenWithAttributions,
  createManualAttribution,
  deleteManualAttribution,
  linkToAttributionManualData,
  replaceAttributionWithMatchingAttributionId,
  unlinkResourceFromAttributionId,
  updateManualAttribution,
} from '../helpers/save-action-helpers';

export const initialResourceState: ResourceState = {
  attributionBreakpoints: new Set(),
  baseUrlsForSources: {},
  expandedIds: [ROOT_PATH],
  externalAttributionSources: {},
  externalData: EMPTY_ATTRIBUTION_DATA,
  filesWithChildren: new Set(),
  frequentLicenses: EMPTY_FREQUENT_LICENSES,
  isPreferenceFeatureEnabled: false,
  manualData: EMPTY_ATTRIBUTION_DATA,
  metadata: EMPTY_PROJECT_METADATA,
  resolvedExternalAttributions: new Set(),
  resources: null,
  resourceIds: null,
  selectedAttributionId: '',
  selectedResourceId: ROOT_PATH,
  targetSelectedAttributionId: null,
  targetSelectedResourceId: null,
  temporaryDisplayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
};

export type ResourceState = {
  attributionBreakpoints: Set<string>;
  baseUrlsForSources: BaseUrlsForSources;
  expandedIds: Array<string>;
  externalAttributionSources: ExternalAttributionSources;
  externalData: AttributionData;
  filesWithChildren: Set<string>;
  frequentLicenses: FrequentLicenses;
  isPreferenceFeatureEnabled: boolean;
  manualData: AttributionData;
  metadata: ProjectMetadata;
  resolvedExternalAttributions: Set<string>;
  resources: Resources | null;
  resourceIds: Array<string> | null;
  selectedAttributionId: string;
  selectedResourceId: string;
  targetSelectedAttributionId: string | null;
  targetSelectedResourceId: string | null;
  temporaryDisplayPackageInfo: PackageInfo;
};

export const resourceState = (
  state: ResourceState = initialResourceState,
  action: ResourceAction,
): ResourceState => {
  switch (action.type) {
    case ACTION_RESET_RESOURCE_STATE:
      return initialResourceState;
    case ACTION_SET_RESOURCES:
      return {
        ...state,
        resources: action.payload,
        resourceIds: action.payload
          ? getResourceIdsFromResources(action.payload)
          : null,
      };
    case ACTION_SET_MANUAL_ATTRIBUTION_DATA:
      return {
        ...state,
        manualData: action.payload,
      };
    case ACTION_SET_EXTERNAL_ATTRIBUTION_DATA:
      return {
        ...state,
        externalData: action.payload,
      };
    case ACTION_SET_FREQUENT_LICENSES:
      return {
        ...state,
        frequentLicenses: action.payload,
      };
    case ACTION_SET_BASE_URLS_FOR_SOURCES:
      return {
        ...state,
        baseUrlsForSources: action.payload,
      };
    case ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES:
      return {
        ...state,
        externalAttributionSources: action.payload,
      };
    case ACTION_SET_TEMPORARY_PACKAGE_INFO:
      return {
        ...state,
        temporaryDisplayPackageInfo: action.payload,
      };
    case ACTION_SET_SELECTED_RESOURCE_ID:
      return {
        ...state,
        selectedResourceId: action.payload,
      };
    case ACTION_SET_TARGET_SELECTED_RESOURCE_ID:
      return {
        ...state,
        targetSelectedResourceId: action.payload,
      };
    case ACTION_SET_EXPANDED_IDS:
      return {
        ...state,
        expandedIds: action.payload,
      };
    case ACTION_SET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        selectedAttributionId: action.payload,
      };
    case ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        targetSelectedAttributionId: action.payload,
      };
    case ACTION_SET_ATTRIBUTION_BREAKPOINTS:
      return {
        ...state,
        attributionBreakpoints: action.payload,
      };
    case ACTION_SET_FILES_WITH_CHILDREN:
      return {
        ...state,
        filesWithChildren: action.payload,
      };
    case ACTION_SET_PROJECT_METADATA:
      return {
        ...state,
        metadata: action.payload,
      };
    case ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE: {
      const selectedResourceId = state.selectedResourceId;
      const { newManualData, newAttributionId } = createManualAttribution(
        state.manualData,
        selectedResourceId,
        action.payload,
        getCalculatePreferredOverOriginIds(state),
        state.externalData,
      );

      return {
        ...state,
        selectedAttributionId: newAttributionId,
        manualData: newManualData,
      };
    }
    case ACTION_UPDATE_ATTRIBUTION: {
      const manualData = updateManualAttribution(
        action.payload.attributionId,
        state.manualData,
        action.payload.packageInfo,
        state.externalData,
      );

      return {
        ...state,
        manualData,
        ...(action.payload.jumpToUpdatedAttribution && {
          temporaryDisplayPackageInfo:
            manualData.attributions[action.payload.packageInfo.id],
        }),
      };
    }
    case ACTION_DELETE_ATTRIBUTION: {
      const manualData = deleteManualAttribution(
        state.manualData,
        action.payload,
        state.attributionBreakpoints,
        state.resolvedExternalAttributions,
        getCalculatePreferredOverOriginIds(state),
      );

      return {
        ...state,
        manualData,
        selectedAttributionId:
          state.selectedAttributionId === action.payload
            ? ''
            : state.selectedAttributionId,
      };
    }
    case ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING: {
      const manualData = replaceAttributionWithMatchingAttributionId(
        state.manualData,
        action.payload.attributionIdToReplaceWith,
        action.payload.attributionIdToReplace,
        state.attributionBreakpoints,
      );

      return {
        ...state,
        manualData,
        ...(action.payload.jumpToMatchingAttribution && {
          selectedAttributionId: action.payload.attributionIdToReplaceWith,
          temporaryDisplayPackageInfo:
            manualData.attributions[action.payload.attributionIdToReplaceWith],
        }),
      };
    }
    case ACTION_LINK_TO_ATTRIBUTION: {
      const manualData = linkToAttributionManualData(
        state.manualData,
        action.payload.resourceId,
        action.payload.attributionId,
        state.attributionBreakpoints,
        getCalculatePreferredOverOriginIds(state),
      );

      return {
        ...state,
        manualData,
        ...(action.payload.jumpToMatchingAttribution && {
          selectedAttributionId: action.payload.attributionId,
          temporaryDisplayPackageInfo:
            manualData.attributions[action.payload.attributionId],
        }),
      };
    }
    case ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION: {
      const manualData = unlinkResourceFromAttributionId(
        state.manualData,
        action.payload.resourceId,
        action.payload.attributionId,
        state.resolvedExternalAttributions,
        getCalculatePreferredOverOriginIds(state),
      );

      return {
        ...state,
        manualData,
      };
    }
    case ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS:
      return {
        ...state,
        resolvedExternalAttributions: action.payload,
      };
    case ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTIONS: {
      const resolvedExternalAttributions = new Set(
        state.resolvedExternalAttributions,
      );
      action.payload.forEach((attributionId) => {
        resolvedExternalAttributions.add(attributionId);
      });

      return {
        ...state,
        resolvedExternalAttributions,
        externalData: {
          ...state.externalData,
          resourcesWithAttributedChildren: computeChildrenWithAttributions(
            state.externalData.attributionsToResources,
            resolvedExternalAttributions,
          ),
        },
      };
    }
    case ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTIONS: {
      const resolvedExternalAttributions = new Set(
        state.resolvedExternalAttributions,
      );
      action.payload.forEach((attributionId) => {
        resolvedExternalAttributions.delete(attributionId);
      });

      return {
        ...state,
        resolvedExternalAttributions,
        externalData: {
          ...state.externalData,
          resourcesWithAttributedChildren: computeChildrenWithAttributions(
            state.externalData.attributionsToResources,
            resolvedExternalAttributions,
          ),
        },
      };
    }
    case ACTION_SET_ENABLE_PREFERENCE_FEATURE:
      return {
        ...state,
        isPreferenceFeatureEnabled: action.payload,
      };
    default:
      return state;
  }
};
