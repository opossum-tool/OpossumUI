// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  aggregatePerformanceResults,
  comparePerformanceSummaries,
  type PerformanceResult,
  type PerformanceSummary,
  renderPerformanceMarkdown,
} from './performance-results';

const RESULT_ATTACHMENT_PREFIX = 'performance-result.';
const TERMINAL_COLUMN_GAP = 2;
const PERFORMANCE_RUNS_DIRECTORY = 'runs';
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function printTerminalSummary(
  summary: ReturnType<typeof aggregatePerformanceResults>,
): void {
  console.log(`\nPerformance results (${summary.expectedSampleCount} samples)`);
  console.log(
    `Status: ${summary.testStatus} | Complete: ${summary.complete ? 'yes' : 'no'} | Valid for baseline: ${summary.validForBaseline ? 'yes' : 'no'}`,
  );
  const comparison = summary.comparison ?? undefined;
  const comparisonByKey = new Map(
    (comparison?.results ?? []).map((result) => [
      `${result.profile}\u0000${result.scenario}\u0000${result.operation}\u0000${result.variant}`,
      result,
    ]),
  );
  const hasComparison = comparison !== undefined;
  const headers = hasComparison
    ? [
        'Scenario',
        'Baseline (ms)',
        'Mean (ms)',
        'Change (ms)',
        'Change (%)',
        'Min (ms)',
        'Max (ms)',
        'CV',
      ]
    : ['Scenario', 'Mean (ms)', 'Min (ms)', 'Max (ms)', 'CV'];
  const rows = summary.results.map((result) => {
    const cv =
      result.statistics.coefficientOfVariationPercent === null
        ? 'n/a'
        : `${result.statistics.coefficientOfVariationPercent.toFixed(2)}%${result.noisy === true ? ' !' : ''}`;
    const comparisonResult = comparisonByKey.get(
      `${result.profile}\u0000${result.scenario}\u0000${result.operation}\u0000${result.variant}`,
    );
    if (!hasComparison) {
      return [
        result.scenario,
        result.statistics.meanMs.toFixed(2),
        result.statistics.minimumMs.toFixed(2),
        result.statistics.maximumMs.toFixed(2),
        cv,
      ];
    }
    return [
      result.scenario,
      comparisonResult?.baselineMeanMs.toFixed(2) ?? '—',
      result.statistics.meanMs.toFixed(2),
      comparisonResult === undefined
        ? '—'
        : `${comparisonResult.absoluteChangeMs >= 0 ? '+' : ''}${comparisonResult.absoluteChangeMs.toFixed(2)}`,
      comparisonResult?.percentageChange === undefined ||
      comparisonResult.percentageChange === null
        ? '—'
        : `${comparisonResult.percentageChange >= 0 ? '+' : ''}${comparisonResult.percentageChange.toFixed(2)}%${comparisonResult.noisy ? ' !' : ''}`,
      result.statistics.minimumMs.toFixed(2),
      result.statistics.maximumMs.toFixed(2),
      cv,
    ];
  });
  const columnWidths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const gap = ' '.repeat(TERMINAL_COLUMN_GAP);
  const formatRow = (row: string[]) =>
    row
      .map((cell, index) =>
        index === 0
          ? cell.padEnd(columnWidths[index])
          : cell.padStart(columnWidths[index]),
      )
      .join(gap);
  const header = formatRow(headers);
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const row of rows) {
    console.log(formatRow(row));
  }
  if (summary.validationErrors.length > 0) {
    console.error('Validation errors:');
    for (const error of summary.validationErrors) {
      console.error(`- ${error}`);
    }
  }
  if (comparison !== undefined) {
    console.log(
      `Baseline comparison: ${comparison.compatible ? 'compatible' : 'incompatible'}`,
    );
    if (comparison.results.some(({ noisy }) => noisy)) {
      console.log(
        '! noisy: current or baseline CV is above the noise threshold',
      );
    }
    for (const warning of comparison.compatibilityWarnings) {
      console.error(`Baseline compatibility warning: ${warning}`);
    }
    if (comparison.unmatchedCurrentScenarios.length > 0) {
      console.log(
        `Unmatched current scenarios: ${comparison.unmatchedCurrentScenarios.join(', ')}.`,
      );
    }
    if (comparison.unmatchedBaselineScenarios.length > 0) {
      console.log(
        `Unmatched baseline scenarios: ${comparison.unmatchedBaselineScenarios.join(', ')}.`,
      );
    }
  }
}

function isBaselineSummary(value: unknown): value is PerformanceSummary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const summary = value as Record<string, unknown>;
  if (
    typeof summary.generatedAt !== 'string' ||
    typeof summary.testStatus !== 'string' ||
    typeof summary.expectedSampleCount !== 'number' ||
    typeof summary.complete !== 'boolean' ||
    typeof summary.validForBaseline !== 'boolean' ||
    !Array.isArray(summary.results)
  ) {
    return false;
  }
  return summary.results.every((value) => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const result = value as Record<string, unknown>;
    const statistics = result.statistics;
    return (
      typeof result.scenario === 'string' &&
      typeof result.operation === 'string' &&
      typeof result.variant === 'string' &&
      typeof result.profile === 'string' &&
      typeof statistics === 'object' &&
      statistics !== null &&
      typeof (statistics as Record<string, unknown>).meanMs === 'number'
    );
  });
}

