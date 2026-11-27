// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';
import useEventCallback from '@mui/utils/useEventCallback';

import { text } from '../../../shared/text';
import type { AttributionFormBodyProps } from './attribution-form.types';
import { AttributionTypeField } from './attribution-type-field';
import { Comment } from './Comment/Comment';
import { CopyrightSubPanel } from './CopyrightSubPanel/CopyrightSubPanel';
import { LicenseSubPanel } from './LicenseSubPanel/LicenseSubPanel';
import { PackageSubPanel } from './PackageSubPanel/PackageSubPanel';

const classes = {
  attributionTypeContainer: {
    position: 'relative',
  },
};

export function AuditAttributionFormBody({
  packageInfo,
  onUpdate,
  onEdit,
}: AttributionFormBodyProps) {
  const showHighlight = !!onEdit;
  const onAttributionTypeChange = useEventCallback((firstParty: boolean) => {
    void onEdit?.(() => onUpdate({ firstParty }));
  });

  return (
    <>
      <MuiDivider variant={'middle'}>
        <MuiTypography>
          {text.attributionColumn.packageCoordinates}
        </MuiTypography>
      </MuiDivider>
      <PackageSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        onUpdate={onUpdate}
      />
      <MuiDivider variant={'middle'}>
        <MuiTypography>{text.attributionColumn.legalInformation}</MuiTypography>
      </MuiDivider>
      <MuiBox sx={classes.attributionTypeContainer}>
        <AttributionTypeField
          value={packageInfo.firstParty}
          disabled={!onEdit}
          onChange={onAttributionTypeChange}
        />
      </MuiBox>
      <CopyrightSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        hidden={packageInfo.firstParty}
        onUpdate={onUpdate}
      />
      <LicenseSubPanel
        packageInfo={packageInfo}
        showHighlight={showHighlight}
        onEdit={onEdit}
        hidden={packageInfo.firstParty}
        onUpdate={onUpdate}
      />
      <Comment packageInfo={packageInfo} onEdit={onEdit} onUpdate={onUpdate} />
    </>
  );
}
