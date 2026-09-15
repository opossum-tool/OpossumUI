// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { FORM_ATTRIBUTES } from '../../../shared/attribution-comparison';
import type { PackageInfo } from '../../../shared/shared-types';
import type { AuditingProperty } from './AuditingOptions/AuditingOptions.types';

export type PackagePatch = Partial<
  Pick<PackageInfo, (typeof FORM_ATTRIBUTES)[number] | AuditingProperty>
>;
