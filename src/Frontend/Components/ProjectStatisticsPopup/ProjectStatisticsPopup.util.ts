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

// Chart order for the AI attribution states: states that need review
// attention first. The bulk categories (non-deferred and unmodified, non-AI)
// are usually the largest share by far and the least interesting, so they go
// last.
const AI_STATE_INTEREST_ORDER = [
  'deferredUnmodified',
  'deferredModified',
  'nonDeferredUnmodified',
  'nonDeferredModified',
  'nonAi',
] as const;

export function orderAiAttributionStates<
  Name extends (typeof AI_STATE_INTEREST_ORDER)[number],
>(
  states: Array<{ name: Name; count: number }>,
): Array<{
  name: Name;
  count: number;
}> {
  return [...states].sort(
    (first, second) =>
      AI_STATE_INTEREST_ORDER.indexOf(first.name) -
      AI_STATE_INTEREST_ORDER.indexOf(second.name),
  );
}
