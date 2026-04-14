// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { v4 as uuid4 } from 'uuid';

import { type PackageInfo } from '../../shared/shared-types';
import { backend } from './backendClient';

async function matchOrCreateAttribution(
  resourceId: string,
  packageInfo: PackageInfo,
  ignorePreSelected: boolean,
): Promise<string> {
  const matchedAttributionUuid =
    await backend.matchPackageInfoToAttribution.query({
      packageInfo,
      ignorePreSelected,
    });
  if (matchedAttributionUuid) {
    await backend.linkAttribution.mutate({
      resourcePath: resourceId,
      attributionUuid: matchedAttributionUuid,
    });
    return matchedAttributionUuid;
  }
  const newAttributionUuid = uuid4();
  await backend.createAttribution.mutate({
    attributionUuid: newAttributionUuid,
    packageInfo,
    resourcePath: resourceId,
  });
  return newAttributionUuid;
}

export async function unlinkAndCreateAttribution(
  resourceId: string,
  packageInfo: PackageInfo,
) {
  const result = await backend.getResourceCountOnAttribution.query({
    attributionUuid: packageInfo.id,
  });
  if (result?.isManual && result.resourceCount > 1) {
    await backend.unlinkResourceFromAttributions.mutate({
      resourcePath: resourceId,
      attributionUuids: [packageInfo.id],
    });
    await matchOrCreateAttribution(resourceId, packageInfo, false);
  }
}

export function addAttributionToSelectedResource(
  resourceId: string,
  packageInfo: PackageInfo,
) {
  return matchOrCreateAttribution(resourceId, packageInfo, true);
}
