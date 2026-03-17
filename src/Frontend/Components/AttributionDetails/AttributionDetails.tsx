// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDialogContentText from '@mui/material/DialogContentText';
import { isEqual } from 'lodash';
import { useEffect, useLayoutEffect, useMemo } from 'react';

import { text } from '../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import {
  setIsPackageInfoDirty,
  setTemporaryDisplayPackageInfo,
} from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getManualAttributions,
  getSelectedAttributionId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { getStrippedPackageInfo } from '../../util/get-stripped-package-info';
import { useIsSelectedAttributionVisible } from '../../util/use-attribution-lists';
import { useCompareToOriginal } from '../../util/use-compare-to-original';
import { useSelectedAttribution } from '../../util/use-selected-attribution';
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
};

export function AttributionDetails() {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const manualAttributions = useAppSelector(getManualAttributions);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const selectedAttribution = useSelectedAttribution();

  useLayoutEffect(() => {
    dispatch(
      setTemporaryDisplayPackageInfo(
        selectedAttribution || EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    );
  }, [dispatch, selectedAttributionId, selectedAttribution]);

  const isDirty = useMemo(
    () =>
      !isEqual(
        getStrippedPackageInfo(temporaryDisplayPackageInfo),
        getStrippedPackageInfo(
          selectedAttribution || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      ),
    [temporaryDisplayPackageInfo, selectedAttribution],
  );

  useEffect(() => {
    dispatch(setIsPackageInfoDirty(isDirty));
  }, [dispatch, isDirty]);

  const isSelectedAttributionVisible = useIsSelectedAttributionVisible();
  const compareToOriginal = useCompareToOriginal(temporaryDisplayPackageInfo);

  const wasPreferred =
    compareToOriginal.hasOriginal &&
    compareToOriginal.isEqualToOriginal === true &&
    temporaryDisplayPackageInfo.originalAttributionWasPreferred;
  const [confirmEditWasPreferredRef, confirmEditWasPreferred] =
    useConfirmationDialog({
      skip: !wasPreferred,
    });
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  const isEditable =
    !attributionIdsForReplacement.length &&
    (!selectedAttributionId ||
      Object.keys(manualAttributions).includes(selectedAttributionId));

  if (!!selectedAttributionId && !isSelectedAttributionVisible) {
    return null;
  }

  return (
    <MuiBox aria-label={'attribution column'} sx={classes.root}>
      <AttributionForm
        packageInfo={temporaryDisplayPackageInfo}
        onEdit={isEditable ? confirmEditWasPreferred : undefined}
      />
      <ButtonRow
        isEditable={isEditable}
        packageInfo={temporaryDisplayPackageInfo}
      />
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
