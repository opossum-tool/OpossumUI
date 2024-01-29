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
import { InputElementProps } from '../InputElements/shared';
import { AuditingOptions } from './AuditingOptions';
import { CommentStack } from './CommentStack';
import { CopyrightSubPanel } from './CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel';

export const FORM_ATTRIBUTES = [
  'packageName',
  'packageVersion',
  'packageNamespace',
  'packageType',
  'url',
  'copyright',
  'licenseName',
  'licenseText',
  'firstParty',
] satisfies Array<keyof PackageInfo>;

export type FormAttribute = (typeof FORM_ATTRIBUTES)[number];

export interface AttributeConfig
  extends Pick<InputElementProps, 'color' | 'focused'> {}

export type AttributionFormConfig = Partial<
  Record<FormAttribute, AttributeConfig>
>;

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
  variant?: 'default' | 'diff';
  label?: string;
  config?: AttributionFormConfig;
}

export function AttributionForm({
  packageInfo,
  label,
  onEdit,
  showHighlight,
  variant = 'default',
  config,
}: AttributionFormProps) {
  const dispatch = useAppDispatch();
  const isDiff = variant === 'diff';

  return (
    <MuiBox sx={classes.formContainer} aria-label={label}>
      <AuditingOptions
        packageInfo={packageInfo}
        isEditable={!!onEdit}
        sx={{ flex: isDiff ? 1 : undefined }}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        config={config}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      {renderAttributionType()}
      <CopyrightSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        expanded={isDiff}
        hidden={packageInfo.firstParty}
        config={config?.copyright}
      />
      <LicenseSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        expanded={isDiff}
        hidden={packageInfo.firstParty}
        config={config}
      />
      {isDiff ? null : (
        <CommentStack packageInfo={packageInfo} onEdit={onEdit} />
      )}
    </MuiBox>
  );

  function renderAttributionType() {
    return (
      <MuiToggleButtonGroup
        value={packageInfo.firstParty || false}
        exclusive
        onChange={(_, newValue) =>
          onEdit?.(() =>
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...packageInfo,
                firstParty: newValue,
                wasPreferred: undefined,
              }),
            ),
          )
        }
        size={'small'}
        fullWidth
        disabled={!onEdit}
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
