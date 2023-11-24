// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  DisplayPackageInfo,
  SelectedCriticality,
} from '../../../../shared/shared-types';
import { getLicenseNameVariants } from '../../../Components/ProjectStatisticsPopup/project-statistics-popup-helpers';
import { PackagePanelTitle, PopupType, View } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { State } from '../../../types/types';
import {
  convertDisplayPackageInfoToPackageInfo,
  convertPackageInfoToDisplayPackageInfo,
} from '../../../util/convert-package-info';
import { hasAttributionMultipleResources } from '../../../util/has-attribution-multiple-resources';
import {
  getAllAttributionIdsWithCountsFromResourceAndChildren,
  getAttributionWizardInitialState,
  getPreSelectedPackageAttributeIds,
} from '../../helpers/open-attribution-wizard-popup-helpers';
import {
  getCurrentAttributionId,
  getDisplayPackageInfoOfSelected,
  getExternalAttributions,
  getExternalData,
  getIsSavingDisabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getManualData,
  getResourcesWithLocatedAttributions,
  getTemporaryDisplayPackageInfo,
  wereTemporaryDisplayPackageInfoModified,
} from '../../selectors/all-views-resource-selectors';
import {
  getDidPreferredFieldChange,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../selectors/audit-view-resource-selectors';
import { getSelectedView, getTargetView } from '../../selectors/view-selector';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { setTemporaryDisplayPackageInfo } from '../resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from '../resource-actions/attribution-view-simple-actions';
import {
  setAttributionWizardOriginalAttribution,
  setAttributionWizardPackageNames,
  setAttributionWizardPackageNamespaces,
  setAttributionWizardPackageVersions,
  setAttributionWizardSelectedPackageIds,
  setAttributionWizardTotalAttributionCount,
} from '../resource-actions/attribution-wizard-actions';
import {
  setSelectedResourceId,
  setTargetDisplayedPackage,
  setTargetSelectedResourceId,
} from '../resource-actions/audit-view-simple-actions';
import { setLocatePopupFilters } from '../resource-actions/locate-popup-actions';
import {
  openResourceInResourceBrowser,
  setDisplayedPackageAndResetTemporaryDisplayPackageInfo,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../resource-actions/navigation-actions';
import {
  savePackageInfo,
  unlinkAttributionAndSavePackageInfo,
} from '../resource-actions/save-actions';
import {
  closePopup,
  navigateToView,
  openPopup,
  setShowNoSignalsLocatedMessage,
  setTargetView,
} from '../view-actions/view-actions';

export function navigateToSelectedPathOrOpenUnsavedPopup(
  resourcePath: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(setTargetSelectedResourceId(resourcePath));
      dispatch(setTargetView(View.Audit));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(openResourceInResourceBrowser(resourcePath));
    }
  };
}

export function changeSelectedAttributionIdOrOpenUnsavedPopup(
  attributionId: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const manualAttributions = getManualAttributions(getState());
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(setTargetSelectedAttributionId(attributionId));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(setSelectedAttributionId(attributionId));
      dispatch(
        setTemporaryDisplayPackageInfo(
          convertPackageInfoToDisplayPackageInfo(
            manualAttributions[attributionId],
            [attributionId],
          ),
        ),
      );
    }
  };
}

export function setViewOrOpenUnsavedPopup(selectedView: View): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(setTargetView(selectedView));
      dispatch(setTargetSelectedResourceId(getSelectedResourceId(getState())));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(navigateToView(selectedView));
    }
  };
}

export function setSelectedResourceIdOrOpenUnsavedPopup(
  resourceId: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(setTargetSelectedResourceId(resourceId));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(setSelectedResourceId(resourceId));
    }
  };
}

export function selectPackageCardInAuditViewOrOpenUnsavedPopup(
  packagePanelTitle: PackagePanelTitle,
  packageCardId: string,
  displayPackageInfo: DisplayPackageInfo,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(
        setTargetDisplayedPackage({
          panel: packagePanelTitle,
          packageCardId,
          displayPackageInfo,
        }),
      );
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(
        setDisplayedPackageAndResetTemporaryDisplayPackageInfo({
          panel: packagePanelTitle,
          packageCardId,
          displayPackageInfo,
        }),
      );
    }
  };
}

