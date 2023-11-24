// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { toggleIsSelectedPackagePreferred } from '../../state/actions/resource-actions/preference-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionIdMarkedForReplacement,
  getDisplayedPackage,
  getIsGlobalSavingDisabled,
  getIsPreferenceFeatureEnabled,
  getIsSavingDisabled,
  getManualDisplayPackageInfoOfSelected,
  getTemporaryDisplayPackageInfo,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import {
  getQAMode,
  getSelectedView,
} from '../../state/selectors/view-selector';
import {
  ResetStateListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import {
  getDiscreteConfidenceChangeHandler,
  getDisplayTexts,
  getExcludeFromNoticeChangeHandler,
  getFirstPartyChangeHandler,
  getFollowUpChangeHandler,
  getMergeButtonsDisplayState,
  getNeedsReviewChangeHandler,
  getResolvedToggleHandler,
  getSelectedManualAttributionIdForAuditView,
  selectedPackagesAreResolved,
  usePurl,
  useRows,
} from './attribution-column-helpers';
import { AuditingSubPanel } from './AuditingSubPanel';
import { ButtonRow } from './ButtonRow';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel';

const classes = {
  root: {
    flex: 1,
    height: '100%',
  },
};

interface AttributionColumnProps {
  isEditable: boolean;
  areButtonsHidden?: boolean;
  showSaveGloballyButton?: boolean;
  hideDeleteButtons?: boolean;
  showParentAttributions?: boolean;
  showManualAttributionData: boolean;
  resetViewIfThisIdChanges?: string;
  onSaveButtonClick?(): void;
  onSaveGloballyButtonClick?(): void;
  onDeleteButtonClick?(): void;
  onDeleteGloballyButtonClick?(): void;
  saveFileRequestListener(): void;
  smallerLicenseTextOrCommentField?: boolean;
}

export function AttributionColumn(props: AttributionColumnProps): ReactElement {
  const dispatch = useAppDispatch();
  const initialManualDisplayPackageInfo =
    useAppSelector(getManualDisplayPackageInfoOfSelected) ||
    EMPTY_DISPLAY_PACKAGE_INFO;
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const packageInfoWereModified = useAppSelector(
    wereTemporaryDisplayPackageInfoModified,
  );
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);
  const isGlobalSavingDisabled = useAppSelector(getIsGlobalSavingDisabled);
  const selectedAttributionIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const attributionIdMarkedForReplacement = useAppSelector(
    getAttributionIdMarkedForReplacement,
  );
  const view = useAppSelector(getSelectedView);
  const isPreferenceFeatureEnabled = useAppSelector(
    getIsPreferenceFeatureEnabled,
  );
  const qaMode = useAppSelector(getQAMode);

  const {
    isLicenseTextShown,
    setIsLicenseTextShown,
    licenseTextRows,
    copyrightRows,
    commentBoxHeight,
  } = useRows(
    view,
    props.resetViewIfThisIdChanges,
    props.smallerLicenseTextOrCommentField,
  );
  const { temporaryPurl, isDisplayedPurlValid, handlePurlChange, updatePurl } =
    usePurl(
      dispatch,
      packageInfoWereModified,
      temporaryDisplayPackageInfo,
      selectedPackage,
      selectedAttributionIdInAttributionView,
    );
  const arePurlElementsEditable = props.isEditable && temporaryPurl === '';
  const selectedManualAttributionIdInCurrentView =
    view === View.Attribution
      ? selectedAttributionIdInAttributionView
      : getSelectedManualAttributionIdForAuditView(selectedPackage);

  const mergeButtonDisplayState = getMergeButtonsDisplayState({
    attributionIdMarkedForReplacement,
    targetAttributionId: selectedManualAttributionIdInCurrentView,
    selectedAttributionId: selectedManualAttributionIdInCurrentView,
    packageInfoWereModified,
    targetAttributionIsPreSelected: Boolean(
      temporaryDisplayPackageInfo.preSelected,
    ),
    targetAttributionIsExternalAttribution: false,
    isPreferenceFeatureEnabled: isPreferenceFeatureEnabled && qaMode,
    attributionIsPreferred: temporaryDisplayPackageInfo.preferred ?? false,
    view,
  });

  const mainButtonConfigs: Array<MainButtonConfig> = [];

  if (props.onSaveButtonClick) {
    mainButtonConfigs.push({
      buttonText: temporaryDisplayPackageInfo.preSelected
        ? ButtonText.Confirm
        : ButtonText.Save,
      disabled: isSavingDisabled,
      onClick: () => {
        updatePurl(temporaryDisplayPackageInfo);
        props.onSaveButtonClick && props.onSaveButtonClick();
      },
      hidden: false,
    });
  }

  if (props.onSaveGloballyButtonClick) {
    mainButtonConfigs.push({
      buttonText: temporaryDisplayPackageInfo.preSelected
        ? ButtonText.ConfirmGlobally
        : ButtonText.SaveGlobally,
      disabled: isGlobalSavingDisabled,
      onClick: () => {
        updatePurl(temporaryDisplayPackageInfo);
        props.onSaveGloballyButtonClick && props.onSaveGloballyButtonClick();
      },
      hidden: !Boolean(props.showSaveGloballyButton),
    });
  }

  const hamburgerMenuButtonConfigs: Array<ContextMenuItem> = [
    {
      buttonText: ButtonText.Undo,
      disabled: !packageInfoWereModified,
      onClick: (): void => {
        updatePurl(initialManualDisplayPackageInfo);
        dispatch(
          setTemporaryDisplayPackageInfo(initialManualDisplayPackageInfo),
        );
      },
    },
    {
      buttonText: ButtonText.MarkForReplacement,
      onClick: (): void => {
        dispatch(
          setAttributionIdMarkedForReplacement(
            selectedManualAttributionIdInCurrentView,
          ),
        );
      },
      hidden: mergeButtonDisplayState.hideMarkForReplacementButton,
    },
    {
      buttonText: ButtonText.UnmarkForReplacement,
      onClick: (): void => {
        dispatch(setAttributionIdMarkedForReplacement(''));
      },
      hidden: mergeButtonDisplayState.hideUnmarkForReplacementButton,
    },
    {
      buttonText: ButtonText.ReplaceMarked,
      disabled: mergeButtonDisplayState.deactivateReplaceMarkedByButton,
      onClick: (): void => {
        dispatch(
          openPopup(
            PopupType.ReplaceAttributionPopup,
            selectedManualAttributionIdInCurrentView,
          ),
        );
      },
      hidden: mergeButtonDisplayState.hideReplaceMarkedByButton,
    },
    {
      buttonText: ButtonText.MarkAsPreferred,
      onClick: (): void => {
        if (selectedManualAttributionIdInCurrentView) {
          dispatch(
            toggleIsSelectedPackagePreferred(temporaryDisplayPackageInfo),
          );
        }
      },
      hidden: mergeButtonDisplayState.hideMarkAsPreferredButton,
    },
    {
      buttonText: ButtonText.UnmarkAsPreferred,
      onClick: (): void => {
        if (selectedManualAttributionIdInCurrentView) {
          dispatch(
            toggleIsSelectedPackagePreferred(temporaryDisplayPackageInfo),
          );
        }
      },
      hidden: mergeButtonDisplayState.hideUnmarkAsPreferredButton,
    },
  ];

  if (props.onDeleteButtonClick) {
    hamburgerMenuButtonConfigs.push({
      buttonText: ButtonText.Delete,
      onClick: props.onDeleteButtonClick,
      hidden: Boolean(props.hideDeleteButtons),
    });
  }

  if (props.onDeleteGloballyButtonClick) {
    hamburgerMenuButtonConfigs.push({
      buttonText: ButtonText.DeleteGlobally,
      onClick: props.onDeleteGloballyButtonClick,
      hidden:
        Boolean(props.hideDeleteButtons) ||
        !Boolean(props.showSaveGloballyButton),
    });
  }

  const displayTexts = getDisplayTexts(
    temporaryDisplayPackageInfo,
    selectedAttributionIdInAttributionView,
    attributionIdMarkedForReplacement,
    view,
  );

  useIpcRenderer<ResetStateListener>(
    AllowedFrontendChannels.SaveFileRequest,
    () => props.saveFileRequestListener(),
    [props.saveFileRequestListener],
  );

  const showHighlight =
    view === View.Attribution &&
    !temporaryDisplayPackageInfo.firstParty &&
    !temporaryDisplayPackageInfo.excludeFromNotice;

  const attributionIdsToResolveOrUnresolve =
    temporaryDisplayPackageInfo.attributionIds;

  return (
    <MuiBox aria-label={'attribution column'} sx={classes.root}>
      <PackageSubPanel
        displayPackageInfo={temporaryDisplayPackageInfo}
        handlePurlChange={handlePurlChange}
        isDisplayedPurlValid={isDisplayedPurlValid}
        isEditable={props.isEditable}
        arePurlElementsEditable={arePurlElementsEditable}
        temporaryPurl={temporaryPurl}
        openPackageSearchPopup={(): void => {
          dispatch(openPopup(PopupType.PackageSearchPopup));
        }}
        showHighlight={showHighlight}
      />
      <CopyrightSubPanel
        isEditable={props.isEditable}
        displayPackageInfo={temporaryDisplayPackageInfo}
        copyrightRows={copyrightRows}
        showHighlight={showHighlight}
      />
      <LicenseSubPanel
        isLicenseTextShown={isLicenseTextShown}
        displayPackageInfo={temporaryDisplayPackageInfo}
        isEditable={props.isEditable}
        licenseTextRows={licenseTextRows}
        setIsLicenseTextShown={setIsLicenseTextShown}
        showHighlight={showHighlight}
      />
      <AuditingSubPanel
        commentBoxHeight={commentBoxHeight}
        isCommentsBoxCollapsed={isLicenseTextShown}
        isEditable={props.isEditable}
        displayPackageInfo={temporaryDisplayPackageInfo}
        firstPartyChangeHandler={getFirstPartyChangeHandler(
          temporaryDisplayPackageInfo,
          dispatch,
        )}
        discreteConfidenceChangeHandler={getDiscreteConfidenceChangeHandler(
          temporaryDisplayPackageInfo,
          dispatch,
        )}
        followUpChangeHandler={getFollowUpChangeHandler(
          temporaryDisplayPackageInfo,
          dispatch,
        )}
        excludeFromNoticeChangeHandler={getExcludeFromNoticeChangeHandler(
          temporaryDisplayPackageInfo,
          dispatch,
        )}
        showHighlight={showHighlight}
      />
      <ButtonRow
        showButtonGroup={props.showManualAttributionData}
        resolvedToggleHandler={getResolvedToggleHandler(
          attributionIdsToResolveOrUnresolve,
          resolvedExternalAttributions,
          dispatch,
        )}
        selectedPackageIsResolved={selectedPackagesAreResolved(
          attributionIdsToResolveOrUnresolve,
          resolvedExternalAttributions,
        )}
        areButtonsHidden={props.areButtonsHidden}
        mainButtonConfigs={mainButtonConfigs}
        hamburgerMenuButtonConfigs={hamburgerMenuButtonConfigs}
        displayTexts={displayTexts}
        isEditable={props.isEditable}
        displayPackageInfo={temporaryDisplayPackageInfo}
        needsReviewChangeHandler={getNeedsReviewChangeHandler(
          temporaryDisplayPackageInfo,
          dispatch,
        )}
      />
    </MuiBox>
  );
}
