// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent, ReactElement } from 'react';

import {
  PackageInfo,
  isDisplayPackageInfo,
} from '../../../shared/shared-types';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  getAttributionIdMarkedForReplacement,
  getIsSavingDisabled,
  getPackageInfoOfSelected,
  getTemporaryPackageInfo,
  wereTemporaryPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
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
  getNeedsReviewChangeHandler,
  getMergeButtonsDisplayState,
  getResolvedToggleHandler,
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
import { getSelectedAttributionId } from '../../state/selectors/attribution-view-resource-selectors';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import MuiBox from '@mui/material/Box';

const classes = {
  root: {
    flex: 1,
    height: '100%',
  },
};

interface AttributionColumnProps {
  isEditable: boolean;
  areButtonsHidden?: boolean;
  displayPackageInfo: PackageInfo;
  showSaveGloballyButton?: boolean;
  hideDeleteButtons?: boolean;
  showParentAttributions?: boolean;
  showManualAttributionData: boolean;
  resetViewIfThisIdChanges?: string;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSaveButtonClick?(): void;
  onSaveGloballyButtonClick?(): void;
  onDeleteButtonClick?(): void;
  onDeleteGloballyButtonClick?(): void;
  saveFileRequestListener(): void;
  setTemporaryPackageInfo(packageInfo: PackageInfo): void;
  smallerLicenseTextOrCommentField?: boolean;
  addMarginForNeedsReviewCheckbox?: boolean;
}

