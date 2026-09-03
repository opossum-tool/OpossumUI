// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';

import type { PackageInfo } from '../../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../../state/hooks';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { LicenseNameField } from './LicenseNameField';
import type { LicensePatch } from './LicenseSubPanelAutocomplete';
import { LicenseTextField } from './LicenseTextField';

interface LicenseSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  hidden?: boolean;
}

export function LicenseSubPanel({
  packageInfo,
  showHighlight,
  onEdit,
  hidden,
}: LicenseSubPanelProps) {
  const [showLicenseText, setShowLicenseText] = useState(false);
  const dispatch = useAppDispatch();
  const updateLicense = (patch: LicensePatch) =>
    onEdit?.(() =>
      dispatch(setTemporaryDisplayPackageInfo({ ...packageInfo, ...patch })),
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
        onToggleLicenseText={() => setShowLicenseText((prev) => !prev)}
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
