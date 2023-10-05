// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent, ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  getAttributionIdMarkedForReplacement,
  getIsGlobalSavingDisabled,
  getIsPreferenceFeatureEnabled,
  getIsSavingDisabled,
  getManualDisplayPackageInfoOfSelected,
  getTemporaryDisplayPackageInfo,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getQAMode,
  getSelectedView,
} from '../../state/selectors/view-selector';
import {
  getDisplayedPackage,
  getResolvedExternalAttributions,
} from '../../state/selectors/audit-view-resource-selectors';
import { IpcRendererEvent } from 'electron';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
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
import { PackageSubPanel } from './PackageSubPanel';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { AuditingSubPanel } from './AuditingSubPanel';
import { ButtonRow } from './ButtonRow';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import MuiBox from '@mui/material/Box';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { isEqual } from 'lodash';
import { toggleIsSelectedPackagePreferred } from '../../state/actions/resource-actions/preference-actions';

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
  setUpdateTemporaryDisplayPackageInfoFor(
    propertyToUpdate: string,
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSaveButtonClick?(): void;
  onSaveGloballyButtonClick?(): void;
  onDeleteButtonClick?(): void;
  onDeleteGloballyButtonClick?(): void;
  saveFileRequestListener(): void;
  setTemporaryDisplayPackageInfo(displayPackageInfo: DisplayPackageInfo): void;
  smallerLicenseTextOrCommentField?: boolean;
  addMarginForNeedsReviewCheckbox?: boolean;
}

export function AttributionColumn(props: AttributionColumnProps): ReactElement {
  const dispatch = useAppDispatch();
  const initialManualDisplayPackageInfo =
    useAppSelector(getManualDisplayPackageInfoOfSelected, isEqual) ||
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
  const wasPreferredFieldChanged: boolean =
    initialManualDisplayPackageInfo.preferred !==
    temporaryDisplayPackageInfo.preferred;
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
      wasPreferredFieldChanged,
      temporaryDisplayPackageInfo,
      selectedPackage,
      selectedAttributionIdInAttributionView,
    );
  const nameAndVersionAreEditable = props.isEditable && temporaryPurl === '';
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
        if (selectedPackage) {
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
        if (selectedPackage) {
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

  function listener(event: IpcRendererEvent, resetState: boolean): void {
    if (resetState) {
      props.saveFileRequestListener();
    }
  }
  useIpcRenderer(AllowedFrontendChannels.SaveFileRequest, listener, [
    props.saveFileRequestListener,
  ]);

  const showHighlight =
    view === View.Attribution &&
    !temporaryDisplayPackageInfo.firstParty &&
    !temporaryDisplayPackageInfo.excludeFromNotice;

  const attributionIdsToResolveOrUnresolve =
    temporaryDisplayPackageInfo.attributionIds;

  return (
    <MuiBox sx={classes.root}>
      <PackageSubPanel
        displayPackageInfo={temporaryDisplayPackageInfo}
        handlePurlChange={handlePurlChange}
        isDisplayedPurlValid={isDisplayedPurlValid}
        isEditable={props.isEditable}
        nameAndVersionAreEditable={nameAndVersionAreEditable}
        setUpdateTemporaryDisplayPackageInfoFor={
          props.setUpdateTemporaryDisplayPackageInfoFor
        }
        temporaryPurl={temporaryPurl}
        openPackageSearchPopup={(): void => {
          dispatch(openPopup(PopupType.PackageSearchPopup));
        }}
        showHighlight={showHighlight}
      />
      <CopyrightSubPanel
        setUpdateTemporaryDisplayPackageInfoFor={
          props.setUpdateTemporaryDisplayPackageInfoFor
        }
        isEditable={props.isEditable}
        displayPackageInfo={temporaryDisplayPackageInfo}
        copyrightRows={copyrightRows}
        showHighlight={showHighlight}
      />
      <LicenseSubPanel
        isLicenseTextShown={isLicenseTextShown}
        displayPackageInfo={temporaryDisplayPackageInfo}
        isEditable={props.isEditable}
        setUpdateTemporaryDisplayPackageInfoFor={
          props.setUpdateTemporaryDisplayPackageInfoFor
        }
        licenseTextRows={licenseTextRows}
        setIsLicenseTextShown={setIsLicenseTextShown}
        showHighlight={showHighlight}
      />
      <AuditingSubPanel
        commentBoxHeight={commentBoxHeight}
        isCommentsBoxCollapsed={isLicenseTextShown}
        setUpdateTemporaryDisplayPackageInfoFor={
          props.setUpdateTemporaryDisplayPackageInfoFor
        }
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
        showManualAttributionData={props.showManualAttributionData}
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
        addMarginForNeedsReviewCheckbox={props.addMarginForNeedsReviewCheckbox}
      />
    </MuiBox>
  );
}
