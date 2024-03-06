// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExternalAttributionSources } from '../../shared/shared-types';

export function prettifySource(
  source: string | undefined | null,
  attributionSources: ExternalAttributionSources,
): string {
  return source ? attributionSources[source]?.name || source : '';
}
