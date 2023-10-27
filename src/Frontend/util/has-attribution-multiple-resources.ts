// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsToResources } from '../../shared/shared-types';

export function hasAttributionMultipleResources(
  attributionId: string | null,
  attributionsToResources: AttributionsToResources,
): boolean {
  if (attributionId) {
    return (attributionsToResources[attributionId] || []).length > 1;
  }
  return false;
}
