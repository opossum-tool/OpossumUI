// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';

import type { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { backend } from '../../../util/backendClient';
import { isPackageAttributeIncomplete } from '../../../util/input-validation';
import { TextBox } from '../../TextBox/TextBox';
import type { LicensePatch } from './LicenseSubPanelAutocomplete';

interface LicenseTextFieldProps {
  packageInfo: PackageInfo;
  onUpdate: (patch: LicensePatch) => void;
  showHighlight?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
  startIcon?: React.ReactElement | Array<React.ReactElement>;
  endIcon?: React.ReactElement | Array<React.ReactElement>;
  inputDataTestId?: string;
  sx?: React.ComponentProps<typeof TextBox>['sx'];
}

export function LicenseTextField({
  packageInfo,
  onUpdate,
  showHighlight,
  readOnly,
  disabled,
  minRows,
  maxRows,
  startIcon,
  endIcon,
  inputDataTestId,
  sx,
}: LicenseTextFieldProps) {
  const { licenseName, licenseText } = packageInfo;
  const frequentLicenseTextResult = backend.getFrequentLicenseText.useQuery(
    licenseName && !licenseText ? { licenseName } : skipToken,
  );
  const defaultLicenseText =
    licenseText || !licenseName
      ? undefined
      : (frequentLicenseTextResult.data ?? undefined);
  const isIncomplete = isPackageAttributeIncomplete('licenseText', packageInfo);

  return (
    <TextBox
      inputDataTestId={inputDataTestId}
      readOnly={readOnly}
      disabled={disabled}
      placeholder={defaultLicenseText}
      minRows={minRows}
      maxRows={maxRows}
      error={showHighlight && isIncomplete}
      multiline
      title={
        defaultLicenseText
          ? text.attributionColumn.licenseTextDefault
          : text.attributionColumn.licenseText
      }
      text={licenseText}
      handleChange={({ target: { value } }) => onUpdate({ licenseText: value })}
      showTooltip={showHighlight && isIncomplete}
      tooltipProps={
        showHighlight && isIncomplete
          ? { title: text.generic.incomplete }
          : undefined
      }
      startIcon={startIcon}
      endIcon={endIcon}
      sx={sx}
    />
  );
}
