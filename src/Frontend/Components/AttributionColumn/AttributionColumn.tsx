// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDialogContentText from '@mui/material/DialogContentText';
import MuiToggleButton from '@mui/material/ToggleButton';
import { ReactElement, useEffect, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AllowedSaveOperations, ButtonText, View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { setAllowedSaveOperations } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getTemporaryDisplayPackageInfo,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import {
  ResetStateListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { ButtonProps } from '../Button/Button';
import {
  ConfirmationDialog,
  useConfirmationDialog,
} from '../ConfirmationDialog/ConfirmationDialog';
import { DiffPopup } from '../DiffPopup/DiffPopup';
import { WasPreferredIcon } from '../Icons/Icons';
import {
  getResolvedToggleHandler,
  selectedPackagesAreResolved,
} from './AttributionColumn.util';
import { AttributionForm } from './AttributionForm';
import { ButtonRow } from './ButtonRow';

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
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
  const externalAttributions = useAppSelector(getExternalAttributions);
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
  const [displayDiffPopup, setDisplayDiffPopup] = useState(false);

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

  // I am not sure I understand this logic. I would have expected something like: check the originIds and see if there is a single origin that I can find in externalAttributions?
  const originPackageInfo = useMemo(
    () =>
      !!temporaryDisplayPackageInfo.originIds?.length
        ? Object.values(externalAttributions).find(({ originIds }) =>
            originIds?.some((id) =>
              temporaryDisplayPackageInfo.originIds?.includes(id),
            ),
          )
        : undefined,
    [externalAttributions, temporaryDisplayPackageInfo.originIds],
  );

  const compareToOriginAction: ButtonProps = {
    disabled: !originPackageInfo,
    onClick: originPackageInfo ? () => setDisplayDiffPopup(true) : undefined,
    color: 'secondary',
    buttonText: ButtonText.CompareToOrigin,
  };

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
        <AttributionForm
          packageInfo={temporaryDisplayPackageInfo}
          isEditable={props.isEditable}
          showHighlight={showHighlight}
          confirmEditWasPreferred={confirmEditWasPreferred}
        />
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
              additionalActions={[compareToOriginAction]}
            />
          )}
        </MuiBox>
      </MuiBox>
      {renderConfirmationDialog()}
      {renderDiffPopup()}
    </>
  );

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

  function renderDiffPopup() {
    // TODO quick solution to get a DisplayPackageInfo. Can this be improved? Also: Non-null assertion is forbidden. What to do?
    const originDisplayedPackageInfo: DisplayPackageInfo = {
      ...originPackageInfo,
      attributionIds: [],
    };

    return (
      <DiffPopup
        packagesForDiff={{
          originDisplayPackageInfo: originDisplayedPackageInfo,
          currentDisplayPackageInfo: temporaryDisplayPackageInfo,
        }}
        isOpen={displayDiffPopup}
        setDisplayState={setDisplayDiffPopup}
      />
    );
  }
}
