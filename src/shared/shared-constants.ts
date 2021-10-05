// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ExternalAttributionSources } from './shared-types';

// TODO: retire this list
export const ATTRIBUTION_SOURCES: ExternalAttributionSources = {
  MERGER: { name: 'Suggested', priority: 10 },
  HHC: { name: 'High High Compute', priority: 9 },
  MS: { name: 'Metadata Scanner', priority: 8 },
  'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 7 },
  'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 6 },
  'REUSER:SC': { name: 'ScanCode (old scan)', priority: 5 },
  'REUSER:HC': { name: 'High Compute (old scan)', priority: 4 },
  SC: { name: 'ScanCode', priority: 3 },
  HC: { name: 'High Compute', priority: 2 },
  HINT: { name: 'Hint', priority: 1 },
};
