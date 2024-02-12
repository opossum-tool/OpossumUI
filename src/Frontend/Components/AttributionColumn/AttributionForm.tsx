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
import { FormAttribute } from '../../util/get-comparable-attributes';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { InputElementProps } from '../InputElements/shared';
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
  attributionTypeContainer: {
    position: 'relative',
  },
};

export interface AttributeConfig
  extends Pick<InputElementProps, 'color' | 'focused' | 'endIcon'> {}

export type AttributionFormConfig = Partial<
  Record<FormAttribute, AttributeConfig>
>;

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
      {!isDiff && (
        <AuditingOptions packageInfo={packageInfo} isEditable={!!onEdit} />
      )}
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        isDiff={isDiff}
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
        hidden={isDiff ? false : packageInfo.firstParty}
        config={config?.copyright}
      />
      <LicenseSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        expanded={isDiff}
        hidden={isDiff ? false : packageInfo.firstParty}
        config={config}
      />
      <Comment
        packageInfo={packageInfo}
        onEdit={onEdit}
        expanded={isDiff}
        config={config?.comment}
      />
    </MuiBox>
  );

  function renderAttributionType() {
    return (
      <MuiBox sx={classes.attributionTypeContainer}>
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
          color={config?.firstParty?.color}
        >
          <MuiToggleButton value={false} disableRipple>
            {AttributionType.ThirdParty}
          </MuiToggleButton>
          <MuiToggleButton value={true} disableRipple>
            {AttributionType.FirstParty}
          </MuiToggleButton>
        </MuiToggleButtonGroup>
        {!config?.firstParty?.endIcon ? null : (
          <MuiBox
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {config.firstParty.endIcon}
          </MuiBox>
        )}
      </MuiBox>
    );
  }
}
