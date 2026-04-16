// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty, partition } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { type Attributions, type PackageInfo } from '../../shared/shared-types';
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
    await backend.linkAttribution.mutate({
      resourcePath: resourceId,
      attributionUuid: matchedAttributionUuid,
    });
    return matchedAttributionUuid;
  }
  const newAttributionUuid = uuid4();
  const { preSelected, ...cleanedPackageInfo } = packageInfo;
  await backend.createAttribution.mutate({
    attributionUuid: newAttributionUuid,
    packageInfo: { ...cleanedPackageInfo, id: newAttributionUuid },
    resourcePath: resourceId,
  });
  return newAttributionUuid;
}

async function matchOrCreateAttributions(
  resourceId: string,
  attributionsToSave: Attributions,
  ignorePreSelected: boolean,
) {
  let lastAttributionId = '';
  for (const [_, packageInfo] of Object.entries(attributionsToSave)) {
    lastAttributionId = await matchOrCreateAttribution(
      resourceId,
      packageInfo,
      ignorePreSelected,
    );
  }
  return lastAttributionId;
}

/**
 * Used when "save locally" or "confirm on selected" is selected in the confirmation popup.
 * Instead of updating the existing attributions, we unlink them from the resource and create a new one with the changes.
 * We create the attributions with matchOrCreateAttributions. This checks if similar attributions already exist and links them instead.
 * @param resourceId The resource to unlink the attribution from
 * @param attributionsToSave The attribution to save
 * @returns an attribution uuid that can be selected
 */
export async function unlinkAndCreateAttributions(
  resourceId: string,
  attributionsToSave: Attributions,
) {
  await backend.unlinkResourceFromAttributions.mutate({
    resourcePath: resourceId,
    attributionUuids: Object.keys(attributionsToSave),
  });
  const lastAttributionId = await matchOrCreateAttributions(
    resourceId,
    attributionsToSave,
    false,
  );
  window.electronAPI.saveFile();
  return lastAttributionId;
}

/**
 * Links attributions to a resource. If an attribution with matching package info already exists, it links that instead of creating a new one.
 * Used when linking signals/attributions to a resource or when saving a new attribution.
 * @param resourceId The resource to link the attributions to
 * @param attributionsToSave The attributions to link
 * @returns an attribution uuid that can be selected
 */
export async function addAttributionsToSelectedResource(
  resourceId: string,
  attributionsToSave: Attributions,
) {
  const lastAttributionId = await matchOrCreateAttributions(
    resourceId,
    attributionsToSave,
    true,
  );
  window.electronAPI.saveFile();
  return lastAttributionId;
}

export async function saveAttributions(attributionsToSave: Attributions) {
  const [entriesToDelete, nonEmptyEntries] = partition(
    Object.entries(attributionsToSave),
    ([, pkg]) => isEmpty(getStrippedPackageInfo(pkg)),
  );

  // Instead of saving empty attributions, we would rather delete them and keep the DB clean
  if (entriesToDelete.length > 0) {
    await backend.deleteAttributions.mutate({
      attributionUuids: entriesToDelete.map(([id]) => id),
    });
  }

  const matchResults = await Promise.all(
    nonEmptyEntries.map(async ([id, pkg]) => ({
      id,
      pkg,
      matchedUuid: await backend.matchPackageInfoToAttribution.query({
        strippedPackageInfo: getStrippedPackageInfo(pkg),
        ignorePreSelected: false,
      }),
    })),
  );

  const [entriesToReplace, entriesToUpdate] = partition(
    matchResults,
    (r) => r.matchedUuid,
  );

  for (const { id, matchedUuid } of entriesToReplace) {
    await backend.replaceAttribution.mutate({
      attributionIdToReplace: id,
      attributionIdToReplaceWith: matchedUuid!,
    });
  }

  if (entriesToUpdate.length > 0) {
    await backend.updateAttributions.mutate({
      attributions: Object.fromEntries(
        entriesToUpdate.map(({ id, pkg }) => {
          const { preSelected, ...pkgWithoutPreSelected } = pkg;
          return [id, pkgWithoutPreSelected];
        }),
      ),
    });
  }

  window.electronAPI.saveFile();

  const lastResult = matchResults[matchResults.length - 1];
  return lastResult?.matchedUuid ?? lastResult?.id ?? '';
}
