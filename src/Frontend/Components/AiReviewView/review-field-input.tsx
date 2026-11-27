// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTextField from '@mui/material/TextField';

import type { PackageInfo } from '../../../shared/shared-types';
import type { PackagePatch } from '../AttributionForm/attribution-form.types';
import { LicenseSubPanelAutocomplete } from '../AttributionForm/LicenseSubPanel/LicenseSubPanelAutocomplete';
import {
  isPackageFieldKey,
  PackageAutocomplete,
  type PackageFieldAttribute,
} from '../AttributionForm/PackageAutocomplete/PackageAutocomplete';
import { usePackageFieldDefaults } from '../AttributionForm/PackageSubPanel/PackageFields';

export type ReviewFieldAttribute =
  PackageFieldAttribute | 'copyright' | 'licenseName' | 'comment';

interface Props {
  attribute: ReviewFieldAttribute;
  title: string;
  packageInfo: PackageInfo;
  id: string;
  inputRef: (element: HTMLElement | null) => void;
  onUpdate: (patch: PackagePatch) => void;
  onCommit: (patch: PackagePatch) => void;
}

export function ReviewFieldInput({ attribute, ...props }: Props) {
  const { id, inputRef, title, packageInfo, onUpdate, onCommit } = props;
  const focusProps = { id, inputRef, autoFocus: true };
  if (attribute === 'licenseName') {
    return (
      <LicenseSubPanelAutocomplete
        {...focusProps}
        licenseName={packageInfo.licenseName}
        licenseText={packageInfo.licenseText}
        onUpdate={onUpdate}
        onCommit={onCommit}
        compact
        sx={{ flexBasis: 'auto' }}
      />
    );
  }
  if (isPackageFieldKey(attribute)) {
    return <PackageFieldInput {...props} attribute={attribute} />;
  }
  return (
    <MuiTextField
      {...focusProps}
      fullWidth
      multiline
      minRows={3}
      value={packageInfo[attribute] || ''}
      onChange={(event) => onUpdate({ [attribute]: event.target.value })}
      slotProps={{ htmlInput: { 'aria-label': title } }}
    />
  );
}

function PackageFieldInput({
  attribute,
  ...props
}: Omit<Props, 'attribute'> & { attribute: PackageFieldAttribute }) {
  const defaults = usePackageFieldDefaults(props.packageInfo, false);
  return (
    <PackageAutocomplete
      {...props}
      attribute={attribute}
      defaults={defaults[attribute]}
      showHighlight={false}
      autoFocus
      compact
      sx={{ flexBasis: 'auto' }}
    />
  );
}
