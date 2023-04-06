// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  AttributionsToHashes,
  BaseUrlsForSources,
  ExternalAttributionSources,
  FrequentLicenses,
  DisplayPackageInfo,
  PackageInfo,
  ProjectMetadata,
  Resources,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import {
  PanelPackage,
  PackageAttributeIds,
  PackageAttributes,
} from '../../types/types';
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
  ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_SET_RESOURCES,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  ACTION_TOGGLE_ACCORDION_SEARCH_FIELD,
  ACTION_SET_PACKAGE_SEARCH_TERM,
  ResourceAction,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS,
  ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION,
  ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS,
  ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT,
  ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES,
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
  addUnresolvedAttributionsToResourcesWithAttributedChildren,
  getMatchingAttributionId,
  removeResolvedAttributionsFromResourcesWithAttributedChildren,
} from '../helpers/action-and-reducer-helpers';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { getAttributionBreakpointCheckForResourceState } from '../../util/is-attribution-breakpoint';

export const initialResourceState: ResourceState = {
  allViews: {
    resources: null,
    manualData: EMPTY_ATTRIBUTION_DATA,
    externalData: EMPTY_ATTRIBUTION_DATA,
    frequentLicenses: EMPTY_FREQUENT_LICENSES,
    temporaryPackageInfo: {},
    attributionBreakpoints: new Set(),
    filesWithChildren: new Set(),
    isSavingDisabled: false,
    metadata: EMPTY_PROJECT_METADATA,
    baseUrlsForSources: {},
    externalAttributionSources: {},
    attributionIdMarkedForReplacement: '',
    externalAttributionsToHashes: {},
  },
  auditView: {
    selectedResourceId: '',
    targetSelectedResourceId: null,
    expandedIds: ['/'],
    displayedPanelPackage: null,
    targetDisplayedPanelPackage: null,
    resolvedExternalAttributions: new Set(),
    accordionSearchField: {
      isSearchFieldDisplayed: false,
      searchTerm: '',
    },
  },
  attributionView: {
    selectedAttributionId: '',
    targetSelectedAttributionId: null,
    multiSelectSelectedAttributionIds: [],
  },
  fileSearchPopup: {
    fileSearch: '',
  },
  attributionWizard: {
    originalAttribution: {},
    packageNamespaces: {},
    packageNames: {},
    packageVersions: {},
    selectedPackageAttributeIds: {
      namespaceId: '',
      nameId: '',
      versionId: '',
    },
    totalAttributionCount: null,
  },
};

