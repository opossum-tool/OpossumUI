// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const NOISY_CV_THRESHOLD_PERCENT = 10;

export interface PerformanceResult {
  scenario: string;
  operation: string;
  variant: string;
  profile: string;
  seed: number;
  repeatIndex: number;
  durationMs: number;
  measuredAt: string;
  environment: Record<string, unknown>;
}

interface PerformanceSample {
  repeatIndex: number;
  durationMs: number;
}

interface PerformanceStatistics {
  meanMs: number;
  medianMs: number;
  sampleStandardDeviationMs: number | null;
  coefficientOfVariationPercent: number | null;
  minimumMs: number;
  maximumMs: number;
}

interface AggregatedPerformanceResult {
  scenario: string;
  operation: string;
  variant: string;
  profile: string;
  samples: PerformanceSample[];
  statistics: PerformanceStatistics;
  noisy: boolean | null;
}

export interface PerformanceComparisonResult {
  scenario: string;
  operation: string;
  variant: string;
  profile: string;
  baselineMeanMs: number;
  currentMeanMs: number;
  absoluteChangeMs: number;
  percentageChange: number | null;
  noisy: boolean;
}

export interface PerformanceComparison {
  baselineLabel: string;
  baselineGeneratedAt: string | null;
  compatible: boolean;
  compatibilityWarnings: string[];
  unmatchedCurrentScenarios: string[];
  unmatchedBaselineScenarios: string[];
  results: PerformanceComparisonResult[];
}

export type PerformanceTestStatus =
  'passed' | 'failed' | 'timedout' | 'interrupted';

export interface PerformanceSummary {
  generatedAt: string;
  testStatus: PerformanceTestStatus;
  expectedSampleCount: number;
  complete: boolean;
  validForBaseline: boolean;
  validationErrors: string[];
  environment: Record<string, unknown> | null;
  seed: number | null;
  results: AggregatedPerformanceResult[];
  comparisons: PerformanceComparison[];
}

function getKey(
  result: Pick<
    PerformanceResult,
    'profile' | 'scenario' | 'operation' | 'variant'
  >,
): string {
  return [
    result.profile,
    result.scenario,
    result.operation,
    result.variant,
  ].join('\u0000');
}

