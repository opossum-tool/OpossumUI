// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty } from 'lodash';
import { validate as isValidUUID, v4 as uuid4 } from 'uuid';

import { type PackageInfo } from '../../shared/shared-types';
import { backend } from './backendClient';
import { getStrippedPackageInfo } from './get-stripped-package-info';

async function matchOrCreateAttribution(
  resourceId: string,
  packageInfo: PackageInfo,
  ignorePreSelected: boolean,
): Promise<string> {
  const strippedPackageInfo = getStrippedPackageInfo(packageInfo);
  const matchedAttributionUuid =
    await backend.matchPackageInfoToAttribution.query({
      strippedPackageInfo,
      ignorePreSelected,
    });
  if (matchedAttributionUuid) {
    console.log('matched', strippedPackageInfo);
    await backend.linkAttribution.mutate({
      resourcePath: resourceId,
      attributionUuid: matchedAttributionUuid,
    });
    return matchedAttributionUuid;
  }
  console.log('not matched', strippedPackageInfo);
  const newAttributionUuid = uuid4();
  await backend.createAttribution.mutate({
    attributionUuid: newAttributionUuid,
    packageInfo: { ...packageInfo, id: newAttributionUuid },
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

export async function addAttributionToSelectedResource(
  resourceId: string,
  packageInfo: PackageInfo,
) {
  return matchOrCreateAttribution(resourceId, packageInfo, true);
}

export async function saveAttribution(
  attributionId: string,
  packageInfo: PackageInfo,
) {
  if (!isValidUUID(attributionId)) {
    console.error('Attribution UUID is not a valid UUID');
    return;
  }
  // If you want to save an empty attribution, delete it instead, to keep the DB clean
  const strippedPackageInfo = getStrippedPackageInfo(packageInfo);
  if (isEmpty(strippedPackageInfo)) {
    await backend.deleteAttributions.mutate({
      attributionUuids: [attributionId],
    });
  } else {
    const matchedAttributionUuid =
      await backend.matchPackageInfoToAttribution.query({
        strippedPackageInfo,
        ignorePreSelected: false,
      });
    if (matchedAttributionUuid) {
      await backend.replaceAttribution.mutate({
        attributionIdToReplace: attributionId,
        attributionIdToReplaceWith: matchedAttributionUuid,
      });
    } else {
      const { preSelected, ...cleanedPackageInfo } = packageInfo;
      await backend.updateAttributions.mutate({
        attributions: {
          [attributionId]: cleanedPackageInfo as PackageInfo,
        },
      });
    }
  }
}
