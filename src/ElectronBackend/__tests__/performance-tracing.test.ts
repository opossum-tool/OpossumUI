// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { traceBackendCommand } from '../performance-tracing';

describe('traceBackendCommand', () => {
  const originalTracing = process.env.PERFORMANCE_TRACING;
  const mark = vi.spyOn(globalThis.performance, 'mark');
  const measure = vi.spyOn(globalThis.performance, 'measure');
  const clearMeasures = vi.spyOn(globalThis.performance, 'clearMeasures');

  afterEach(() => {
    mark.mockClear();
    measure.mockClear();
    clearMeasures.mockClear();
    if (originalTracing === undefined) {
      delete process.env.PERFORMANCE_TRACING;
    } else {
      process.env.PERFORMANCE_TRACING = originalTracing;
    }
  });

  it('does not mark commands when tracing is disabled', async () => {
    delete process.env.PERFORMANCE_TRACING;

    await expect(
      traceBackendCommand('query', () => Promise.resolve('result')),
    ).resolves.toBe('result');

    expect(mark).not.toHaveBeenCalled();
    expect(measure).not.toHaveBeenCalled();
    expect(clearMeasures).not.toHaveBeenCalled();
  });

  it('marks successful commands with a matching id', async () => {
    process.env.PERFORMANCE_TRACING = '1';

    await traceBackendCommand('query', () => Promise.resolve('result'));

    expect(mark).toHaveBeenCalledTimes(2);
    expect(mark.mock.calls[0]).toEqual([
      expect.stringMatching(/^opossum\.backend-command\.start\.\d+$/),
      expect.objectContaining({
        detail: { command: 'query', id: expect.any(String) },
      }),
    ]);
    expect(mark.mock.calls[1]).toEqual([
      expect.stringMatching(/^opossum\.backend-command\.end\.\d+$/),
      expect.objectContaining({
        detail: {
          command: 'query',
          id: expect.any(String),
          outcome: 'success',
        },
      }),
    ]);
    const startDetail = mark.mock.calls[0][1]?.detail as {
      id: string;
    };
    const endDetail = mark.mock.calls[1][1]?.detail as {
      id: string;
    };
    expect(startDetail.id).toBe(endDetail.id);
    expect(measure).toHaveBeenCalledWith(
      'opossum.backend-command.query',
      expect.objectContaining({
        start: mark.mock.calls[0][0],
        end: mark.mock.calls[1][0],
        detail: expect.objectContaining({ outcome: 'success' }),
      }),
    );
    expect(clearMeasures).toHaveBeenCalledWith('opossum.backend-command.query');
  });

  it('marks failed commands and rethrows the error', async () => {
    process.env.PERFORMANCE_TRACING = '1';
    const error = new Error('command failed');

    await expect(
      traceBackendCommand('mutation', () => Promise.reject(error)),
    ).rejects.toBe(error);

    expect(mark.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        detail: expect.objectContaining({ outcome: 'failure' }),
      }),
    );
    expect(measure).toHaveBeenCalledWith(
      'opossum.backend-command.mutation',
      expect.objectContaining({
        detail: expect.objectContaining({ outcome: 'failure' }),
      }),
    );
    expect(clearMeasures).toHaveBeenCalledWith(
      'opossum.backend-command.mutation',
    );
  });
});