export function unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId = getSelectedResourceId(getState());
    const attributionId = getCurrentAttributionId(getState()) as string;
    const temporaryDisplayPackageInfo =
      getTemporaryDisplayPackageInfo(getState());
    if (getIsSavingDisabled(getState())) {
      dispatch(closePopup());
      dispatch(openPopup(PopupType.UnableToSavePopup));
      return;
    }
    dispatch(
      unlinkAttributionAndSavePackageInfo(
        selectedResourceId,
        attributionId,
        temporaryDisplayPackageInfo,
      ),
    );
    dispatch(navigateToTargetResourceOrAttribution());
  };
}

export function checkIfWasPreferredAndShowWarningOrUnlinkAndSave(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const currentAttributionId = getCurrentAttributionId(getState());
    const temporaryDisplayPackageInfo =
      getTemporaryDisplayPackageInfo(getState());

    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(closePopup());
      currentAttributionId &&
        dispatch(
          openPopup(
            PopupType.ModifyWasPreferredAttributionPopup,
            currentAttributionId,
          ),
        );
    } else {
      dispatch(
        unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
      );
    }
  };
}

export function saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId = getSelectedResourceId(getState());
    const attributionId = getCurrentAttributionId(getState());
    const temporaryDisplayPackageInfo =
      getTemporaryDisplayPackageInfo(getState());
    if (getIsSavingDisabled(getState())) {
      dispatch(closePopup());
      dispatch(openPopup(PopupType.UnableToSavePopup));
      return;
    }
    dispatch(
      savePackageInfo(
        selectedResourceId,
        attributionId,
        convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
      ),
    );
    dispatch(navigateToTargetResourceOrAttribution());
  };
}

export function checkIfWasPreferredOrPreferredStatusChangedAndShowWarningOrSave(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const currentAttributionId = getCurrentAttributionId(getState());
    const temporaryDisplayPackageInfo =
      getTemporaryDisplayPackageInfo(getState());
    const attributionsToResources =
      getManualAttributionsToResources(getState());
    const attributionHasMultipleResources = hasAttributionMultipleResources(
      currentAttributionId,
      attributionsToResources,
    );

    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(closePopup());
      currentAttributionId &&
        dispatch(
          openPopup(
            PopupType.ModifyWasPreferredAttributionPopup,
            currentAttributionId,
          ),
        );
    } else if (
      attributionHasMultipleResources &&
      getDidPreferredFieldChange(getState())
    ) {
      dispatch(closePopup());
      dispatch(openPopup(PopupType.ChangePreferredStatusGloballyPopup));
    } else {
      dispatch(
        saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
      );
    }
  };
}

export function navigateToTargetResourceOrAttribution(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const targetView = getTargetView(getState());
    const view = getSelectedView(getState());
    dispatch(setSelectedResourceOrAttributionIdToTargetValue());
    if (targetView) {
      dispatch(navigateToView(targetView));
    }
    dispatch(
      setTemporaryDisplayPackageInfo(
        getDisplayPackageInfoOfSelected(getState()) ||
          EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    );

    dispatch(closePopup());
    if (view === View.Report) {
      dispatch(closePopup());
    }
  };
}

export function closePopupAndUnsetTargets(): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setTargetView(null));
    dispatch(setTargetSelectedResourceId(''));
    dispatch(setTargetSelectedAttributionId(''));
    dispatch(closePopup());
  };
}

export function closeEditAttributionPopupOrOpenUnsavedPopup(
  popupAttributionId: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryDisplayPackageInfoModified(getState())) {
      dispatch(openPopup(PopupType.NotSavedPopup, popupAttributionId));
    } else {
      dispatch(closePopup());
    }
  };
}

