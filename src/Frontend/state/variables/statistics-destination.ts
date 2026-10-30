// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionFilters } from './use-filters';

export const STATISTICS_DESTINATION = 'statistics-destination';

export type StatisticsDestination = {
  external: boolean;
  filters: AttributionFilters;
};
