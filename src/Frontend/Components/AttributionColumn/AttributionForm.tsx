// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MuiTypography from '@mui/material/Typography';
import { useMemo } from 'react';

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

export type PanelVariantProp =
  | 'default'
  | 'expanded'
  | 'expanded-invisible'
  | 'hidden';

interface AttributionFormProps {
  packageInfo: DisplayPackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  isDiffView?: boolean;
  label?: string;
}

export function AttributionForm(props: AttributionFormProps) {
  const dispatch = useAppDispatch();
  const variant = useMemo<PanelVariantProp>(() => {
    if (!!props.isDiffView && props.packageInfo.firstParty) {
      return 'expanded-invisible';
    }
    if (props.isDiffView && !props.packageInfo.firstParty) {
      return 'expanded';
    }
    if (!props.isDiffView && props.packageInfo.firstParty) {
      return 'hidden';
    }
    return 'default';
  }, [props.packageInfo.firstParty, props.isDiffView]);

  return (
    <MuiBox sx={classes.formContainer} aria-label={props.label}>
      <AuditingOptions
        packageInfo={props.packageInfo}
        isEditable={!!props.onEdit}
        sx={{ flex: props.isDiffView ? 1 : undefined }}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        displayPackageInfo={props.packageInfo}
        showHighlight={props.showHighlight}
        onEdit={props.onEdit}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      {renderAttributionType()}
      <CopyrightSubPanel
        displayPackageInfo={props.packageInfo}
        showHighlight={props.showHighlight}
        onEdit={props.onEdit}
        variant={variant}
      />
      <LicenseSubPanel
        displayPackageInfo={props.packageInfo}
        showHighlight={props.showHighlight}
        onEdit={props.onEdit}
        variant={variant}
      />
      {props.isDiffView ? null : (
        <CommentStack
          displayPackageInfo={props.packageInfo}
          onEdit={props.onEdit}
        />
      )}
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
        disabled={!props.onEdit}
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
