// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PackageInfo } from '../../../../shared/shared-types';

export const AUDITING_PROPERTY_NAMES = [
  'followUp',
  'needsReview',
  'excludeFromNotice',
  'preferred',
  'attributionConfidence',
] as const;

export type AuditingProperty = (typeof AUDITING_PROPERTY_NAMES)[number];

export type AuditingPropertiesPatch = Partial<
  Pick<PackageInfo, AuditingProperty>
>;
