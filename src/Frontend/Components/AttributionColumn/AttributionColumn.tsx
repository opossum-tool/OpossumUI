// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
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
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  getDiscreteConfidenceChangeHandler,
  getDisplayTexts,
  getExcludeFromNoticeChangeHandler,
  getFirstPartyChangeHandler,
  getFollowUpChangeHandler,
  getMergeButtonsDisplayState,
  getResolvedToggleHandler,
  selectedPackageIsResolved,
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
import { openPopupWithTargetAttributionId } from '../../state/actions/view-actions/view-actions';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import { useAppDispatch, useAppSelector } from '../../state/hooks';

const useStyles = makeStyles({
  root: {
    flex: 1,
    height: '100%',
  },
});

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
  onSaveButtonClick(): void;
  onSaveGloballyButtonClick(): void;
  onDeleteButtonClick(): void;
  onDeleteGloballyButtonClick(): void;
  saveFileRequestListener(): void;
  setTemporaryPackageInfo(packageInfo: PackageInfo): void;
}

export function AttributionColumn(props: AttributionColumnProps): ReactElement {
  const classes = useStyles();

  const dispatch = useAppDispatch();
  const initialPackageInfo = useAppSelector(getPackageInfoOfSelected);
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions
  );
  const temporaryPackageInfo: PackageInfo = useAppSelector(
    getTemporaryPackageInfo
  );
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
    commentRows,
  } = useRows(view, props.resetViewIfThisIdChanges);
  const { temporaryPurl, isDisplayedPurlValid, handlePurlChange } = usePurl(
    dispatch,
    packageInfoWereModified,
    temporaryPackageInfo,
    props.displayPackageInfo,
    selectedPackage
  );
  const nameAndVersionAreEditable = props.isEditable && temporaryPurl === '';
  const currentViewSelectedAttributionId =
    view === View.Attribution
      ? selectedAttributionId
      : view === View.Audit
      ? selectedPackageId
      : '';

  const mergeButtonDisplayState = getMergeButtonsDisplayState(
    view,
    attributionIdMarkedForReplacement,
    currentViewSelectedAttributionId,
    currentViewSelectedAttributionId,
    packageInfoWereModified,
    Boolean(temporaryPackageInfo.preSelected),
    false
  );

  const mainButtonConfigs: Array<MainButtonConfig> = [
    {
      buttonText: temporaryPackageInfo.preSelected
        ? ButtonText.Confirm
        : ButtonText.Save,
      disabled: isSavingDisabled,
      onClick: props.onSaveButtonClick,
      hidden: false,
    },
    {
      buttonText: temporaryPackageInfo.preSelected
        ? ButtonText.ConfirmGlobally
        : ButtonText.SaveGlobally,
      disabled: isSavingDisabled,
      onClick: props.onSaveGloballyButtonClick,
      hidden: !Boolean(props.showSaveGloballyButton),
    },
  ];

  const hamburgerMenuButtonConfigs: Array<ContextMenuItem> = [
    {
      buttonText: ButtonText.Undo,
      disabled: !packageInfoWereModified,
      onClick: (): void => {
        dispatch(setTemporaryPackageInfo(initialPackageInfo));
      },
    },
    {
      buttonText: ButtonText.Delete,
      onClick: props.onDeleteButtonClick,
      hidden: Boolean(props.hideDeleteButtons),
    },
    {
      buttonText: ButtonText.DeleteGlobally,
      onClick: props.onDeleteGloballyButtonClick,
      hidden:
        Boolean(props.hideDeleteButtons) ||
        !Boolean(props.showSaveGloballyButton),
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
          openPopupWithTargetAttributionId(
            PopupType.ReplaceAttributionPopup,
            currentViewSelectedAttributionId
          )
        );
      },
      hidden: mergeButtonDisplayState.hideOnReplaceMarkedByButton,
    },
  ];

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
  useIpcRenderer(IpcChannel.SaveFileRequest, listener, [
    props.saveFileRequestListener,
  ]);

  return (
    <div className={clsx(classes.root)}>
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
      />
      <CopyrightSubPanel
        setUpdateTemporaryPackageInfoFor={
          props.setUpdateTemporaryPackageInfoFor
        }
        isEditable={props.isEditable}
        displayPackageInfo={props.displayPackageInfo}
        copyrightRows={copyrightRows}
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
      />
      <AuditingSubPanel
        commentRows={commentRows}
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
      />
      <ButtonRow
        showButtonGroup={props.showManualAttributionData}
        resolvedToggleHandler={getResolvedToggleHandler(
          selectedPackageId,
          resolvedExternalAttributions,
          dispatch
        )}
        selectedPackageIsResolved={selectedPackageIsResolved(
          selectedPackageId,
          resolvedExternalAttributions
        )}
        areButtonsHidden={props.areButtonsHidden}
        mainButtonConfigs={mainButtonConfigs}
        hamburgerMenuButtonConfigs={hamburgerMenuButtonConfigs}
        displayTexts={displayTexts}
      />
    </div>
  );
}
