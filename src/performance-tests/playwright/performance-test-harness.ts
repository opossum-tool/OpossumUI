// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ElectronApplication, Page, TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { test as baseTest } from '../../e2e-tests/utils';
import {
  getSyntheticFileProfile,
  type SyntheticFileProfile,
} from '../synthetic-file/profiles';
import { getSyntheticFilePath } from '../synthetic-file/writer';

const APP_LOAD_TIMEOUT = 180000;
const profileConfig = getSyntheticFileProfile(
  process.env.PERFORMANCE_PROFILE ?? 'small',
);
const profile = profileConfig.name;
const performanceFilePath = getSyntheticFilePath(profileConfig);

const TRACE_CONFIG = {
  included_categories: [
    'blink.user_timing',
    'devtools.timeline',
    'electron',
    'ipc',
    'node',
    'toplevel',
  ],
  recording_mode: 'record-until-full' as const,
};

type PerformanceWindow = Page & { app: ElectronApplication };

interface ArtifactMetadata {
  scenario: string;
  operation: string;
  variant: string;
  profile: string;
  seed: number;
  environment: Record<string, unknown>;
}

async function mark(window: Page, name: string): Promise<void> {
  await window.evaluate((markerName) => {
    globalThis.performance.mark(markerName);
  }, name);
}

async function measureTrace(
  window: Page,
  name: string,
  startMark: string,
  endMark: string,
): Promise<void> {
  await window.evaluate(
    ({ end, measureName, start }) => {
      globalThis.performance.measure(measureName, { start, end });
    },
    { end: endMark, measureName: name, start: startMark },
  );
}

async function getEnvironment(
  window: PerformanceWindow,
  testInfo: TestInfo,
): Promise<Record<string, unknown>> {
  const versions = await window.app.evaluate(() => ({
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  }));

  return {
    buildType:
      process.env.CI || process.env.RELEASE ? 'release' : 'development',
    platform: process.platform,
    architecture: process.arch,
    workerCount: testInfo.config.workers,
    viewport: window.viewportSize(),
    ...versions,
  };
}

async function createArtifactMetadata({
  scenario,
  operation = scenario,
  variant = 'baseline',
  testInfo,
  window,
}: {
  scenario: string;
  operation?: string;
  variant?: string;
  testInfo: TestInfo;
  window: PerformanceWindow;
}): Promise<ArtifactMetadata> {
  return {
    scenario,
    operation,
    variant,
    profile,
    seed: profileConfig.seed,
    environment: await getEnvironment(window, testInfo),
  };
}

async function writeResult({
  durationMs,
  scenario,
  testInfo,
  metadata,
}: {
  durationMs: number;
  scenario: string;
  testInfo: TestInfo;
  metadata: ArtifactMetadata;
}): Promise<void> {
  const result = {
    ...metadata,
    durationMs,
    measuredAt: new Date().toISOString(),
  };

  await fs.writeFile(
    testInfo.outputPath(`performance-result.${scenario}.json`),
    JSON.stringify(result, null, 2),
  );
  console.log(`PERFORMANCE ${scenario}: ${durationMs.toFixed(2)} ms`);
}

async function writeTraceMetadata({
  scenario,
  durationMs,
  tracePath,
  completed,
  testInfo,
  metadata,
}: {
  scenario: string;
  durationMs: number | undefined;
  tracePath: string;
  completed: boolean;
  testInfo: TestInfo;
  metadata: ArtifactMetadata;
}): Promise<void> {
  await fs.writeFile(
    testInfo.outputPath(`performance-profile.${scenario}.json`),
    JSON.stringify(
      {
        ...metadata,
        traceFile: path.basename(tracePath),
        traceConfig: TRACE_CONFIG,
        durationMs,
        completed,
        capturedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

interface PerformanceScenario {
  id: string;
  title: string;
  operation?: string;
  variant?: string;
  setup?: () => Promise<void>;
  execute: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export type RunScenario = (scenario: PerformanceScenario) => Promise<void>;

type PerformanceFixtures = {
  performanceProfile: SyntheticFileProfile;
  runFilePath: string;
  runScenario: RunScenario;
};

export const test = baseTest.extend<PerformanceFixtures>({
  performanceProfile: profileConfig,
  runFilePath: async ({ window }, provide, testInfo) => {
    if (window.startupDurationMs === null) {
      throw new Error('Startup timing was not enabled for this test.');
    }

    const metadata = await createArtifactMetadata({
      scenario: 'application-startup',
      operation: 'application-startup',
      variant: 'startup',
      testInfo,
      window,
    });
    await writeResult({
      durationMs: window.startupDurationMs,
      scenario: 'application-startup',
      testInfo,
      metadata,
    });

    const runFilePath = testInfo.outputPath(`synthetic-${profile}.opossum`);
    await fs.copyFile(performanceFilePath, runFilePath);
    await provide(runFilePath);
  },
  runScenario: async ({ window }, provide, testInfo) => {
    await provide(
      async ({ id, title, operation, variant, setup, execute, teardown }) => {
        await baseTest.step(title, async () => {
          const tracing = process.env.PERFORMANCE_TRACING === '1';
          const tracePath = testInfo.outputPath(`chrome-trace.${id}.json`);
          let completed = false;
          let durationMs: number | undefined;
          let recordingStarted = false;
          let metadata: ArtifactMetadata | undefined;
          const getMetadata = async (): Promise<ArtifactMetadata> => {
            metadata ??= await createArtifactMetadata({
              scenario: id,
              operation,
              variant,
              testInfo,
              window,
            });
            return metadata;
          };

          try {
            await setup?.();

            if (tracing) {
              await window.app.evaluate(async ({ contentTracing }, config) => {
                await contentTracing.startRecording(config);
              }, TRACE_CONFIG);
              recordingStarted = true;
              await mark(window, 'opossum.workflow.setup-complete');
              await mark(window, 'opossum.workflow.action-start');
            }
            const start = performance.now();
            await execute();
            durationMs = performance.now() - start;
            if (tracing) {
              await mark(window, 'opossum.workflow.complete');
              await measureTrace(
                window,
                `opossum.workflow.${id}`,
                'opossum.workflow.action-start',
                'opossum.workflow.complete',
              );
              completed = true;
            }
            await writeResult({
              durationMs,
              scenario: id,
              testInfo,
              metadata: await getMetadata(),
            });
          } finally {
            try {
              if (recordingStarted) {
                await window.app.evaluate(
                  async ({ contentTracing }, outputPath) => {
                    await contentTracing.stopRecording(outputPath);
                  },
                  tracePath,
                );
                await writeTraceMetadata({
                  scenario: id,
                  durationMs,
                  tracePath,
                  completed,
                  testInfo,
                  metadata: await getMetadata(),
                });
              }
            } finally {
              await teardown?.();
            }
          }
        });
      },
    );
  },
});

test.use({
  appLoadTimeout: APP_LOAD_TIMEOUT,
  measureStartup: true,
  openFromCLI: false,
  existingFilePath: performanceFilePath,
  releasePathOverride: process.env.PERFORMANCE_RELEASE_PATH ?? null,
  playwrightTracing: false,
});
