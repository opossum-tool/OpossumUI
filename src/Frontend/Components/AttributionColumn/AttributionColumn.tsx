// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PackageInfo } from '../../../shared/shared-types';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
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
import {
  getAttributionIdMarkedForReplacement,
  getSelectedAttributionId,
} from '../../state/selectors/attribution-view-resource-selectors';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText, PopupType } from '../../enums/enums';
import { MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';

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
  showSaveForAllButton?: boolean;
  hideDeleteButtons?: boolean;
  showParentAttributions?: boolean;
  showManualAttributionData: boolean;
  resetViewIfThisIdChanges?: string;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSaveButtonClick(): void;
  onSaveForAllButtonClick(): void;
  onDeleteButtonClick(): void;
  onDeleteForAllButtonClick(): void;
  saveFileRequestListener(): void;
  setTemporaryPackageInfo(packageInfo: PackageInfo): void;
}

export function AttributionColumn(props: AttributionColumnProps): ReactElement {
  const classes = useStyles();

  const dispatch = useDispatch();
  const initialPackageInfo = useSelector(getPackageInfoOfSelected);
  const selectedPackage = useSelector(getDisplayedPackage);
  const resolvedExternalAttributions = useSelector(
    getResolvedExternalAttributions
  );
  const temporaryPackageInfo: PackageInfo = useSelector(
    getTemporaryPackageInfo
  );
  const packageInfoWereModified = useSelector(wereTemporaryPackageInfoModified);
  const isSavingDisabled = useSelector(getIsSavingDisabled);
  const selectedAttributionId = useSelector(getSelectedAttributionId);
  const attributionIdMarkedForReplacement = useSelector(
    getAttributionIdMarkedForReplacement
  );
  const view = useSelector(getSelectedView);

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

  const mergeButtonDisplayState = getMergeButtonsDisplayState(
    view,
    attributionIdMarkedForReplacement,
    selectedAttributionId,
    packageInfoWereModified,
    Boolean(temporaryPackageInfo.preSelected)
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
        ? ButtonText.ConfirmForAll
        : ButtonText.SaveForAll,
      disabled: isSavingDisabled,
      onClick: props.onSaveForAllButtonClick,
      hidden: !Boolean(props.showSaveForAllButton),
    },
  ];

  const contextMenuButtonConfigs: Array<ContextMenuItem> = [
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
      buttonText: ButtonText.DeleteForAll,
      onClick: props.onDeleteForAllButtonClick,
      hidden:
        Boolean(props.hideDeleteButtons) ||
        !Boolean(props.showSaveForAllButton),
    },
    {
      buttonText: ButtonText.MarkForReplacement,
      onClick: (): void => {
        dispatch(setAttributionIdMarkedForReplacement(selectedAttributionId));
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
        dispatch(openPopup(PopupType.ReplaceAttributionPopup));
      },
      hidden: mergeButtonDisplayState.hideOnReplaceMarkedByButton,
    },
  ];

  const displayTexts = getDisplayTexts(
    temporaryPackageInfo,
    selectedAttributionId,
    attributionIdMarkedForReplacement
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
          selectedPackage,
          resolvedExternalAttributions,
          dispatch
        )}
        selectedPackageIsResolved={selectedPackageIsResolved(
          selectedPackage,
          resolvedExternalAttributions
        )}
        areButtonsHidden={props.areButtonsHidden}
        mainButtonConfigs={mainButtonConfigs}
        contextMenuButtonConfigs={contextMenuButtonConfigs}
        displayTexts={displayTexts}
      />
    </div>
  );
}
