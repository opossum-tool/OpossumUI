// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ResourceTreeFilters } from '../../../../ElectronBackend/api/resourceTree';
import { backend } from '../../../util/backendClient';

export function getNodeIdsToExpand(
  nodeId: string,
  filters?: ResourceTreeFilters,
): Promise<Array<string>> {
  return backend.getNodePathsToExpand.query({
    fromNodePath: nodeId,
    ...filters,
  });
}
