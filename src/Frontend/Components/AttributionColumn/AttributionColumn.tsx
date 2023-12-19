// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDialogContentText from '@mui/material/DialogContentText';
import MuiDivider from '@mui/material/Divider';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MuiTypography from '@mui/material/Typography';
import { ReactElement, useEffect } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import {
  AllowedSaveOperations,
  AttributionType,
  ButtonText,
  View,
} from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { setAllowedSaveOperations } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getTemporaryDisplayPackageInfo,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import {
  ResetStateListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import {
  ConfirmationDialog,
  useConfirmationDialog,
} from '../ConfirmationDialog/ConfirmationDialog';
import { WasPreferredIcon } from '../Icons/Icons';
import {
  getResolvedToggleHandler,
  selectedPackagesAreResolved,
} from './attribution-column-helpers';
import { AuditingOptions } from './AuditingOptions';
import { ButtonRow } from './ButtonRow';
import { CommentStack } from './CommentStack';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel';

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  panelsContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '6px',
    gap: '12px',
    overflow: 'hidden auto',
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: '8px',
  },
  showHideButton: {
    height: '40px',
    minWidth: '100px',
    background: OpossumColors.lightBlue,
    color: OpossumColors.black,
    '&:hover': {
      background: OpossumColors.lightBlueOnHover,
    },
    '&.Mui-selected': {
      background: OpossumColors.darkBlue,
      color: OpossumColors.white,
    },
  },
};

interface AttributionColumnProps {
  isEditable: boolean;
  areButtonsHidden?: boolean;
  showSaveGloballyButton?: boolean;
  hideDeleteButtons?: boolean;
  showParentAttributions?: boolean;
  showHideButton?: boolean;
  onSaveButtonClick?(): void;
  onSaveGloballyButtonClick?(): void;
  onDeleteButtonClick?(): void;
  onDeleteGloballyButtonClick?(): void;
  saveFileRequestListener(): void;
}

export function AttributionColumn(props: AttributionColumnProps): ReactElement {
  const dispatch = useAppDispatch();
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const [confirmEditWasPreferredRef, confirmEditWasPreferred] =
    useConfirmationDialog({
      skip: !temporaryDisplayPackageInfo.wasPreferred,
    });
  const packageInfoWereModified = useAppSelector(
    wereTemporaryDisplayPackageInfoModified,
  );
  const view = useAppSelector(getSelectedView);

  useIpcRenderer<ResetStateListener>(
    AllowedFrontendChannels.SaveFileRequest,
    () => props.saveFileRequestListener(),
    [props.saveFileRequestListener],
  );

  const showHighlight =
    view === View.Attribution &&
    !temporaryDisplayPackageInfo.firstParty &&
    !temporaryDisplayPackageInfo.excludeFromNotice;

  const selectedPackageIsResolved = selectedPackagesAreResolved(
    temporaryDisplayPackageInfo.attributionIds,
    resolvedExternalAttributions,
  );

  useEffect(() => {
    dispatch(
      setAllowedSaveOperations(
        packageInfoWereModified || temporaryDisplayPackageInfo.preSelected
          ? AllowedSaveOperations.All
          : AllowedSaveOperations.None,
      ),
    );
  }, [
    dispatch,
    packageInfoWereModified,
    temporaryDisplayPackageInfo.preSelected,
  ]);

  return (
    <>
      <MuiBox aria-label={'attribution column'} sx={classes.root}>
        <MuiBox sx={classes.panelsContainer}>
          <AuditingOptions
            packageInfo={temporaryDisplayPackageInfo}
            isEditable={props.isEditable}
          />
          <MuiDivider variant={'middle'}>
            <MuiTypography>
              {text.attributionColumn.packageCoordinates}
            </MuiTypography>
          </MuiDivider>
          <PackageSubPanel
            displayPackageInfo={temporaryDisplayPackageInfo}
            isEditable={props.isEditable}
            showHighlight={showHighlight}
            confirmEditWasPreferred={confirmEditWasPreferred}
          />
          <MuiDivider variant={'middle'}>
            <MuiTypography>
              {text.attributionColumn.legalInformation}
            </MuiTypography>
          </MuiDivider>
          {renderAttributionType()}
          {temporaryDisplayPackageInfo.firstParty ? null : (
            <>
              <CopyrightSubPanel
                isEditable={props.isEditable}
                displayPackageInfo={temporaryDisplayPackageInfo}
                showHighlight={showHighlight}
                confirmEditWasPreferred={confirmEditWasPreferred}
              />
              <LicenseSubPanel
                displayPackageInfo={temporaryDisplayPackageInfo}
                isEditable={props.isEditable}
                showHighlight={showHighlight}
                confirmEditWasPreferred={confirmEditWasPreferred}
              />
            </>
          )}
          <CommentStack
            isEditable={props.isEditable}
            displayPackageInfo={temporaryDisplayPackageInfo}
            confirmEditWasPreferred={confirmEditWasPreferred}
          />
        </MuiBox>
        <MuiBox sx={classes.buttonsContainer}>
          {props.showHideButton ? (
            renderShowHideButton()
          ) : (
            <ButtonRow
              areButtonsHidden={props.areButtonsHidden}
              displayPackageInfo={temporaryDisplayPackageInfo}
              hideDeleteButtons={props.hideDeleteButtons}
              onDeleteButtonClick={props.onDeleteButtonClick}
              onDeleteGloballyButtonClick={props.onDeleteGloballyButtonClick}
              onSaveButtonClick={props.onSaveButtonClick}
              onSaveGloballyButtonClick={props.onSaveGloballyButtonClick}
              showSaveGloballyButton={props.showSaveGloballyButton}
            />
          )}
        </MuiBox>
      </MuiBox>
      {renderConfirmationDialog()}
    </>
  );

  function renderAttributionType() {
    return (
      <MuiToggleButtonGroup
        value={temporaryDisplayPackageInfo.firstParty || false}
        exclusive
        onChange={(_, newValue) =>
          confirmEditWasPreferred(() =>
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...temporaryDisplayPackageInfo,
                firstParty: newValue,
                wasPreferred: undefined,
              }),
            ),
          )
        }
        size={'small'}
        fullWidth
      >
        <MuiToggleButton value={false} disableRipple>
          {AttributionType.ThirdParty}
        </MuiToggleButton>
        <MuiToggleButton value={true} disableRipple>
          {AttributionType.FirstParty}
        </MuiToggleButton>
      </MuiToggleButtonGroup>
    );
  }

  function renderShowHideButton() {
    return (
      <MuiToggleButton
        value={'check'}
        selected={selectedPackageIsResolved}
        onChange={getResolvedToggleHandler(
          temporaryDisplayPackageInfo.attributionIds,
          resolvedExternalAttributions,
          dispatch,
        )}
        sx={classes.showHideButton}
        aria-label={'resolve attribution'}
      >
        {selectedPackageIsResolved ? ButtonText.Unhide : ButtonText.Hide}
      </MuiToggleButton>
    );
  }

  function renderConfirmationDialog() {
    return (
      <ConfirmationDialog
        ref={confirmEditWasPreferredRef}
        message={
          <MuiDialogContentText
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {text.modifyWasPreferredPopup.message}
            <WasPreferredIcon />
            {'.'}
          </MuiDialogContentText>
        }
        title={text.modifyWasPreferredPopup.header}
      />
    );
  }
}
