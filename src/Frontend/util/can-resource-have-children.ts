// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../shared/shared-types';

export function canResourceHaveChildren(
  resource: Resources | 1 | undefined,
): resource is Resources {
  return resource !== 1 && resource !== undefined;
}

export function isIdOfResourceWithChildren(resourceId: string): boolean {
  return resourceId.slice(-1) === '/';
}
