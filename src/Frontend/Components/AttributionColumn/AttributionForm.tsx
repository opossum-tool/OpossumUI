// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MuiTypography from '@mui/material/Typography';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionType } from '../../enums/enums';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { AuditingOptions } from './AuditingOptions';
import { Comment } from './Comment';
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
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
}

export function AttributionForm(props: AttributionFormProps) {
  const dispatch = useAppDispatch();

  return (
    <MuiBox sx={classes.formContainer}>
      <AuditingOptions
        packageInfo={props.packageInfo}
        isEditable={!!props.onEdit}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        packageInfo={props.packageInfo}
        showHighlight={props.showHighlight}
        onEdit={props.onEdit}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      {renderAttributionType()}
      {props.packageInfo.firstParty ? null : (
        <>
          <CopyrightSubPanel
            packageInfo={props.packageInfo}
            showHighlight={props.showHighlight}
            onEdit={props.onEdit}
          />
          <LicenseSubPanel
            packageInfo={props.packageInfo}
            showHighlight={props.showHighlight}
            onEdit={props.onEdit}
          />
        </>
      )}
      <Comment packageInfo={props.packageInfo} onEdit={props.onEdit} />
    </MuiBox>
  );

  function renderAttributionType() {
    return (
      <MuiToggleButtonGroup
        value={props.packageInfo.firstParty || false}
        exclusive
        onChange={(_, newValue) =>
          props.onEdit?.(() =>
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
