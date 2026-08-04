// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDialogContentText from '@mui/material/DialogContentText';
import MuiLinearProgress from '@mui/material/LinearProgress';
import { useEffect, useLayoutEffect, useMemo } from 'react';

import { isEqualToManualAttribution } from '../../../shared/attribution-comparison';
import { text } from '../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import {
  setIsPackageInfoDirty,
  setTemporaryDisplayPackageInfo,
} from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { usePickerMode } from '../../state/variables/use-picker-mode';
import { useFilteredAttributionsList } from '../../util/use-attribution-lists';
import { useCompareToOriginal } from '../../util/use-compare-to-original';
import { useSelectedAttribution } from '../../util/use-selected-attribution';
import { useIsSelectedResourceReadonly } from '../../util/use-selected-resource';
import { AttributionForm } from '../AttributionForm/AttributionForm';
import {
  ConfirmationDialog,
  useConfirmationDialog,
} from '../ConfirmationDialog/ConfirmationDialog';
import { WasPreferredIcon } from '../Icons/Icons';
import { ButtonRow } from './ButtonRow/ButtonRow';

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
  },
  loadingIndicator: {
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
};

export function AttributionDetails() {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const {
    isExternal: selectedAttributionIsExternal,
    isPending: isSelectedAttributionPending,
    packageInfo: selectedAttribution,
  } = useSelectedAttribution();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();

  useLayoutEffect(() => {
    if (!selectedAttributionId || selectedAttribution) {
      dispatch(
        setTemporaryDisplayPackageInfo(
          selectedAttribution || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      );
    }
  }, [
    dispatch,
    selectedAttributionId,
    selectedAttribution,
    selectedResourceId,
  ]);

  const isDirty = useMemo(
    () =>
      !isEqualToManualAttribution(
        temporaryDisplayPackageInfo,
        selectedAttribution || EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    [temporaryDisplayPackageInfo, selectedAttribution],
  );

  useEffect(() => {
    dispatch(setIsPackageInfoDirty(isDirty));
  }, [dispatch, isDirty]);

  const { attributions, loading: manualAttributionsLoading } =
    useFilteredAttributionsList({ external: false });
  const { attributions: signals, loading: signalsLoading } =
    useFilteredAttributionsList({ external: true });
  const isSelectedAttributionVisible =
    !!attributions?.[selectedAttributionId] ||
    !!signals?.[selectedAttributionId];

  const compareToOriginal = useCompareToOriginal(temporaryDisplayPackageInfo);

  const wasPreferred =
    compareToOriginal.hasOriginal &&
    compareToOriginal.isEqualToOriginal === true &&
    temporaryDisplayPackageInfo.originalAttributionWasPreferred;
  const [confirmEditWasPreferredRef, confirmEditWasPreferred] =
    useConfirmationDialog({
      skip: !wasPreferred,
    });
  const pickerMode = usePickerMode();

  const isAttributionsLoading = manualAttributionsLoading || signalsLoading;
  const isSelectedAttributionLoading =
    isAttributionsLoading ||
    (!!selectedAttributionId &&
      !selectedAttribution &&
      isSelectedAttributionPending);
  const hasSelectedAttributionData =
    !isAttributionsLoading && (!selectedAttributionId || !!selectedAttribution);
  const isEditable =
    hasSelectedAttributionData &&
    !pickerMode.isActive &&
    !selectedAttributionIsExternal;

  if (
    !!selectedAttributionId &&
    !isSelectedAttributionVisible &&
    !isSelectedAttributionLoading
  ) {
    return null;
  }

  if (isSelectedResourceReadonly && !selectedAttributionId) {
    return null;
  }

  return (
    <MuiBox aria-label={'attribution column'} sx={classes.root}>
      {isSelectedAttributionLoading && (
        <MuiLinearProgress
          data-testid={'attribution-details-loading'}
          sx={classes.loadingIndicator}
        />
      )}
      <AttributionForm
        packageInfo={temporaryDisplayPackageInfo}
        onEdit={isEditable ? confirmEditWasPreferred : undefined}
        dimmed={pickerMode.isActive}
      />
      {!isSelectedAttributionLoading && (
        <ButtonRow
          isEditable={isEditable}
          packageInfo={temporaryDisplayPackageInfo}
        />
      )}
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
        title={text.modifyWasPreferredPopup.title}
      />
    </MuiBox>
  );
}
