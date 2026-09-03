// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PICKER_MODE_DISABLED_OPACITY } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import type { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { AttributionTypeField } from './attribution-type-field';
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
    transition: 'opacity 150ms ease',
  },
  attributionTypeContainer: {
    position: 'relative',
  },
};

interface AttributionFormProps {
  packageInfo: PackageInfo;
  onEdit?: Confirm;
  label?: string;
  dimmed?: boolean;
}

export function AttributionForm({
  packageInfo,
  label,
  onEdit,
  dimmed,
}: AttributionFormProps) {
  const dispatch = useAppDispatch();
  const showHighlight = !!onEdit;

  return (
    <MuiBox
      data-testid={'attribution-form-wrapper'}
      sx={{
        ...classes.formContainer,
        opacity: dimmed ? PICKER_MODE_DISABLED_OPACITY : 1,
      }}
      aria-label={label}
    >
      <AuditingOptions
        packageInfo={packageInfo}
        isEditable={!!onEdit}
        onUpdate={updatePackageInfo}
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
        onUpdate={updatePackageInfo}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      {renderAttributionType()}
      <CopyrightSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        hidden={packageInfo.firstParty}
      />
      <LicenseSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        hidden={packageInfo.firstParty}
      />
      <Comment packageInfo={packageInfo} onEdit={onEdit} />
    </MuiBox>
  );

  function renderAttributionType() {
    return (
      <MuiBox sx={classes.attributionTypeContainer}>
        <AttributionTypeField
          value={packageInfo.firstParty}
          disabled={!onEdit}
          onChange={(firstParty) =>
            onEdit?.(() => {
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
                  firstParty,
                }),
              );
            })
          }
        />
      </MuiBox>
    );
  }

  function updatePackageInfo(patch: Partial<PackageInfo>) {
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        ...patch,
      }),
    );
  }
}
