// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const TRACE_ENABLED = '1';
let commandSequence = 0;

function mark(name: string, detail: Record<string, string>): void {
  globalThis.performance.mark(name, { detail });
}

function finishCommand(
  command: string,
  id: string,
  startMark: string,
  outcome: 'success' | 'failure',
): void {
  const endMark = `opossum.backend-command.end.${id}`;
  const detail = { command, id, outcome };
  mark(endMark, detail);
  const measureName = `opossum.backend-command.${command}`;
  globalThis.performance.measure(measureName, {
    start: startMark,
    end: endMark,
    detail,
  });
  globalThis.performance.clearMeasures(measureName);
  globalThis.performance.clearMarks(startMark);
  globalThis.performance.clearMarks(endMark);
}

/** Add renderer user-timing events around a frontend-to-database command. */
export async function traceBackendCommand<T>(
  command: string,
  execute: () => Promise<T>,
): Promise<T> {
  if (process.env.PERFORMANCE_TRACING !== TRACE_ENABLED) {
    return execute();
  }

  const id = String(commandSequence++);
  const detail = { command, id };
  const startMark = `opossum.backend-command.start.${id}`;
  mark(startMark, detail);
  try {
    const result = await execute();
    finishCommand(command, id, startMark, 'success');
    return result;
  } catch (error) {
    finishCommand(command, id, startMark, 'failure');
    throw error;
  }
}
