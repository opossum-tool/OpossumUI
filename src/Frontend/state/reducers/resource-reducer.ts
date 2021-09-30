// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  BaseUrlsForSources,
  ExternalAttributionSources,
  FrequentLicences,
  PackageInfo,
  ProjectMetadata,
  Resources,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { PanelPackage, ProgressBarData } from '../../types/types';
import { getUpdatedProgressBarData } from '../helpers/progress-bar-data-helpers';
import {
  EMPTY_ATTRIBUTION_DATA,
  EMPTY_FREQUENT_LICENSES,
  EMPTY_PROJECT_METADATA,
} from '../../shared-constants';
import {
  ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION,
  ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE,
  ACTION_DELETE_ATTRIBUTION,
  ACTION_LINK_TO_ATTRIBUTION,
  ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION,
  ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING,
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_ATTRIBUTION_BREAKPOINTS,
  ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT,
  ACTION_SET_BASE_URLS_FOR_SOURCES,
  ACTION_SET_DISPLAYED_PANEL_PACKAGE,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
  ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES,
  ACTION_SET_FILE_SEARCH,
  ACTION_SET_FILES_WITH_CHILDREN,
  ACTION_SET_FREQUENT_LICENSES,
  ACTION_SET_IS_SAVING_DISABLED,
  ACTION_SET_MANUAL_ATTRIBUTION_DATA,
  ACTION_SET_PROGRESS_BAR_DATA,
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
import {
  createManualAttribution,
  deleteManualAttribution,
  linkToAttributionManualData,
  replaceAttributionWithMatchingAttributionId,
  unlinkResourceFromAttributionId,
  updateManualAttribution,
} from '../helpers/save-action-helpers';
import {
  getMatchingAttributionId,
  removeResolvedAttributionsFromResourcesWithAttributedChildren,
  addUnresolvedAttributionsToResourcesWithAttributedChildren,
} from '../helpers/action-and-reducer-helpers';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { getAttributionBreakpointCheckForResourceState } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheckForResourceState } from '../../util/is-file-with-children';

export const initialResourceState: ResourceState = {
  allViews: {
    resources: null,
    manualData: EMPTY_ATTRIBUTION_DATA,
    externalData: EMPTY_ATTRIBUTION_DATA,
    frequentLicences: EMPTY_FREQUENT_LICENSES,
    progressBarData: null,
    temporaryPackageInfo: {},
    attributionBreakpoints: new Set(),
    filesWithChildren: new Set(),
    isSavingDisabled: false,
    metadata: EMPTY_PROJECT_METADATA,
    baseUrlsForSources: {},
    externalAttributionSources: {},
  },
  auditView: {
    selectedResourceId: '',
    targetSelectedResourceId: '',
    expandedIds: ['/'],
    displayedPanelPackage: null,
    resolvedExternalAttributions: new Set(),
  },
  attributionView: {
    selectedAttributionId: '',
    targetSelectedAttributionId: '',
    attributionIdMarkedForReplacement: '',
  },
  fileSearchPopup: {
    fileSearch: '',
  },
};

export type ResourceState = {
  allViews: {
    resources: Resources | null;
    manualData: AttributionData;
    externalData: AttributionData;
    frequentLicences: FrequentLicences;
    progressBarData: ProgressBarData | null;
    temporaryPackageInfo: PackageInfo;
    attributionBreakpoints: Set<string>;
    filesWithChildren: Set<string>;
    isSavingDisabled: boolean;
    metadata: ProjectMetadata;
    baseUrlsForSources: BaseUrlsForSources;
    externalAttributionSources: ExternalAttributionSources;
  };
  auditView: {
    selectedResourceId: string;
    targetSelectedResourceId: string;
    expandedIds: Array<string>;
    displayedPanelPackage: PanelPackage | null;
    resolvedExternalAttributions: Set<string>;
  };
  attributionView: {
    selectedAttributionId: string;
    targetSelectedAttributionId: string;
    attributionIdMarkedForReplacement: string;
  };
  fileSearchPopup: {
    fileSearch: string;
  };
};

