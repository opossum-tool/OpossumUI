// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackagePanelTitle } from '../enums/enums';

export function createPackageCardId(
  panelTitle: PackagePanelTitle,
  index: number,
): string {
  return `${panelTitle}-${index}`;
}
