// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import useEventCallback from '@mui/utils/useEventCallback';
import { useState } from 'react';

import type { PackageInfo } from '../../../../shared/shared-types';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import type { PackagePatch } from '../attribution-form.types';
import { LicenseNameField } from './LicenseNameField';
import type { LicensePatch } from './LicenseSubPanelAutocomplete';
import { LicenseTextField } from './LicenseTextField';

interface LicenseSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  hidden?: boolean;
  onUpdate: (patch: PackagePatch) => void;
}

export function LicenseSubPanel({
  packageInfo,
  showHighlight,
  onEdit,
  hidden,
  onUpdate,
}: LicenseSubPanelProps) {
  const [showLicenseText, setShowLicenseText] = useState(false);
  const updateLicense = useEventCallback((patch: LicensePatch) =>
    onEdit?.(() => onUpdate(patch)),
  );
  const toggleLicenseText = useEventCallback(() =>
    setShowLicenseText((previous) => !previous),
  );

  return hidden ? null : (
    <>
      <LicenseNameField
        licenseName={packageInfo.licenseName}
        licenseText={packageInfo.licenseText}
        onUpdate={updateLicense}
        showHighlight={showHighlight}
        readOnly={!onEdit}
        forceTop={true}
        showLicenseText={showLicenseText}
        onToggleLicenseText={toggleLicenseText}
      />
      {showLicenseText && (
        <LicenseTextField
          packageInfo={packageInfo}
          onUpdate={updateLicense}
          readOnly={!onEdit}
          maxRows={8}
          minRows={3}
          showHighlight={showHighlight}
        />
      )}
    </>
  );
}