export const resourceState = (
  state: ResourceState = initialResourceState,
  action: ResourceAction
): ResourceState => {
  switch (action.type) {
    case ACTION_RESET_RESOURCE_STATE:
      return initialResourceState;
    case ACTION_SET_RESOURCES:
      return {
        ...state,
        allViews: { ...state.allViews, resources: action.payload },
      };
    case ACTION_SET_MANUAL_ATTRIBUTION_DATA:
      return {
        ...state,
        allViews: { ...state.allViews, manualData: action.payload },
      };
    case ACTION_SET_EXTERNAL_ATTRIBUTION_DATA:
      return {
        ...state,
        allViews: { ...state.allViews, externalData: action.payload },
      };
    case ACTION_SET_FREQUENT_LICENSES:
      return {
        ...state,
        allViews: { ...state.allViews, frequentLicences: action.payload },
      };
    case ACTION_SET_BASE_URLS_FOR_SOURCES:
      return {
        ...state,
        allViews: { ...state.allViews, baseUrlsForSources: action.payload },
      };
    case ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES:
      return {
        ...state,
        allViews: {
          ...state.allViews,
          externalAttributionSources: action.payload,
        },
      };
    case ACTION_SET_TEMPORARY_PACKAGE_INFO:
      return {
        ...state,
        allViews: {
          ...state.allViews,
          temporaryPackageInfo: { ...action.payload },
        },
      };
    case ACTION_SET_PROGRESS_BAR_DATA:
      return {
        ...state,
        allViews: {
          ...state.allViews,
          progressBarData: getUpdatedProgressBarData(
            action.payload.resources,
            action.payload.manualAttributions,
            action.payload.resourcesToManualAttributions,
            action.payload.resourcesToExternalAttributions,
            action.payload.resolvedExternalAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
        },
      };
    case ACTION_SET_SELECTED_RESOURCE_ID:
      const linkedAttributionIds: Array<string> | undefined =
        state.allViews.manualData.resourcesToAttributions[action.payload];

      let displayedAttributionId = '';
      if (linkedAttributionIds) {
        displayedAttributionId = linkedAttributionIds.sort(
          getAlphabeticalComparer(state.allViews.manualData.attributions)
        )[0];
      } else {
        const closestParentAttributionIds: Array<string> =
          getClosestParentAttributionIds(
            action.payload,
            state.allViews.manualData.resourcesToAttributions,
            getAttributionBreakpointCheckForResourceState(state)
          );
        if (closestParentAttributionIds.length > 0) {
          displayedAttributionId = closestParentAttributionIds.sort(
            getAlphabeticalComparer(state.allViews.manualData.attributions)
          )[0];
        }
      }

      return {
        ...state,
        auditView: {
          ...state.auditView,
          selectedResourceId: action.payload,
          displayedPanelPackage: {
            panel: PackagePanelTitle.ManualPackages,
            attributionId: displayedAttributionId,
          },
        },
        allViews: {
          ...state.allViews,
          temporaryPackageInfo:
            state.allViews.manualData.attributions[displayedAttributionId] ||
            {},
        },
      };
    case ACTION_SET_TARGET_SELECTED_RESOURCE_ID:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          targetSelectedResourceId: action.payload,
        },
      };
    case ACTION_SET_EXPANDED_IDS:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          expandedIds: action.payload,
        },
      };
    case ACTION_SET_DISPLAYED_PANEL_PACKAGE:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          displayedPanelPackage: action.payload && {
            ...action.payload,
          },
        },
      };
    case ACTION_SET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        attributionView: {
          ...state.attributionView,
          selectedAttributionId: action.payload,
        },
      };
    case ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        attributionView: {
          ...state.attributionView,
          targetSelectedAttributionId: action.payload,
        },
      };
    case ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT:
      return {
        ...state,
        attributionView: {
          ...state.attributionView,
          attributionIdMarkedForReplacement: action.payload,
        },
      };
    case ACTION_SET_IS_SAVING_DISABLED:
      return {
        ...state,
        allViews: { ...state.allViews, isSavingDisabled: action.payload },
      };
    case ACTION_SET_ATTRIBUTION_BREAKPOINTS:
      return {
        ...state,
        allViews: { ...state.allViews, attributionBreakpoints: action.payload },
      };
    case ACTION_SET_FILES_WITH_CHILDREN:
      return {
        ...state,
        allViews: {
          ...state.allViews,
          filesWithChildren: action.payload,
        },
      };
    case ACTION_SET_PROJECT_METADATA:
      return {
        ...state,
        allViews: { ...state.allViews, metadata: action.payload },
      };
    case ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE:
      const { newManualData, newAttributionId } = createManualAttribution(
        state.allViews.manualData,
        state.auditView.selectedResourceId,
        action.payload
      );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: newManualData,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            newManualData.attributions,
            newManualData.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            state.auditView.resolvedExternalAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
        },
        auditView: {
          ...state.auditView,
          displayedPanelPackage: {
            panel: PackagePanelTitle.ManualPackages,
            attributionId: newAttributionId,
          },
        },
      };
    case ACTION_UPDATE_ATTRIBUTION:
      const updatedManualData = updateManualAttribution(
        action.payload.attributionId,
        state.allViews.manualData,
        action.payload.strippedPackageInfo
      );
      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: updatedManualData,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            updatedManualData.attributions,
            updatedManualData.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            state.auditView.resolvedExternalAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
          temporaryPackageInfo: action.payload.strippedPackageInfo,
        },
      };
    case ACTION_DELETE_ATTRIBUTION:
      const manualDataAfterDeletion: AttributionData = deleteManualAttribution(
        state.allViews.manualData,
        action.payload,
        getAttributionBreakpointCheckForResourceState(state)
      );

      const newDisplayedPanelPackage: PanelPackage | null =
        state.auditView.displayedPanelPackage?.panel ===
          PackagePanelTitle.ManualPackages &&
        state.auditView.displayedPanelPackage.attributionId === action.payload
          ? { ...state.auditView.displayedPanelPackage, attributionId: '' }
          : state.auditView.displayedPanelPackage;

      const newSelectedAttributionId: string =
        state.attributionView.selectedAttributionId === action.payload
          ? ''
          : state.attributionView.selectedAttributionId;

      const newAttributionIdMarkedForReplacement: string =
        state.attributionView.attributionIdMarkedForReplacement ===
        action.payload
          ? ''
          : state.attributionView.attributionIdMarkedForReplacement;

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataAfterDeletion,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            manualDataAfterDeletion.attributions,
            manualDataAfterDeletion.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            state.auditView.resolvedExternalAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
        },
        auditView: {
          ...state.auditView,
          displayedPanelPackage: newDisplayedPanelPackage,
        },
        attributionView: {
          ...state.attributionView,
          selectedAttributionId: newSelectedAttributionId,
          attributionIdMarkedForReplacement:
            newAttributionIdMarkedForReplacement,
        },
      };
    case ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING:
      const matchingAttributionIdForReplace = getMatchingAttributionId(
        action.payload.strippedPackageInfo,
        state.allViews.manualData.attributions
      );

      const manualDataForReplace: AttributionData =
        replaceAttributionWithMatchingAttributionId(
          state.allViews.manualData,
          matchingAttributionIdForReplace,
          action.payload.attributionId,
          getAttributionBreakpointCheckForResourceState(state)
        );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataForReplace,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            manualDataForReplace.attributions,
            manualDataForReplace.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            state.auditView.resolvedExternalAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
        },
        auditView: {
          ...state.auditView,
          displayedPanelPackage: {
            panel: PackagePanelTitle.ManualPackages,
            attributionId: matchingAttributionIdForReplace,
          },
        },
        attributionView: {
          ...state.attributionView,
          selectedAttributionId: matchingAttributionIdForReplace,
        },
      };
    case ACTION_LINK_TO_ATTRIBUTION:
      const matchingAttributionIdForLinking = getMatchingAttributionId(
        action.payload.strippedPackageInfo,
        state.allViews.manualData.attributions
      );

      const manualDataAfterForLinking: AttributionData =
        linkToAttributionManualData(
          state.allViews.manualData,
          action.payload.resourceId,
          matchingAttributionIdForLinking,
          getAttributionBreakpointCheckForResourceState(state)
        );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataAfterForLinking,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            manualDataAfterForLinking.attributions,
            manualDataAfterForLinking.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            state.auditView.resolvedExternalAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
        },
        auditView: {
          ...state.auditView,
          displayedPanelPackage: {
            panel: PackagePanelTitle.ManualPackages,
            attributionId: matchingAttributionIdForLinking,
          },
        },
      };
    case ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION:
      const manualDataAfterUnlinking: AttributionData =
        unlinkResourceFromAttributionId(
          state.allViews.manualData,
          action.payload.resourceId,
          action.payload.attributionId
        );

      const updatedProgressBarData = getUpdatedProgressBarData(
        state.allViews.resources as Resources,
        manualDataAfterUnlinking.attributions,
        manualDataAfterUnlinking.resourcesToAttributions,
        state.allViews.externalData.resourcesToAttributions,
        state.auditView.resolvedExternalAttributions,
        getAttributionBreakpointCheckForResourceState(state),
        getFileWithChildrenCheckForResourceState(state)
      );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataAfterUnlinking,
          progressBarData: updatedProgressBarData,
        },
      };
    case ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          resolvedExternalAttributions: action.payload,
        },
      };
    case ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION:
      const resolvedAttributionId = action.payload;

      const resolvedExternalAttributionsWithAddedAttribution: Set<string> =
        new Set(state.auditView.resolvedExternalAttributions);

      const resourcesWithAttributedChildren = {
        ...state.allViews.externalData.resourcesWithAttributedChildren,
      };
      resolvedExternalAttributionsWithAddedAttribution.add(
        resolvedAttributionId
      );

      const resourcesWithOnlyHiddenAttributions = (
        state.allViews.externalData.attributionsToResources[
          resolvedAttributionId
        ] ?? []
      ).filter((resourceId) => {
        const resourceAttributionIds =
          state.allViews.externalData.resourcesToAttributions[resourceId];
        if (resourceAttributionIds.length === 1) {
          return true;
        }
        return resourceAttributionIds.every((attributionId) =>
          resolvedExternalAttributionsWithAddedAttribution.has(attributionId)
        );
      });
      removeResolvedAttributionsFromResourcesWithAttributedChildren(
        resourcesWithAttributedChildren,
        resourcesWithOnlyHiddenAttributions
      );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            state.allViews.manualData.attributions,
            state.allViews.manualData.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            resolvedExternalAttributionsWithAddedAttribution,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
          externalData: {
            ...state.allViews.externalData,
            resourcesWithAttributedChildren: resourcesWithAttributedChildren,
          },
        },
        auditView: {
          ...state.auditView,
          resolvedExternalAttributions:
            resolvedExternalAttributionsWithAddedAttribution,
        },
      };
    case ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION:
      const resolvedExternalAttributionsWithRemovedAttributions: Set<string> =
        new Set(state.auditView.resolvedExternalAttributions);
      resolvedExternalAttributionsWithRemovedAttributions.delete(
        action.payload
      );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          progressBarData: getUpdatedProgressBarData(
            state.allViews.resources as Resources,
            state.allViews.manualData.attributions,
            state.allViews.manualData.resourcesToAttributions,
            state.allViews.externalData.resourcesToAttributions,
            resolvedExternalAttributionsWithRemovedAttributions,
            getAttributionBreakpointCheckForResourceState(state),
            getFileWithChildrenCheckForResourceState(state)
          ),
          externalData: {
            ...state.allViews.externalData,
            resourcesWithAttributedChildren:
              addUnresolvedAttributionsToResourcesWithAttributedChildren(
                {
                  ...state.allViews.externalData
                    .resourcesWithAttributedChildren,
                },
                state.allViews.externalData.attributionsToResources[
                  action.payload
                ]
              ),
          },
        },
        auditView: {
          ...state.auditView,
          resolvedExternalAttributions:
            resolvedExternalAttributionsWithRemovedAttributions,
        },
      };
    case ACTION_SET_FILE_SEARCH:
      return {
        ...state,
        fileSearchPopup: {
          ...state.fileSearchPopup,
          fileSearch: action.payload,
        },
      };
    default:
      return state;
  }
};
