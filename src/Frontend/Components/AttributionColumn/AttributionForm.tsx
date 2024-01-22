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

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionType } from '../../enums/enums';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { AuditingOptions } from './AuditingOptions';
import { CommentStack } from './CommentStack';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel';

const classes = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '6px',
    gap: '12px',
    overflow: 'hidden auto',
  },
};

interface AttributionFormProps {
  packageInfo: DisplayPackageInfo;
  isEditable: boolean;
  showHighlight?: boolean;
  confirmEditWasPreferred?: Confirm;
}

export function AttributionForm(props: AttributionFormProps): ReactElement {
  const dispatch = useAppDispatch();

  return (
    <MuiBox sx={classes.formContainer}>
      <AuditingOptions
        packageInfo={props.packageInfo}
        isEditable={props.isEditable}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        displayPackageInfo={props.packageInfo}
        isEditable={props.isEditable}
        showHighlight={props.showHighlight}
        confirmEditWasPreferred={props.confirmEditWasPreferred}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      {renderAttributionType()}
      {props.packageInfo.firstParty ? null : (
        <>
          <CopyrightSubPanel
            isEditable={props.isEditable}
            displayPackageInfo={props.packageInfo}
            showHighlight={props.showHighlight}
            confirmEditWasPreferred={props.confirmEditWasPreferred}
          />
          <LicenseSubPanel
            displayPackageInfo={props.packageInfo}
            isEditable={props.isEditable}
            showHighlight={props.showHighlight}
            confirmEditWasPreferred={props.confirmEditWasPreferred}
          />
        </>
      )}
      <CommentStack
        isEditable={props.isEditable}
        displayPackageInfo={props.packageInfo}
        confirmEditWasPreferred={props.confirmEditWasPreferred}
      />
    </MuiBox>
  );

  function renderAttributionType() {
    return (
      <MuiToggleButtonGroup
        value={props.packageInfo.firstParty || false}
        exclusive
        onChange={(_, newValue) =>
          props.confirmEditWasPreferred?.(() =>
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...props.packageInfo,
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
}
