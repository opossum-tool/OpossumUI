// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MuiTypography from '@mui/material/Typography';

import { ComparableAttribute } from '../../../shared/get-comparable-attributes';
import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionType } from '../../enums/enums';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { TextBoxProps } from '../TextBox/TextBox';
import { AuditingOptions } from './AuditingOptions/AuditingOptions';
import { Comment } from './Comment/Comment';
import { CopyrightSubPanel } from './CopyrightSubPanel/CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel/LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel/PackageSubPanel';

const classes = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '12px',
    overflow: 'hidden auto',
    padding: '20px 20px 0 20px',
  },
  attributionTypeContainer: {
    position: 'relative',
  },
};

export interface AttributeConfig
  extends Pick<TextBoxProps, 'color' | 'focused' | 'endIcon'> {}

export type AttributionFormConfig = Partial<
  Record<ComparableAttribute, AttributeConfig>
>;

interface AttributionFormProps {
  packageInfo: PackageInfo;
  onEdit?: Confirm;
  variant?: 'default' | 'diff-original' | 'diff-current';
  label?: string;
  config?: AttributionFormConfig;
}

export function AttributionForm({
  packageInfo,
  label,
  onEdit,
  variant = 'default',
  config,
}: AttributionFormProps) {
  const dispatch = useAppDispatch();
  const isDiff = variant === 'diff-original' || variant === 'diff-current';
  const showHighlight = !!onEdit && isPackageInfoIncomplete(packageInfo);

  return (
    <MuiBox sx={classes.formContainer} aria-label={label}>
      {!isDiff && (
        <AuditingOptions packageInfo={packageInfo} isEditable={!!onEdit} />
      )}
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {isDiff
            ? variant === 'diff-original'
              ? text.attributionColumn.originalPackageCoordinates
              : text.attributionColumn.currentPackageCoordinates
            : text.attributionColumn.packageCoordinates}
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
        <MuiTypography>
          {isDiff
            ? variant === 'diff-original'
              ? text.attributionColumn.originalLicenseInformation
              : text.attributionColumn.currentLicenseInformation
            : text.attributionColumn.legalInformation}
        </MuiTypography>
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
            onEdit?.(() => {
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
                  firstParty: newValue,
                  wasPreferred: undefined,
                }),
              );
            })
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