export function openAttributionWizardPopup(
  originalAttributionId: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId = getSelectedResourceId(getState());
    const externalData = getExternalData(getState());
    const manualData = getManualData(getState());
    const resolvedExternalAttributions =
      getResolvedExternalAttributions(getState());
    const manualAttributions = manualData.attributions;

    const allAttributionIdsOfResourceAndChildrenWithCounts =
      getAllAttributionIdsWithCountsFromResourceAndChildren(
        selectedResourceId,
        externalData.resourcesToAttributions,
        externalData.resourcesWithAttributedChildren,
        manualData.resourcesToAttributions,
        manualData.resourcesWithAttributedChildren,
        resolvedExternalAttributions,
      );

    const {
      packageNamespaces,
      packageNames,
      packageVersions,
      totalAttributionCount,
    } = getAttributionWizardInitialState(
      allAttributionIdsOfResourceAndChildrenWithCounts,
      {
        ...externalData.attributions,
        ...manualData.attributions,
      },
    );

    const originalDisplayPackageInfo =
      originalAttributionId !== null
        ? convertPackageInfoToDisplayPackageInfo(
            manualAttributions[originalAttributionId],
            [originalAttributionId],
          )
        : EMPTY_DISPLAY_PACKAGE_INFO;

    const {
      preSelectedPackageNamespaceId,
      preSelectedPackageNameId,
      preSelectedPackageVersionId,
    } = getPreSelectedPackageAttributeIds(
      originalDisplayPackageInfo,
      packageNamespaces,
      packageNames,
      packageVersions,
    );

    dispatch(
      setAttributionWizardOriginalAttribution(originalDisplayPackageInfo),
    );
    dispatch(setAttributionWizardPackageNamespaces(packageNamespaces));
    dispatch(setAttributionWizardPackageNames(packageNames));
    dispatch(setAttributionWizardPackageVersions(packageVersions));
    dispatch(
      setAttributionWizardSelectedPackageIds({
        namespaceId: preSelectedPackageNamespaceId,
        nameId: preSelectedPackageNameId,
        versionId: preSelectedPackageVersionId,
      }),
    );
    dispatch(setAttributionWizardTotalAttributionCount(totalAttributionCount));

    dispatch(
      openPopup(PopupType.AttributionWizardPopup, originalAttributionId),
    );
  };
}

export function closeAttributionWizardPopup(): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    const emptyAttributionWizardState = {
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
    };

    dispatch(
      setAttributionWizardOriginalAttribution(
        emptyAttributionWizardState.originalDisplayPackageInfo,
      ),
    );
    dispatch(
      setAttributionWizardPackageNamespaces(
        emptyAttributionWizardState.packageNamespaces,
      ),
    );
    dispatch(
      setAttributionWizardPackageNames(
        emptyAttributionWizardState.packageNames,
      ),
    );
    dispatch(
      setAttributionWizardPackageVersions(
        emptyAttributionWizardState.packageVersions,
      ),
    );
    dispatch(
      setAttributionWizardSelectedPackageIds(
        emptyAttributionWizardState.selectedPackageAttributeIds,
      ),
    );
    dispatch(
      setAttributionWizardTotalAttributionCount(
        emptyAttributionWizardState.totalAttributionCount,
      ),
    );

    dispatch(closePopup());
  };
}

export function locateSignalsFromLocatorPopup(
  criticality: SelectedCriticality,
  licenseNames: Set<string>,
  searchTerm: string,
  searchOnlyLicenseName: boolean,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    dispatch(
      setLocatePopupFilters({
        selectedCriticality: criticality,
        selectedLicenses: licenseNames,
        searchTerm,
        searchOnlyLicenseName,
      }),
    );

    const { locatedResources, resourcesWithLocatedChildren } =
      getResourcesWithLocatedAttributions(getState());
    const noSignalsAreFound =
      locatedResources.size === 0 && resourcesWithLocatedChildren.size === 0;
    const allFiltersAreEmpty =
      criticality === SelectedCriticality.Any &&
      licenseNames.size === 0 &&
      searchTerm === '';
    const showNoSignalsLocatedMessage =
      noSignalsAreFound && !allFiltersAreEmpty;

    dispatch(setShowNoSignalsLocatedMessage(showNoSignalsLocatedMessage));

    if (!showNoSignalsLocatedMessage) {
      dispatch(closePopup());
      if (getSelectedView(getState()) !== View.Audit) {
        dispatch(setViewOrOpenUnsavedPopup(View.Audit));
      }
    }
  };
}

export function locateSignalsFromProjectStatisticsPopup(
  licenseName: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const externalAttributions = getExternalAttributions(getState());
    const licenseNames: Set<string> = getLicenseNameVariants(
      licenseName,
      externalAttributions,
    );

    dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: licenseNames,
        searchTerm: '',
        searchOnlyLicenseName: false,
      }),
    );
    dispatch(closePopup());
    if (getSelectedView(getState()) !== View.Audit) {
      dispatch(setViewOrOpenUnsavedPopup(View.Audit));
    }
  };
}

export function removeWasPreferred(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const { wasPreferred, ...temporaryDisplayPackageInfo } =
      getTemporaryDisplayPackageInfo(getState());
    dispatch(setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo));
  };
}
