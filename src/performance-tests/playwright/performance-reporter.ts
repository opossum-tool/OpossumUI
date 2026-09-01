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
  type PerformanceResult,
  renderPerformanceMarkdown,
} from './performance-results';

const RESULT_ATTACHMENT_PREFIX = 'performance-result.';
const TERMINAL_COLUMN_GAP = 2;
const TERMINAL_MEAN_WIDTH = 10;
const TERMINAL_CV_WIDTH = 12;

function printTerminalSummary(
  summary: ReturnType<typeof aggregatePerformanceResults>,
): void {
  console.log(`\nPerformance results (${summary.expectedSampleCount} samples)`);
  console.log(
    `Status: ${summary.testStatus} | Complete: ${summary.complete ? 'yes' : 'no'} | Valid for baseline: ${summary.validForBaseline ? 'yes' : 'no'}`,
  );
  const scenarioWidth = Math.max(
    'Scenario'.length,
    ...summary.results.map(({ scenario }) => scenario.length),
  );
  const gap = ' '.repeat(TERMINAL_COLUMN_GAP);
  const header = [
    'Scenario'.padEnd(scenarioWidth),
    'Mean'.padStart(TERMINAL_MEAN_WIDTH),
    'CV'.padStart(TERMINAL_CV_WIDTH),
  ].join(gap);
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const { scenario, statistics, noisy } of summary.results) {
    const cv =
      statistics.coefficientOfVariationPercent === null
        ? 'n/a'
        : `${statistics.coefficientOfVariationPercent.toFixed(2)}%`;
    const noisySuffix = noisy === true ? ' !' : '';
    console.log(
      [
        scenario.padEnd(scenarioWidth),
        `${statistics.meanMs.toFixed(2)} ms`.padStart(TERMINAL_MEAN_WIDTH),
        `${cv}${noisySuffix}`.padStart(TERMINAL_CV_WIDTH),
      ].join(gap),
    );
  }
  if (summary.validationErrors.length > 0) {
    console.error('Validation errors:');
    for (const error of summary.validationErrors) {
      console.error(`- ${error}`);
    }
  }
}

export default class PerformanceReporter implements Reporter {
  private readonly measurements: unknown[] = [];
  private expectedSampleCount = 1;
  private outputDir = process.cwd();
  private testsExecuted = 0;

  onBegin(config: FullConfig): void {
    this.outputDir = config.projects[0]?.outputDir ?? process.cwd();
    this.expectedSampleCount = config.projects[0]?.repeatEach ?? 1;
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
    let markdown: string;
    try {
      const summary = aggregatePerformanceResults(
        this.measurements,
        this.expectedSampleCount,
        result.status,
      );
      summaryIncomplete = !summary.complete;
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
