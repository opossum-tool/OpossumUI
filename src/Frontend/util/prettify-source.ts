// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionSources } from '../enums/enums';

export function prettifySource(source: string): string {
  return source in AttributionSources
    ? AttributionSources[source as keyof typeof AttributionSources]
    : source;
}
