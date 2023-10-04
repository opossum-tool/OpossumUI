// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  AttributionsToHashes,
  BaseUrlsForSources,
  DisplayPackageInfo,
  ExternalAttributionSources,
  FrequentLicenses,
  ProjectMetadata,
  Resources,
  SelectedCriticality,
} from '../../../shared/shared-types';
import { AllowedSaveOperations, PackagePanelTitle } from '../../enums/enums';
import {
  LocatePopupFilters,
  PackageAttributeIds,
  PackageAttributes,
  PanelPackage,
} from '../../types/types';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_ATTRIBUTION_DATA,
  EMPTY_DISPLAY_PACKAGE_INFO,
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
  ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS,
  ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS,
  ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT,
  ACTION_SET_BASE_URLS_FOR_SOURCES,
  ACTION_SET_DISPLAYED_PANEL_PACKAGE,
  ACTION_SET_ENABLE_PREFERENCE_FEATURE,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
  ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES,
  ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES,
  ACTION_SET_FILE_SEARCH,
  ACTION_SET_FILES_WITH_CHILDREN,
  ACTION_SET_FREQUENT_LICENSES,
  ACTION_SET_ALLOWED_SAVE_OPERATIONS,
  ACTION_SET_MANUAL_ATTRIBUTION_DATA,
  ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS,
  ACTION_SET_PACKAGE_SEARCH_TERM,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_SET_RESOURCES,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  ACTION_TOGGLE_ACCORDION_SEARCH_FIELD,
  ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION,
  ACTION_UPDATE_ATTRIBUTION,
  ResourceAction,
  ACTION_SET_LOCATE_POPUP_FILTERS,
} from '../actions/resource-actions/types';
import {
  createManualAttribution,
  deleteManualAttribution,
  getCalculatePreferredOverOriginIds,
  linkToAttributionManualData,
  replaceAttributionWithMatchingAttributionId,
  unlinkResourceFromAttributionId,
  updateManualAttribution,
} from '../helpers/save-action-helpers';
import {
  addUnresolvedAttributionsToResourcesWithAttributedChildren,
  calculateResourcesWithLocatedAttributions,
  getAttributionIdOfFirstPackageCardInManualPackagePanel,
  getIndexOfAttributionInManualPackagePanel,
  getMatchingAttributionId,
  getResourcesWithLocatedChildren,
  removeResolvedAttributionsFromResourcesWithAttributedChildren,
} from '../helpers/action-and-reducer-helpers';
import { getAttributionBreakpointCheckForResourceState } from '../../util/is-attribution-breakpoint';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { createPackageCardId } from '../../util/create-package-card-id';