async function readBaselineSummary(
  baselinePath: string,
): Promise<PerformanceSummary> {
  const parsed: unknown = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
  if (!isBaselineSummary(parsed)) {
    throw new Error('Baseline file is not a valid performance summary.');
  }
  return parsed;
}

export default class PerformanceReporter implements Reporter {
  private readonly measurements: unknown[] = [];
  private expectedSampleCount = 1;
  private outputDir = process.cwd();
  private historyDir: string | null = null;
  private runIdError: string | null = null;
  private testsExecuted = 0;

  onBegin(config: FullConfig): void {
    this.outputDir = config.projects[0]?.outputDir ?? process.cwd();
    this.expectedSampleCount = config.projects[0]?.repeatEach ?? 1;

    const configuredRunId = process.env.PERFORMANCE_RUN_ID;
    const runId =
      configuredRunId ??
      `${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}-${(process.env.PERFORMANCE_PROFILE ?? 'small').replace(/[^A-Za-z0-9._-]/g, '-')}-${process.pid}`;
    if (!RUN_ID_PATTERN.test(runId)) {
      this.runIdError =
        'PERFORMANCE_RUN_ID must contain only letters, numbers, dots, underscores, and hyphens.';
      return;
    }
    this.historyDir = path.join(
      path.dirname(this.outputDir),
      PERFORMANCE_RUNS_DIRECTORY,
      runId,
    );
  }

  async onTestEnd(_test: TestCase, result: TestResult): Promise<void> {
    this.testsExecuted += 1;
    const measurements: unknown[] = [];
    for (const attachment of result.attachments) {
      if (!attachment.name.startsWith(RESULT_ATTACHMENT_PREFIX)) {
        continue;
      }
      try {
        const content =
          attachment.body ??
          (attachment.path ? await fs.readFile(attachment.path) : undefined);
        if (content === undefined) {
          throw new Error(
            `Performance attachment ${attachment.name} has no content.`,
          );
        }
        measurements.push(
          JSON.parse(content.toString('utf8')) as PerformanceResult,
        );
      } catch {
        measurements.push(null);
      }
    }
    this.measurements.push(...measurements);
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] }> {
    let outputFailed = false;
    let summaryIncomplete = false;
    let summary: PerformanceSummary | undefined;
    let markdown: string;
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      outputFailed = true;
      console.error(
        `Unable to create performance output directory: ${String(error)}`,
      );
    }
    try {
      summary = aggregatePerformanceResults(
        this.measurements,
        this.expectedSampleCount,
        result.status,
      );
      summaryIncomplete = !summary.complete;
      if (this.runIdError !== null) {
        summary.validationErrors.push(this.runIdError);
        summary.validForBaseline = false;
        outputFailed = true;
      }
      const baselinePath = process.env.PERFORMANCE_BASELINE_PATH;
      if (baselinePath) {
        try {
          const baseline = await readBaselineSummary(baselinePath);
          summary.comparison = comparePerformanceSummaries(summary, baseline);
        } catch (error) {
          outputFailed = true;
          summary.comparison = {
            baselineGeneratedAt: null,
            compatible: false,
            compatibilityWarnings: [
              `Unable to read baseline: ${error instanceof Error ? error.message : String(error)}`,
            ],
            unmatchedCurrentScenarios: [],
            unmatchedBaselineScenarios: [],
            results: [],
          };
        }
      }
      markdown = renderPerformanceMarkdown(summary);
      printTerminalSummary(summary);
      try {
        await fs.writeFile(
          path.join(this.outputDir, 'performance-summary.json'),
          JSON.stringify(summary, null, 2),
        );
      } catch (error) {
        outputFailed = true;
        console.error(`Unable to write performance summary: ${String(error)}`);
      }
    } catch (error) {
      outputFailed = true;
      markdown = `## Performance aggregation failed\n\n${error instanceof Error ? error.message : String(error)}\n`;
      console.error(
        `Performance aggregation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await fs.writeFile(
        path.join(this.outputDir, 'performance-summary.md'),
        markdown,
      );
    } catch (error) {
      outputFailed = true;
      console.error(`Unable to write performance report: ${String(error)}`);
    }
    if (summary !== undefined && this.historyDir !== null) {
      try {
        await fs.mkdir(path.dirname(this.historyDir), { recursive: true });
        await fs.mkdir(this.historyDir);
        await fs.writeFile(
          path.join(this.historyDir, 'performance-summary.json'),
          JSON.stringify(summary, null, 2),
        );
        await fs.writeFile(
          path.join(this.historyDir, 'performance-summary.md'),
          markdown,
        );
      } catch (error) {
        outputFailed = true;
        console.error(`Unable to archive performance report: ${String(error)}`);
      }
    }
    const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (stepSummaryPath) {
      try {
        await fs.appendFile(stepSummaryPath, markdown);
      } catch (error) {
        outputFailed = true;
        console.error(`Unable to write GitHub step summary: ${String(error)}`);
      }
    }
    return (outputFailed || (summaryIncomplete && this.testsExecuted > 0)) &&
      result.status === 'passed'
      ? { status: 'failed' }
      : {};
  }

  printsToStdio(): boolean {
    return true;
  }
}
