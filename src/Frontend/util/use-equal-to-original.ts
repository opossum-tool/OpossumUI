// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { areAttributionsEqual } from '../../shared/attribution-comparison';
import { type PackageInfo } from '../../shared/shared-types';
import { backend } from './backendClient';

export function useEqualToOriginal(
  packageInfo: PackageInfo,
): boolean | undefined {
  const originalAttributionId = packageInfo.originalAttributionId;

  const { data: originalAttribution } = backend.getAttributionData.useQuery(
    { attributionUuid: originalAttributionId! },
    { enabled: !!originalAttributionId },
  );

  return useMemo(() => {
    if (!originalAttributionId || !originalAttribution) {
      return undefined;
    }

    return areAttributionsEqual(packageInfo, originalAttribution);
  }, [originalAttributionId, originalAttribution, packageInfo]);
}