export const initialResourceState: ResourceState = {
  allViews: {
    resources: null,
    manualData: EMPTY_ATTRIBUTION_DATA,
    externalData: EMPTY_ATTRIBUTION_DATA,
    frequentLicenses: EMPTY_FREQUENT_LICENSES,
    temporaryDisplayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
    attributionBreakpoints: new Set(),
    filesWithChildren: new Set(),
    allowedSaveOperations: AllowedSaveOperations.All,
    metadata: EMPTY_PROJECT_METADATA,
    baseUrlsForSources: {},
    externalAttributionSources: {},
    attributionIdMarkedForReplacement: '',
    externalAttributionsToHashes: {},
    resourcesWithLocatedAttributions: {
      resourcesWithLocatedChildren: new Set(),
      locatedResources: new Set(),
    },
    isPreferenceFeatureEnabled: false,
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
    originalDisplayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
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
  locatePopup: {
    selectedCriticality: SelectedCriticality.Any,
    selectedLicenses: new Set<string>(),
    searchTerm: '',
    searchOnlyInLicenseField: false,
  },
};

export type ResourceState = {
  allViews: {
    resources: Resources | null;
    manualData: AttributionData;
    externalData: AttributionData;
    frequentLicenses: FrequentLicenses;
    temporaryDisplayPackageInfo: DisplayPackageInfo;
    attributionBreakpoints: Set<string>;
    filesWithChildren: Set<string>;
    allowedSaveOperations: AllowedSaveOperations;
    metadata: ProjectMetadata;
    baseUrlsForSources: BaseUrlsForSources;
    externalAttributionSources: ExternalAttributionSources;
    attributionIdMarkedForReplacement: string;
    externalAttributionsToHashes: AttributionsToHashes;
    resourcesWithLocatedAttributions: {
      resourcesWithLocatedChildren: Set<string>;
      locatedResources: Set<string>;
    };
    isPreferenceFeatureEnabled: boolean;
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
    originalDisplayPackageInfo: DisplayPackageInfo;
    packageNamespaces: PackageAttributes;
    packageNames: PackageAttributes;
    packageVersions: PackageAttributes;
    selectedPackageAttributeIds: PackageAttributeIds;
    totalAttributionCount: number | null;
  };
  locatePopup: LocatePopupFilters;
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
          temporaryDisplayPackageInfo: { ...action.payload },
        },
      };
    case ACTION_SET_SELECTED_RESOURCE_ID:
      const linkedAttributionIds: Array<string> | undefined =
        state.allViews.manualData.resourcesToAttributions[action.payload];

      const displayedAttributionId =
        getAttributionIdOfFirstPackageCardInManualPackagePanel(
          linkedAttributionIds,
          action.payload,
          state,
        );

      const packageCardId = displayedAttributionId
        ? createPackageCardId(PackagePanelTitle.ManualPackages, 0)
        : ADD_NEW_ATTRIBUTION_BUTTON_ID;

      const displayPackageInfoForNewResource = displayedAttributionId
        ? convertPackageInfoToDisplayPackageInfo(
            state.allViews.manualData.attributions[displayedAttributionId],
            [displayedAttributionId],
          )
        : EMPTY_DISPLAY_PACKAGE_INFO;

      return {
        ...state,
        auditView: {
          ...state.auditView,
          selectedResourceId: action.payload,
          displayedPanelPackage: {
            panel: PackagePanelTitle.ManualPackages,
            packageCardId,
            displayPackageInfo: displayPackageInfoForNewResource,
          },
        },
        allViews: {
          ...state.allViews,
          temporaryDisplayPackageInfo: displayPackageInfoForNewResource,
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
    case ACTION_SET_ALLOWED_SAVE_OPERATIONS:
      return {
        ...state,
        allViews: { ...state.allViews, allowedSaveOperations: action.payload },
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
      const selectedResourceId = state.auditView.selectedResourceId;
      const { newManualData, newAttributionId } = createManualAttribution(
        state.allViews.manualData,
        selectedResourceId,
        action.payload.strippedPackageInfo,
        getCalculatePreferredOverOriginIds(state),
      );

      const packageCardIndex = getIndexOfAttributionInManualPackagePanel(
        newAttributionId,
        selectedResourceId,
        newManualData,
      );

      const packageCardIdOfNewAttribution =
        packageCardIndex !== null
          ? createPackageCardId(
              PackagePanelTitle.ManualPackages,
              packageCardIndex,
            )
          : null;

      const newDisplayPackageInfo =
        action.payload.jumpToCreatedAttribution &&
        packageCardIdOfNewAttribution !== null
          ? convertPackageInfoToDisplayPackageInfo(
              newManualData.attributions[newAttributionId],
              [newAttributionId],
            )
          : EMPTY_DISPLAY_PACKAGE_INFO;

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: newManualData,
          ...(action.payload.jumpToCreatedAttribution &&
            packageCardIdOfNewAttribution !== null && {
              temporaryDisplayPackageInfo: newDisplayPackageInfo,
            }),
        },
        auditView: {
          ...state.auditView,
          ...(action.payload.jumpToCreatedAttribution &&
            packageCardIdOfNewAttribution !== null && {
              displayedPanelPackage: {
                panel: PackagePanelTitle.ManualPackages,
                packageCardId: packageCardIdOfNewAttribution,
                displayPackageInfo: newDisplayPackageInfo,
              },
            }),
        },
      };
    case ACTION_UPDATE_ATTRIBUTION:
      const updatedManualData = updateManualAttribution(
        action.payload.attributionId,
        state.allViews.manualData,
        action.payload.strippedPackageInfo,
      );

      const packageCardIndexAfterUpdate =
        getIndexOfAttributionInManualPackagePanel(
          action.payload.attributionId,
          state.auditView.selectedResourceId,
          updatedManualData,
        );

      const packageCardIdAfterUpdate =
        packageCardIndexAfterUpdate !== null
          ? createPackageCardId(
              PackagePanelTitle.ManualPackages,
              packageCardIndexAfterUpdate,
            )
          : null;

      const temporaryDisplayPackageInfoAfterUpdate =
        convertPackageInfoToDisplayPackageInfo(
          action.payload.strippedPackageInfo,
          [action.payload.attributionId],
        );

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: updatedManualData,
          ...(action.payload.jumpToUpdatedAttribution && {
            temporaryDisplayPackageInfo: temporaryDisplayPackageInfoAfterUpdate,
          }),
        },
        auditView: {
          ...state.auditView,
          ...(action.payload.jumpToUpdatedAttribution &&
            packageCardIdAfterUpdate !== null && {
              displayedPanelPackage: {
                panel: PackagePanelTitle.ManualPackages,
                packageCardId: packageCardIdAfterUpdate,
                displayPackageInfo: temporaryDisplayPackageInfoAfterUpdate,
              },
            }),
        },
      };
    case ACTION_DELETE_ATTRIBUTION:
      const attributionToDeleteId = action.payload;
      const manualDataAfterDeletion: AttributionData = deleteManualAttribution(
        state.allViews.manualData,
        attributionToDeleteId,
        getAttributionBreakpointCheckForResourceState(state),
        getCalculatePreferredOverOriginIds(state),
      );

      const displayedDisplayPackageInfo =
        state.auditView.displayedPanelPackage?.displayPackageInfo;
      const attributionIdsOfDisplayedDisplayPackageInfo =
        displayedDisplayPackageInfo
          ? displayedDisplayPackageInfo.attributionIds
          : [];

      const newDisplayedPanelPackage: PanelPackage | null =
        state.auditView.displayedPanelPackage?.panel ===
          PackagePanelTitle.ManualPackages &&
        attributionIdsOfDisplayedDisplayPackageInfo[0] === attributionToDeleteId
          ? {
              panel: PackagePanelTitle.ManualPackages,
              packageCardId: ADD_NEW_ATTRIBUTION_BUTTON_ID,
              displayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
            }
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
        state.allViews.manualData.attributions,
      );

      const manualDataForReplace: AttributionData =
        replaceAttributionWithMatchingAttributionId(
          state.allViews.manualData,
          matchingAttributionIdForReplace,
          action.payload.attributionId,
          getAttributionBreakpointCheckForResourceState(state),
        );

      const packageCardIndexForReplaceAttribution =
        getIndexOfAttributionInManualPackagePanel(
          matchingAttributionIdForReplace,
          state.auditView.selectedResourceId,
          manualDataForReplace,
        );

      const packageCardIdForReplaceAttribution =
        packageCardIndexForReplaceAttribution !== null
          ? createPackageCardId(
              PackagePanelTitle.ManualPackages,
              packageCardIndexForReplaceAttribution,
            )
          : null;

      const temporaryDisplayPackageInfoAfterReplace =
        action.payload.jumpToMatchingAttribution &&
        packageCardIdForReplaceAttribution
          ? convertPackageInfoToDisplayPackageInfo(
              manualDataForReplace.attributions[
                matchingAttributionIdForReplace
              ],
              [matchingAttributionIdForReplace],
            )
          : EMPTY_DISPLAY_PACKAGE_INFO;

      return {
        ...state,
        allViews: {
          ...state.allViews,
          manualData: manualDataForReplace,
          ...(action.payload.jumpToMatchingAttribution &&
            packageCardIdForReplaceAttribution && {
              temporaryDisplayPackageInfo:
                temporaryDisplayPackageInfoAfterReplace,
            }),
        },
        auditView: {
          ...state.auditView,
          ...(action.payload.jumpToMatchingAttribution &&
            packageCardIdForReplaceAttribution && {
              displayedPanelPackage: {
                panel: PackagePanelTitle.ManualPackages,
                packageCardId: packageCardIdForReplaceAttribution,
                displayPackageInfo: temporaryDisplayPackageInfoAfterReplace,
              },
            }),
        },
        attributionView: {
          ...state.attributionView,
          ...(action.payload.jumpToMatchingAttribution &&
            packageCardIdForReplaceAttribution && {
              selectedAttributionId: matchingAttributionIdForReplace,
            }),
        },
      };
    case ACTION_LINK_TO_ATTRIBUTION:
      const matchingAttributionIdForLinking = getMatchingAttributionId(
        action.payload.strippedPackageInfo,
        state.allViews.manualData.attributions,
      );

      const manualDataAfterForLinking: AttributionData =
        linkToAttributionManualData(
          state.allViews.manualData,
          action.payload.resourceId,
          matchingAttributionIdForLinking,
          getAttributionBreakpointCheckForResourceState(state),
          getCalculatePreferredOverOriginIds(state),
        );

      const packageCardIndexOfLinkingAttribution =
        getIndexOfAttributionInManualPackagePanel(
          matchingAttributionIdForLinking,
          action.payload.resourceId,
          manualDataAfterForLinking,
        );

      const packageCardIdOfLinkingAttribution =
        packageCardIndexOfLinkingAttribution !== null
          ? createPackageCardId(
              PackagePanelTitle.ManualPackages,
              packageCardIndexOfLinkingAttribution,
            )
          : ADD_NEW_ATTRIBUTION_BUTTON_ID;

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
            packageCardId: packageCardIdOfLinkingAttribution,
            displayPackageInfo: convertPackageInfoToDisplayPackageInfo(
              manualDataAfterForLinking.attributions[
                matchingAttributionIdForLinking
              ],
              [matchingAttributionIdForLinking],
            ),
          },
        },
      };
    case ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION:
      const manualDataAfterUnlinking: AttributionData =
        unlinkResourceFromAttributionId(
          state.allViews.manualData,
          action.payload.resourceId,
          action.payload.attributionId,
          getCalculatePreferredOverOriginIds(state),
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
        resolvedAttributionId,
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
          resolvedExternalAttributionsWithAddedAttribution.has(attributionId),
        );
      });
      removeResolvedAttributionsFromResourcesWithAttributedChildren(
        resourcesWithAttributedChildren,
        resourcesWithOnlyHiddenAttributions,
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
        action.payload,
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
                ],
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
          originalDisplayPackageInfo: action.payload,
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
    case ACTION_SET_ENABLE_PREFERENCE_FEATURE:
      return {
        ...state,
        allViews: {
          ...state.allViews,
          isPreferenceFeatureEnabled: action.payload,
        },
      };
    case ACTION_SET_LOCATE_POPUP_FILTERS:
      const {
        selectedCriticality,
        selectedLicenses,
        searchTerm,
        searchOnlyInLicenseField,
      } = action.payload;
      const locatedResources = calculateResourcesWithLocatedAttributions(
        selectedCriticality,
        selectedLicenses,
        searchTerm,
        searchOnlyInLicenseField,
        state.allViews.externalData.attributions,
        state.allViews.externalData.attributionsToResources,
        state.allViews.frequentLicenses.nameOrder,
      );
      const resourcesWithLocatedChildren =
        getResourcesWithLocatedChildren(locatedResources);
      return {
        ...state,
        allViews: {
          ...state.allViews,
          resourcesWithLocatedAttributions: {
            locatedResources,
            resourcesWithLocatedChildren,
          },
        },
        locatePopup: {
          selectedCriticality,
          selectedLicenses,
          searchTerm,
          searchOnlyInLicenseField,
        },
      };
    default:
      return state;
  }
};