export function findPerformanceComparisonResult(
  comparison: PerformanceComparison,
  result: PerformanceResult | AggregatedPerformanceResult,
): PerformanceComparisonResult | undefined {
  const key = getKey(result);
  return comparison.results.find(
    (comparisonResult) => getKey(comparisonResult) === key,
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function statistics(samples: PerformanceSample[]): PerformanceStatistics {
  const values = samples.map(({ durationMs }) => durationMs);
  const meanMs = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sampleStandardDeviationMs =
    values.length < 2
      ? null
      : Math.sqrt(
          values.reduce((sum, value) => sum + (value - meanMs) ** 2, 0) /
            (values.length - 1),
        );
  const coefficientOfVariationPercent =
    sampleStandardDeviationMs === null || meanMs === 0
      ? null
      : (sampleStandardDeviationMs / meanMs) * 100;

  return {
    meanMs,
    medianMs: median(values),
    sampleStandardDeviationMs,
    coefficientOfVariationPercent,
    minimumMs: Math.min(...values),
    maximumMs: Math.max(...values),
  };
}

function assertResult(value: unknown): asserts value is PerformanceResult {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Performance result must be an object.');
  }
  const result = value as Record<string, unknown>;
  const stringFields = [
    'scenario',
    'operation',
    'variant',
    'profile',
    'measuredAt',
  ];
  if (
    stringFields.some(
      (field) => typeof result[field] !== 'string' || result[field] === '',
    )
  ) {
    throw new Error('Performance result has missing identity metadata.');
  }
  if (
    typeof result.seed !== 'number' ||
    !Number.isFinite(result.seed) ||
    typeof result.repeatIndex !== 'number' ||
    !Number.isInteger(result.repeatIndex) ||
    result.repeatIndex < 0 ||
    typeof result.durationMs !== 'number' ||
    !Number.isFinite(result.durationMs) ||
    result.durationMs < 0 ||
    typeof result.environment !== 'object' ||
    result.environment === null
  ) {
    throw new Error('Performance result has invalid metadata or duration.');
  }
}

function sameMetadata(
  left: PerformanceResult,
  right: PerformanceResult,
): boolean {
  return (
    left.seed === right.seed &&
    JSON.stringify(left.environment) === JSON.stringify(right.environment)
  );
}

function aggregateSamples(
  group: PerformanceResult[],
): AggregatedPerformanceResult {
  const first = group[0];
  const samples = group
    .sort((left, right) => left.repeatIndex - right.repeatIndex)
    .map(({ repeatIndex, durationMs }) => ({ repeatIndex, durationMs }));
  const summaryStatistics = statistics(samples);
  return {
    scenario: first.scenario,
    operation: first.operation,
    variant: first.variant,
    profile: first.profile,
    samples,
    statistics: summaryStatistics,
    noisy:
      summaryStatistics.coefficientOfVariationPercent === null
        ? null
        : summaryStatistics.coefficientOfVariationPercent >
          NOISY_CV_THRESHOLD_PERCENT,
  };
}

export function aggregatePerformanceResults(
  input: unknown[],
  expectedSampleCount: number,
  testStatus: PerformanceTestStatus = 'passed',
): PerformanceSummary {
  if (!Number.isInteger(expectedSampleCount) || expectedSampleCount < 1) {
    throw new Error('Expected sample count must be a positive integer.');
  }

  const validationErrors: string[] = [];
  const results: PerformanceResult[] = [];
  for (const value of input) {
    try {
      assertResult(value);
      results.push(value);
    } catch (error) {
      validationErrors.push(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const groups = new Map<string, PerformanceResult[]>();
  for (const result of results) {
    const key = getKey(result);
    const group = groups.get(key) ?? [];
    group.push(result);
    groups.set(key, group);
  }

  const firstResult = results[0];
  const metadataConsistent =
    firstResult === undefined ||
    results.every((result) => sameMetadata(result, firstResult));
  if (!metadataConsistent) {
    validationErrors.push(
      'Performance results have inconsistent run metadata.',
    );
  }
  const environment = metadataConsistent
    ? (firstResult?.environment ?? null)
    : null;
  const seed = metadataConsistent ? (firstResult?.seed ?? null) : null;

  const repeatKeys = new Map<number, Set<string>>();
  for (const result of results) {
    const key = getKey(result);
    const keys = repeatKeys.get(result.repeatIndex) ?? new Set<string>();
    if (keys.has(key)) {
      validationErrors.push(
        `Scenario ${result.scenario} has a duplicate repeat index ${result.repeatIndex}.`,
      );
    }
    keys.add(key);
    repeatKeys.set(result.repeatIndex, keys);
  }

  const expectedIndexes = Array.from(
    { length: expectedSampleCount },
    (_, index) => index,
  );
  const expectedKeySet = new Set(groups.keys());
  for (const repeatIndex of expectedIndexes) {
    const keys = repeatKeys.get(repeatIndex);
    if (!keys) {
      validationErrors.push(`Missing repeat index ${repeatIndex}.`);
      continue;
    }
    if (
      keys.size !== expectedKeySet.size ||
      [...expectedKeySet].some((key) => !keys.has(key))
    ) {
      validationErrors.push(
        `Repeat index ${repeatIndex} does not contain the complete scenario set.`,
      );
    }
  }
  for (const [key, group] of groups) {
    if (group.length !== expectedSampleCount) {
      validationErrors.push(
        `Scenario ${key.split('\u0000')[1]} has ${group.length} samples; expected ${expectedSampleCount}.`,
      );
    }
  }

  const complete = validationErrors.length === 0 && groups.size > 0;
  return {
    generatedAt: new Date().toISOString(),
    testStatus,
    expectedSampleCount,
    complete,
    validForBaseline: complete && testStatus === 'passed',
    validationErrors: [...new Set(validationErrors)],
    environment,
    seed,
    results: [...groups.values()]
      .filter((group) => group.length > 0)
      .map(aggregateSamples)
      .sort((left, right) => left.scenario.localeCompare(right.scenario)),
    comparisons: [],
  };
}

export function comparePerformanceSummaries(
  current: PerformanceSummary,
  baseline: PerformanceSummary,
  baselineLabel = 'Baseline',
): PerformanceComparison {
  const compatibilityWarnings: string[] = [];
  if (!baseline.validForBaseline) {
    compatibilityWarnings.push('The baseline is not valid for comparison.');
  }
  if (current.expectedSampleCount !== baseline.expectedSampleCount) {
    compatibilityWarnings.push(
      `Sample count changed from ${baseline.expectedSampleCount} to ${current.expectedSampleCount}.`,
    );
  }
  if (current.seed !== baseline.seed) {
    compatibilityWarnings.push(
      `Synthetic-file seed changed from ${String(baseline.seed)} to ${String(current.seed)}.`,
    );
  }
  if (
    JSON.stringify(current.environment) !== JSON.stringify(baseline.environment)
  ) {
    compatibilityWarnings.push('Run environment changed.');
  }

  const currentByKey = new Map(
    current.results.map((result) => [getKey(result), result]),
  );
  const baselineByKey = new Map(
    baseline.results.map((result) => [getKey(result), result]),
  );
  const unmatchedCurrentScenarios = current.results
    .filter((result) => !baselineByKey.has(getKey(result)))
    .map(({ scenario }) => scenario)
    .sort();
  const unmatchedBaselineScenarios = baseline.results
    .filter((result) => !currentByKey.has(getKey(result)))
    .map(({ scenario }) => scenario)
    .sort();
  if (
    unmatchedCurrentScenarios.length > 0 ||
    unmatchedBaselineScenarios.length > 0
  ) {
    compatibilityWarnings.push('Benchmark scenario definitions changed.');
  }

  const results: PerformanceComparisonResult[] = [];
  for (const baselineResult of baseline.results) {
    const currentResult = currentByKey.get(getKey(baselineResult));
    if (currentResult === undefined) {
      continue;
    }
    const baselineMeanMs = baselineResult.statistics.meanMs;
    const currentMeanMs = currentResult.statistics.meanMs;
    const absoluteChangeMs = currentMeanMs - baselineMeanMs;
    results.push({
      scenario: currentResult.scenario,
      operation: currentResult.operation,
      variant: currentResult.variant,
      profile: currentResult.profile,
      baselineMeanMs,
      currentMeanMs,
      absoluteChangeMs,
      percentageChange:
        baselineMeanMs === 0 ? null : (absoluteChangeMs / baselineMeanMs) * 100,
      noisy: currentResult.noisy === true || baselineResult.noisy === true,
    });
  }

  return {
    baselineLabel,
    baselineGeneratedAt: baseline.generatedAt,
    compatible: compatibilityWarnings.length === 0,
    compatibilityWarnings,
    unmatchedCurrentScenarios,
    unmatchedBaselineScenarios,
    results: results.sort((left, right) =>
      left.scenario.localeCompare(right.scenario),
    ),
  };
}

function formatStatistic(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

export function renderPerformanceMarkdown(summary: PerformanceSummary): string {
  const environment =
    summary.environment === null
      ? '—'
      : `\n\n\`\`\`json\n${JSON.stringify(summary.environment, null, 2)}\n\`\`\``;
  const lines = [
    `## Performance results (${summary.expectedSampleCount} samples)`,
    '',
    `- Test status: **${summary.testStatus}**`,
    `- Complete: **${summary.complete ? 'yes' : 'no'}**`,
    `- Valid for baseline: **${summary.validForBaseline ? 'yes' : 'no'}**`,
    `- Seed: **${summary.seed === null ? '—' : summary.seed}**`,
    `- Environment: ${environment}`,
    '',
  ];
  if (summary.comparisons.length > 0) {
    lines.push('### Baseline comparisons', '');
    for (const comparison of summary.comparisons) {
      lines.push(
        `- ${comparison.baselineLabel}: compatible **${comparison.compatible ? 'yes' : 'no'}**; generated **${comparison.baselineGeneratedAt ?? 'unavailable'}**`,
      );
    }
    lines.push('');
  }
  const comparisonHeaders = summary.comparisons.map(
    ({ baselineLabel }) => `${baselineLabel} (mean / change)`,
  );
  const headers = [
    'Scenario',
    'Mean (ms)',
    'Median (ms)',
    'CV',
    'Min (ms)',
    'Max (ms)',
    ...comparisonHeaders,
  ];
  lines.push(
    `| ${headers.join(' | ')} |`,
    `| ${headers.map((_, index) => (index === 0 ? '---' : '---:')).join(' | ')} |`,
  );
  for (const result of summary.results) {
    const stats = result.statistics;
    const cv = formatStatistic(stats.coefficientOfVariationPercent);
    const cvSuffix = result.noisy === null ? '' : '%';
    const noisySuffix = result.noisy === true ? ' (noisy)' : '';
    const comparisonCells = summary.comparisons.map((comparison) => {
      const comparisonResult = findPerformanceComparisonResult(
        comparison,
        result,
      );
      if (comparisonResult === undefined) {
        return '—';
      }
      const percentageChange = comparisonResult.percentageChange;
      const formattedPercentageChange =
        percentageChange === null
          ? '—'
          : `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%`;
      return `${comparisonResult.baselineMeanMs.toFixed(2)} (${formattedPercentageChange})${comparisonResult.noisy ? ' (noisy)' : ''}`;
    });
    lines.push(
      `| ${[
        result.scenario,
        formatStatistic(stats.meanMs),
        formatStatistic(stats.medianMs),
        `${cv}${cvSuffix}${noisySuffix}`,
        formatStatistic(stats.minimumMs),
        formatStatistic(stats.maximumMs),
        ...comparisonCells,
      ].join(' | ')} |`,
    );
  }
  if (summary.validationErrors.length > 0) {
    lines.push('', '### Validation errors', '');
    lines.push(...summary.validationErrors.map((error) => `- ${error}`));
  }
  if (summary.comparisons.length > 0) {
    for (const comparison of summary.comparisons) {
      const unmatchedScenarios = [
        ...comparison.unmatchedCurrentScenarios,
        ...comparison.unmatchedBaselineScenarios,
      ];
      if (
        comparison.compatibilityWarnings.length > 0 ||
        unmatchedScenarios.length > 0
      ) {
        lines.push('', `#### ${comparison.baselineLabel} warnings`, '');
        lines.push(
          ...comparison.compatibilityWarnings.map((warning) => `- ${warning}`),
        );
        if (comparison.unmatchedCurrentScenarios.length > 0) {
          lines.push(
            `- Unmatched current scenarios: ${comparison.unmatchedCurrentScenarios.join(', ')}.`,
          );
        }
        if (comparison.unmatchedBaselineScenarios.length > 0) {
          lines.push(
            `- Unmatched baseline scenarios: ${comparison.unmatchedBaselineScenarios.join(', ')}.`,
          );
        }
      }
    }
  }
  return `${lines.join('\n')}\n`;
}
