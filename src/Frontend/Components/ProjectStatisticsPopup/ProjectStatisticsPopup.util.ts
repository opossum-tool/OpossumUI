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

// Chart order for the AI attribution states, most interesting first. Any
// non-AI attributions are unexpected: for AI-reviewed projects there should
// be none, and an existing one was added manually, so it comes first. Next
// the states that still need review attention (deferred). The bulk
// categories (non-deferred and unmodified) are usually the largest share by
// far and the least interesting, so they go last.
const AI_STATE_INTEREST_ORDER = [
  'nonAi',
  'deferredModified',
  'deferredUnmodified',
  'nonDeferredModified',
  'nonDeferredUnmodified',
] as const;

type AiAttributionStateName = (typeof AI_STATE_INTEREST_ORDER)[number];

export function orderAiAttributionStates(
  states: Array<{ name: AiAttributionStateName; count: number }>,
): Array<{ name: AiAttributionStateName; count: number }> {
  return [...states].sort(
    (first, second) =>
      AI_STATE_INTEREST_ORDER.indexOf(first.name) -
      AI_STATE_INTEREST_ORDER.indexOf(second.name),
  );
}