export function AttributionColumn(props: AttributionColumnProps): ReactElement {
  const dispatch = useAppDispatch();
  const initialPackageInfo: PackageInfo =
    useAppSelector(getPackageInfoOfSelected) || {};
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions
  );
  const temporaryPackageInfo = useAppSelector(getTemporaryPackageInfo);
  const packageInfoWereModified = useAppSelector(
    wereTemporaryPackageInfoModified
  );
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const attributionIdMarkedForReplacement = useAppSelector(
    getAttributionIdMarkedForReplacement
  );
  const view = useAppSelector(getSelectedView);

  const selectedPackageId = selectedPackage
    ? selectedPackage.attributionId
    : '';
  const {
    isLicenseTextShown,
    setIsLicenseTextShown,
    licenseTextRows,
    copyrightRows,
    commentBoxHeight,
  } = useRows(
    view,
    props.resetViewIfThisIdChanges,
    props.smallerLicenseTextOrCommentField
  );
  const { temporaryPurl, isDisplayedPurlValid, handlePurlChange, updatePurl } =
    usePurl(
      dispatch,
      packageInfoWereModified,
      temporaryPackageInfo,
      props.displayPackageInfo,
      selectedPackage,
      selectedAttributionId
    );
  const nameAndVersionAreEditable = props.isEditable && temporaryPurl === '';
  const currentViewSelectedAttributionId =
    view === View.Attribution
      ? selectedAttributionId
      : view === View.Audit
      ? selectedPackageId
      : '';

  const mergeButtonDisplayState = getMergeButtonsDisplayState({
    attributionIdMarkedForReplacement,
    targetAttributionId: currentViewSelectedAttributionId,
    selectedAttributionId: currentViewSelectedAttributionId,
    packageInfoWereModified,
    targetAttributionIsPreSelected: Boolean(temporaryPackageInfo.preSelected),
    targetAttributionIsExternalAttribution: false,
  });

  const mainButtonConfigs: Array<MainButtonConfig> = [];

  if (props.onSaveButtonClick) {
    mainButtonConfigs.push({
      buttonText: temporaryPackageInfo.preSelected
        ? ButtonText.Confirm
        : ButtonText.Save,
      disabled: isSavingDisabled,
      onClick: () => {
        updatePurl(temporaryPackageInfo);
        props.onSaveButtonClick && props.onSaveButtonClick();
      },
      hidden: false,
    });
  }

  if (props.onSaveGloballyButtonClick) {
    mainButtonConfigs.push({
      buttonText: temporaryPackageInfo.preSelected
        ? ButtonText.ConfirmGlobally
        : ButtonText.SaveGlobally,
      disabled: isSavingDisabled,
      onClick: () => {
        updatePurl(temporaryPackageInfo);
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
        updatePurl(initialPackageInfo);
        dispatch(setTemporaryPackageInfo(initialPackageInfo));
      },
    },
    {
      buttonText: ButtonText.MarkForReplacement,
      onClick: (): void => {
        dispatch(
          setAttributionIdMarkedForReplacement(currentViewSelectedAttributionId)
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
            currentViewSelectedAttributionId
          )
        );
      },
      hidden: mergeButtonDisplayState.hideReplaceMarkedByButton,
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
    temporaryPackageInfo,
    selectedAttributionId,
    attributionIdMarkedForReplacement,
    view
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
    !props.displayPackageInfo.firstParty &&
    !props.displayPackageInfo.excludeFromNotice;

  const attributionIdsToResolveOrUnresolve = isDisplayPackageInfo(
    temporaryPackageInfo
  )
    ? temporaryPackageInfo.attributionIds
    : []; // TODO: remove when refactoring

  return (
    <MuiBox sx={classes.root}>
      <PackageSubPanel
        displayPackageInfo={props.displayPackageInfo}
        handlePurlChange={handlePurlChange}
        isDisplayedPurlValid={isDisplayedPurlValid}
        isEditable={props.isEditable}
        nameAndVersionAreEditable={nameAndVersionAreEditable}
        setUpdateTemporaryPackageInfoFor={
          props.setUpdateTemporaryPackageInfoFor
        }
        temporaryPurl={temporaryPurl}
        openPackageSearchPopup={(): void => {
          dispatch(openPopup(PopupType.PackageSearchPopup));
        }}
        showHighlight={showHighlight}
      />
      <CopyrightSubPanel
        setUpdateTemporaryPackageInfoFor={
          props.setUpdateTemporaryPackageInfoFor
        }
        isEditable={props.isEditable}
        displayPackageInfo={props.displayPackageInfo}
        copyrightRows={copyrightRows}
        showHighlight={showHighlight}
      />
      <LicenseSubPanel
        isLicenseTextShown={isLicenseTextShown}
        displayPackageInfo={props.displayPackageInfo}
        isEditable={props.isEditable}
        setUpdateTemporaryPackageInfoFor={
          props.setUpdateTemporaryPackageInfoFor
        }
        licenseTextRows={licenseTextRows}
        setIsLicenseTextShown={setIsLicenseTextShown}
        showHighlight={showHighlight}
      />
      <AuditingSubPanel
        commentBoxHeight={commentBoxHeight}
        isCommentsBoxCollapsed={isLicenseTextShown}
        setUpdateTemporaryPackageInfoFor={
          props.setUpdateTemporaryPackageInfoFor
        }
        isEditable={props.isEditable}
        displayPackageInfo={props.displayPackageInfo}
        firstPartyChangeHandler={getFirstPartyChangeHandler(
          temporaryPackageInfo,
          dispatch
        )}
        discreteConfidenceChangeHandler={getDiscreteConfidenceChangeHandler(
          temporaryPackageInfo,
          dispatch
        )}
        followUpChangeHandler={getFollowUpChangeHandler(
          temporaryPackageInfo,
          dispatch
        )}
        excludeFromNoticeChangeHandler={getExcludeFromNoticeChangeHandler(
          temporaryPackageInfo,
          dispatch
        )}
        showManualAttributionData={props.showManualAttributionData}
        showHighlight={showHighlight}
      />
      <ButtonRow
        showButtonGroup={props.showManualAttributionData}
        resolvedToggleHandler={getResolvedToggleHandler(
          attributionIdsToResolveOrUnresolve,
          resolvedExternalAttributions,
          dispatch
        )}
        selectedPackageIsResolved={selectedPackagesAreResolved(
          attributionIdsToResolveOrUnresolve,
          resolvedExternalAttributions
        )}
        areButtonsHidden={props.areButtonsHidden}
        mainButtonConfigs={mainButtonConfigs}
        hamburgerMenuButtonConfigs={hamburgerMenuButtonConfigs}
        displayTexts={displayTexts}
        isEditable={props.isEditable}
        displayPackageInfo={props.displayPackageInfo}
        needsReviewChangeHandler={getNeedsReviewChangeHandler(
          temporaryPackageInfo,
          dispatch
        )}
        addMarginForNeedsReviewCheckbox={props.addMarginForNeedsReviewCheckbox}
      />
    </MuiBox>
  );
}