export type ResourceState = {
  allViews: {
    resources: Resources | null;
    manualData: AttributionData;
    externalData: AttributionData;
    frequentLicenses: FrequentLicenses;
    temporaryPackageInfo: PackageInfo | DisplayPackageInfo;
    attributionBreakpoints: Set<string>;
    filesWithChildren: Set<string>;
    isSavingDisabled: boolean;
    metadata: ProjectMetadata;
    baseUrlsForSources: BaseUrlsForSources;
    externalAttributionSources: ExternalAttributionSources;
    attributionIdMarkedForReplacement: string;
    externalAttributionsToHashes: AttributionsToHashes;
  };
  auditView: {
    selectedResourceId: string;
    targetSelectedResourceId: string | null;
    expandedIds: Array<string>;
    displayedPanelPackage: PanelPackage | null;
    targetDisplayedPanelPackage: PanelPackage | null;
    resolvedExternalAttributions: Set<string>;
    accordionSearchField: {
      isSearchFieldDisplayed: boolean;
      searchTerm: string;
    };
  };
  attributionView: {
    selectedAttributionId: string;
    targetSelectedAttributionId: string | null;
    multiSelectSelectedAttributionIds: Array<string>;
  };
  fileSearchPopup: {
    fileSearch: string;
  };
  attributionWizard: {
    originalAttribution: PackageInfo;
    packageNamespaces: PackageAttributes;
    packageNames: PackageAttributes;
    packageVersions: PackageAttributes;
    selectedPackageAttributeIds: PackageAttributeIds;
    totalAttributionCount: number | null;
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
        allViews: { ...state.allViews, frequentLicenses: action.payload },
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
    case ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          targetDisplayedPanelPackage: action.payload && {
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
    case ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS:
      return {
        ...state,
        attributionView: {
          ...state.attributionView,
          multiSelectSelectedAttributionIds: [...action.payload],
        },
      };
    case ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT:
      return {
        ...state,
        allViews: {
          ...state.allViews,
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
        action.payload.strippedPackageInfo
      );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: newManualData,
        },
        auditView: {
          ...state.auditView,
          ...(action.payload.jumpToCreatedAttribution && {
            displayedPanelPackage: {
              panel: PackagePanelTitle.ManualPackages,
              attributionId: newAttributionId,
            },
          }),
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
          ...(action.payload.jumpToUpdatedAttribution && {
            temporaryPackageInfo: action.payload.strippedPackageInfo,
          }),
        },
      };
    case ACTION_DELETE_ATTRIBUTION:
      const attributionToDeleteId = action.payload;
      const manualDataAfterDeletion: AttributionData = deleteManualAttribution(
        state.allViews.manualData,
        attributionToDeleteId,
        getAttributionBreakpointCheckForResourceState(state)
      );

      const newDisplayedPanelPackage: PanelPackage | null =
        state.auditView.displayedPanelPackage?.panel ===
          PackagePanelTitle.ManualPackages &&
        state.auditView.displayedPanelPackage.attributionId ===
          attributionToDeleteId
          ? { ...state.auditView.displayedPanelPackage, attributionId: '' }
          : state.auditView.displayedPanelPackage;

      const newSelectedAttributionId: string =
        state.attributionView.selectedAttributionId === attributionToDeleteId
          ? ''
          : state.attributionView.selectedAttributionId;

      const newAttributionIdMarkedForReplacement: string =
        state.allViews.attributionIdMarkedForReplacement ===
        attributionToDeleteId
          ? ''
          : state.allViews.attributionIdMarkedForReplacement;

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataAfterDeletion,
          attributionIdMarkedForReplacement:
            newAttributionIdMarkedForReplacement,
        },
        auditView: {
          ...state.auditView,
          displayedPanelPackage: newDisplayedPanelPackage,
        },
        attributionView: {
          ...state.attributionView,
          selectedAttributionId: newSelectedAttributionId,
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
        },
        auditView: {
          ...state.auditView,
          ...(action.payload.jumpToMatchingAttribution && {
            displayedPanelPackage: {
              panel: PackagePanelTitle.ManualPackages,
              attributionId: matchingAttributionIdForReplace,
            },
          }),
        },
        attributionView: {
          ...state.attributionView,
          ...(action.payload.jumpToMatchingAttribution && {
            selectedAttributionId: matchingAttributionIdForReplace,
          }),
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

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataAfterUnlinking,
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
          externalData: {
            ...state.allViews.externalData,
            resourcesWithAttributedChildren,
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
    case ACTION_TOGGLE_ACCORDION_SEARCH_FIELD:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          accordionSearchField: {
            ...state.auditView.accordionSearchField,
            isSearchFieldDisplayed:
              !state.auditView.accordionSearchField.isSearchFieldDisplayed,
          },
        },
      };
    case ACTION_SET_PACKAGE_SEARCH_TERM:
      return {
        ...state,
        auditView: {
          ...state.auditView,
          accordionSearchField: {
            ...state.auditView.accordionSearchField,
            searchTerm: action.payload,
          },
        },
      };

    case ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION:
      return {
        ...state,
        attributionWizard: {
          ...state.attributionWizard,
          originalAttribution: action.payload,
        },
      };
    case ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES:
      return {
        ...state,
        attributionWizard: {
          ...state.attributionWizard,
          packageNamespaces: action.payload,
        },
      };
    case ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES:
      return {
        ...state,
        attributionWizard: {
          ...state.attributionWizard,
          packageNames: action.payload,
        },
      };
    case ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS:
      return {
        ...state,
        attributionWizard: {
          ...state.attributionWizard,
          packageVersions: action.payload,
        },
      };
    case ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS:
      return {
        ...state,
        attributionWizard: {
          ...state.attributionWizard,
          selectedPackageAttributeIds: action.payload,
        },
      };
    case ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT:
      return {
        ...state,
        attributionWizard: {
          ...state.attributionWizard,
          totalAttributionCount: action.payload,
        },
      };
    case ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES:
      return {
        ...state,
        allViews: {
          ...state.allViews,
          externalAttributionsToHashes: action.payload,
        },
      };
    default:
      return state;
  }
};
