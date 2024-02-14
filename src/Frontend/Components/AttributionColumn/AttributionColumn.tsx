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
  getAttributionBreakpoints,
  getManualAttributions,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { useIsSelectedAttributionVisible } from '../../state/variables/use-filtered-data';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import {
  ConfirmationDialog,
  useConfirmationDialog,
} from '../ConfirmationDialog/ConfirmationDialog';
import { WasPreferredIcon } from '../Icons/Icons';
import { AttributionForm } from './AttributionForm';
import { ButtonRow } from './ButtonRow';

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
  },
};

export function AttributionColumn() {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const manualAttributions = useAppSelector(getManualAttributions);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
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

  const showHighlight =
    isEditable && isPackageInfoIncomplete(temporaryDisplayPackageInfo);

  if (
    attributionBreakpoints.has(selectedResourceId) ||
    (!!selectedAttributionId && !isSelectedAttributionVisible)
  ) {
    return null;
  }

  return (
    <MuiBox aria-label={'attribution column'} sx={classes.root}>
      <AttributionForm
        packageInfo={temporaryDisplayPackageInfo}
        showHighlight={showHighlight}
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
