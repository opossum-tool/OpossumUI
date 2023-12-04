// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { AttributionType, ButtonText, View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getDisplayedPackage,
  getTemporaryDisplayPackageInfo,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import {
  ResetStateListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { TextFieldStack } from '../TextFieldStack/TextFieldStack';
import {
  getResolvedToggleHandler,
  selectedPackagesAreResolved,
  usePurl,
} from './attribution-column-helpers';
import { AuditingOptions } from './AuditingOptions';
import { ButtonRow } from './ButtonRow';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';

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
  const selectedAttributionIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const view = useAppSelector(getSelectedView);

  const { temporaryPurl, isDisplayedPurlValid, handlePurlChange, updatePurl } =
    usePurl(
      dispatch,
      packageInfoWereModified,
      temporaryDisplayPackageInfo,
      selectedPackage,
      selectedAttributionIdInAttributionView,
    );
  const arePurlElementsEditable = props.isEditable && temporaryPurl === '';

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

  return (
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
          handlePurlChange={handlePurlChange}
          isDisplayedPurlValid={isDisplayedPurlValid}
          isEditable={props.isEditable}
          arePurlElementsEditable={arePurlElementsEditable}
          temporaryPurl={temporaryPurl}
          showHighlight={showHighlight}
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
            />
            <LicenseSubPanel
              displayPackageInfo={temporaryDisplayPackageInfo}
              isEditable={props.isEditable}
              showHighlight={showHighlight}
            />
          </>
        )}
        <TextFieldStack
          isEditable={props.isEditable}
          comments={temporaryDisplayPackageInfo.comments || []}
        />
      </MuiBox>
      <MuiBox sx={classes.buttonsContainer}>
        {props.showHideButton ? (
          renderShowHideButton()
        ) : (
          <ButtonRow
            areButtonsHidden={props.areButtonsHidden}
            displayPackageInfo={temporaryDisplayPackageInfo}
            updatePurl={updatePurl}
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
  );

  function renderAttributionType() {
    return (
      <MuiToggleButtonGroup
        value={temporaryDisplayPackageInfo.firstParty || false}
        exclusive
        onChange={(_, newValue) => {
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...temporaryDisplayPackageInfo,
              firstParty: newValue,
            }),
          );
        }}
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
}
