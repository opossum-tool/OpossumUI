// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionContent } from '../../../shared/attribution-comparison';
import type { PackageInfo } from '../../../shared/shared-types';
import type { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import type { AuditingProperty } from './AuditingOptions/AuditingOptions.types';

export type PackagePatch = Partial<
  Pick<PackageInfo, keyof AttributionContent | AuditingProperty>
>;

export interface AttributionFormBodyProps {
  packageInfo: PackageInfo;
  onUpdate: (patch: PackagePatch) => void;
  onEdit?: Confirm;
}
