// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PathPredicate } from '../types/types';

export function removeTrailingSlashIfFileWithChildren(
  path: string,
  isFileWithChildren: PathPredicate,
): string {
  return isFileWithChildren(path) ? path.replace(/\/$/, '') : path;
}
