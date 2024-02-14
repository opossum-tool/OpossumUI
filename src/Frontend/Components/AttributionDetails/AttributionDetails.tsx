// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDialogContentText from '@mui/material/DialogContentText';

import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import {
  getManualAttributions,
  getSelectedAttributionId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { useIsSelectedAttributionVisible } from '../../state/variables/use-filtered-data';
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
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const manualAttributions = useAppSelector(getManualAttributions);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  const isSelectedAttributionVisible = useIsSelectedAttributionVisible();

  const [confirmEditWasPreferredRef, confirmEditWasPreferred] =
    useConfirmationDialog({
      skip: !temporaryDisplayPackageInfo.wasPreferred,
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
