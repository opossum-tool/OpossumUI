// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement, useEffect, useState } from 'react';
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
import { useWindowHeight } from '../../util/use-window-height';
import {
  getDisplayedPackage,
  getResolvedExternalAttributions,
} from '../../state/selectors/audit-view-resource-selectors';
import { setIsSavingDisabled } from '../../state/actions/resource-actions/save-actions';
import { IpcRendererEvent } from 'electron';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  getDiscreteConfidenceChangeHandler,
  getExcludeFromNoticeChangeHandler,
  getFirstPartyChangeHandler,
  getFollowUpChangeHandler,
  getLicenseTextMaxRows,
  getMergeButtonsDisplayState,
  getResolvedToggleHandler,
  selectedPackageIsResolved,
} from './attribution-column-helpers';
import { PackageSubPanel } from './PackageSubPanel';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { AuditingSubPanel } from './AuditingSubPanel';
import { ButtonRow } from './ButtonRow';
import { generatePurlFromPackageInfo, parsePurl } from '../../util/handle-purl';
import { setAttributionIdMarkedForReplacement } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import {
  getAttributionIdMarkedForReplacement,
  getSelectedAttributionId,
} from '../../state/selectors/attribution-view-resource-selectors';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { PopupType } from '../../enums/enums';

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
  const dispatch = useDispatch();

  const view = useSelector(getSelectedView);
  const licenseTextRows = getLicenseTextMaxRows(useWindowHeight(), view);
  const [isLicenseTextShown, setIsLicenseTextShown] = useState<boolean>(false);
  useEffect(() => {
    setIsLicenseTextShown(false);
  }, [props.resetViewIfThisIdChanges]);
  const copyrightRows = isLicenseTextShown ? 1 : 6;
  const commentRows = isLicenseTextShown ? 1 : Math.max(licenseTextRows - 2, 1);

  const selectedAttributionId = useSelector(getSelectedAttributionId);
  const attributionIdMarkedForReplacement = useSelector(
    getAttributionIdMarkedForReplacement
  );
  const mergeButtonDisplayState = getMergeButtonsDisplayState(
    view,
    attributionIdMarkedForReplacement,
    selectedAttributionId,
    packageInfoWereModified,
    Boolean(temporaryPackageInfo.preSelected)
  );

  const [temporaryPurl, setTemporaryPurl] = useState<string>('');
  const isDisplayedPurlValid: boolean = parsePurl(temporaryPurl).isValid;
  useEffect(() => {
    dispatch(
      setIsSavingDisabled(
        (!packageInfoWereModified || !isDisplayedPurlValid) &&
          !temporaryPackageInfo.preSelected
      )
    );
  }, [
    dispatch,
    packageInfoWereModified,
    isDisplayedPurlValid,
    temporaryPackageInfo,
  ]);
  useEffect(() => {
    setTemporaryPurl(
      generatePurlFromPackageInfo(props.displayPackageInfo) || ''
    );
  }, [props.displayPackageInfo, selectedPackage]);
  function handlePurlChange(event: React.ChangeEvent<{ value: string }>): void {
    setTemporaryPurl(event.target.value);
    const { isValid, purl } = parsePurl(event.target.value);
    if (isValid && purl) {
      dispatch(
        setTemporaryPackageInfo({
          ...temporaryPackageInfo,
          packageName: purl.packageName,
          packageVersion: purl.packageVersion,
          packageNamespace: purl.packageNamespace,
          packageType: purl.packageType,
          packagePURLAppendix: purl.packagePURLAppendix,
        })
      );
    }
  }
  const nameAndVersionAreEditable = props.isEditable && temporaryPurl === '';

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
        temporaryPackageInfo={temporaryPackageInfo}
        initialPackageInfo={initialPackageInfo}
        isSavingDisabled={isSavingDisabled}
        onDeleteButtonClick={props.onDeleteButtonClick}
        onDeleteForAllButtonClick={props.onDeleteForAllButtonClick}
        onSaveButtonClick={props.onSaveButtonClick}
        onSaveForAllButtonClick={props.onSaveForAllButtonClick}
        packageInfoWereModified={packageInfoWereModified}
        resolvedToggleHandler={getResolvedToggleHandler(
          selectedPackage,
          resolvedExternalAttributions,
          dispatch
        )}
        selectedPackageIsResolved={selectedPackageIsResolved(
          selectedPackage,
          resolvedExternalAttributions
        )}
        onUndoButtonClick={(): void => {
          dispatch(setTemporaryPackageInfo(initialPackageInfo));
        }}
        showSaveForAllButton={props.showSaveForAllButton}
        areButtonsHidden={props.areButtonsHidden}
        hideDeleteButtons={props.hideDeleteButtons}
        hideMarkForReplacementButton={
          mergeButtonDisplayState.hideMarkForReplacementButton
        }
        onMarkForReplacementButtonClick={(): void => {
          dispatch(setAttributionIdMarkedForReplacement(selectedAttributionId));
        }}
        hideUnmarkForReplacementButton={
          mergeButtonDisplayState.hideUnmarkForReplacementButton
        }
        onUnmarkForReplacementButtonClick={(): void => {
          dispatch(setAttributionIdMarkedForReplacement(''));
        }}
        hideOnReplaceMarkedByButton={
          mergeButtonDisplayState.hideOnReplaceMarkedByButton
        }
        deactivateReplaceMarkedByButton={
          mergeButtonDisplayState.deactivateReplaceMarkedByButton
        }
        onReplaceMarkedByButtonClick={(): void => {
          dispatch(openPopup(PopupType.ReplaceAttributionPopup));
        }}
      />
    </div>
  );
}
