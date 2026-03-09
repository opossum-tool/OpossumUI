// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';

export const CRITICALITY_LABEL: Record<Criticality, string> = {
  [Criticality.High]:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
      .highlyCritical,
  [Criticality.Medium]:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
      .mediumCritical,
  [Criticality.None]:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.nonCritical,
};

export function transformName<
  NameType extends string | number | null,
  ResultType extends string,
>(
  entries: Array<{ name: NameType; count: number }>,
  transformation: (name: NameType) => ResultType,
): Array<{ name: ResultType; count: number }> {
  return entries.map((e) => ({ name: transformation(e.name), count: e.count }));
}
