// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

type PerformanceDetail = Record<string, boolean | number | string | undefined>;

let phaseSequence = 0;

/**
 * Add a user-timing span around an asynchronous frontend phase. The marks are
 * intentionally cleared after the measure is created; Chromium tracing keeps
 * the measure while the renderer performance buffer stays bounded.
 */
export async function traceFrontendPhase<T>(
  name: string,
  detail: PerformanceDetail,
  execute: () => Promise<T>,
): Promise<T> {
  const id = String(phaseSequence++);
  const startMark = `opossum.frontend-phase.start.${id}`;
  const endMark = `opossum.frontend-phase.end.${id}`;
  const measureName = `opossum.frontend-phase.${name}.${id}`;
  const measureDetail = { ...detail, id };

  globalThis.performance.mark(startMark, { detail: measureDetail });
  try {
    return await execute();
  } finally {
    globalThis.performance.mark(endMark, { detail: measureDetail });
    globalThis.performance.measure(measureName, {
      start: startMark,
      end: endMark,
      detail: measureDetail,
    });
    globalThis.performance.clearMarks(startMark);
    globalThis.performance.clearMarks(endMark);
    globalThis.performance.clearMeasures(measureName);
  }
}
