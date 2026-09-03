// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { styled } from '@mui/system';

import type { PackageInfo } from '../../../../shared/shared-types';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import type { PackagePatch } from '../attribution-form.types';
import { attributionColumnClasses } from '../AttributionForm.style';
import {
  PACKAGE_FIELD_METADATA,
  PackageAutocomplete,
} from '../PackageAutocomplete/PackageAutocomplete';
import {
  PurlField,
  urlActions,
  usePackageFieldDefaults,
} from './PackageFields';

const DisplayRow = styled('div')({ display: 'flex', gap: '8px' });

interface PackageSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  onUpdate: (patch: PackagePatch) => void;
}

export function PackageSubPanel({
  packageInfo,
  showHighlight,
  onEdit,
  onUpdate,
}: PackageSubPanelProps) {
  const defaults = usePackageFieldDefaults(packageInfo, !onEdit);
  const editable = !!onEdit;
  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      <DisplayRow>
        <PackageAutocomplete
          attribute="packageName"
          title={PACKAGE_FIELD_METADATA.packageName.label}
          packageInfo={packageInfo}
          defaults={defaults.packageName}
          onUpdate={onUpdate}
          onEdit={onEdit}
          readOnly={!editable}
          showHighlight={showHighlight}
        />
        <PackageAutocomplete
          attribute="packageNamespace"
          title={PACKAGE_FIELD_METADATA.packageNamespace.label}
          packageInfo={packageInfo}
          defaults={defaults.packageNamespace}
          onUpdate={onUpdate}
          onEdit={onEdit}
          readOnly={!editable}
          showHighlight={showHighlight}
        />
      </DisplayRow>
      <DisplayRow>
        <PackageAutocomplete
          attribute="packageVersion"
          title={PACKAGE_FIELD_METADATA.packageVersion.label}
          packageInfo={packageInfo}
          defaults={defaults.packageVersion}
          onUpdate={onUpdate}
          onEdit={onEdit}
          readOnly={!editable}
          showHighlight={showHighlight}
        />
        <PackageAutocomplete
          attribute="packageType"
          title={PACKAGE_FIELD_METADATA.packageType.label}
          packageInfo={packageInfo}
          defaults={defaults.packageType}
          onUpdate={onUpdate}
          onEdit={onEdit}
          readOnly={!editable}
          showHighlight={showHighlight}
        />
      </DisplayRow>
      <PurlField
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        readOnly={!editable}
      />
      <PackageAutocomplete
        attribute="url"
        title={PACKAGE_FIELD_METADATA.url.label}
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        onEdit={onEdit}
        readOnly={!editable}
        showHighlight={showHighlight}
        endAdornment={urlActions({
          packageInfo,
          onUpdate,
          onEdit,
          editable,
        })}
      />
    </MuiBox>
  );
}
