// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ImportResult, SaveFailure } from '../../../shared/shared-types';
import {
  attemptToLeave,
  closeSaveRecovery,
  getSaveRecovery,
  resumeSaveRecovery,
  shouldHideSaveWarning,
} from '../save-recovery';

const failure: SaveFailure = {
  id: 'failed-save',
  fileName: 'project.opossum',
  message: 'Disk full',
};

afterEach(closeSaveRecovery);

async function startRecovery(attempt = vi.fn<() => Promise<ImportResult>>()) {
  attempt.mockResolvedValueOnce({ status: 'blocked', failure });
  await attemptToLeave('open', attempt);
  const recovery = getSaveRecovery();
  if (!recovery) {
    throw new Error('Expected save recovery to be open');
  }
  attempt.mockClear();
  return { recovery, attempt };
}

test('resuming a completed action closes recovery', async () => {
  const { recovery, attempt } = await startRecovery();
  attempt.mockResolvedValueOnce({ status: 'completed' });

  await expect(resumeSaveRecovery(recovery, failure.id)).resolves.toEqual({
    status: 'completed',
  });

  expect(attempt).toHaveBeenCalledExactlyOnceWith(failure.id);
  expect(getSaveRecovery()).toBeUndefined();
  expect(shouldHideSaveWarning()).toBe(false);
});

test('a failed import ends save recovery without claiming the import completed', async () => {
  const attempt = vi
    .fn<() => Promise<ImportResult>>()
    .mockResolvedValueOnce({ status: 'blocked', failure });
  await attemptToLeave('import', attempt);
  const recovery = getSaveRecovery()!;
  attempt.mockResolvedValueOnce({ status: 'failed' });

  await expect(resumeSaveRecovery(recovery)).resolves.toEqual({
    status: 'failed',
  });

  expect(getSaveRecovery()).toBeUndefined();
  expect(shouldHideSaveWarning()).toBe(false);
});

test('a newly blocked action keeps recovery open with the latest failure', async () => {
  const { recovery, attempt } = await startRecovery();
  const nextFailure = {
    ...failure,
    id: 'next-save',
    message: 'Permission denied',
  };
  attempt.mockResolvedValueOnce({ status: 'blocked', failure: nextFailure });

  await expect(resumeSaveRecovery(recovery)).resolves.toEqual({
    status: 'blocked',
    failure: nextFailure,
  });

  expect(getSaveRecovery()?.failure).toBe(nextFailure);
  expect(shouldHideSaveWarning()).toBe(true);
});

test('a dismissed recovery is stale and does not retry the action', async () => {
  const { recovery, attempt } = await startRecovery();
  closeSaveRecovery();

  await expect(resumeSaveRecovery(recovery)).resolves.toEqual({
    status: 'stale',
  });

  expect(attempt).not.toHaveBeenCalled();
  expect(getSaveRecovery()).toBeUndefined();
});

test('a late blocked result cannot overwrite a newer recovery', async () => {
  const { recovery, attempt } = await startRecovery();
  const pending = Promise.withResolvers<ImportResult>();
  attempt.mockReturnValueOnce(pending.promise);
  const result = resumeSaveRecovery(recovery);
  closeSaveRecovery();
  const { recovery: newerRecovery } = await startRecovery();

  pending.resolve({ status: 'blocked', failure });

  await expect(result).resolves.toEqual({ status: 'stale' });
  expect(getSaveRecovery()).toBe(newerRecovery);
});

test('a late completed result cannot clear a newer recovery', async () => {
  const { recovery, attempt } = await startRecovery();
  const pending = Promise.withResolvers<ImportResult>();
  attempt.mockReturnValueOnce(pending.promise);
  const result = resumeSaveRecovery(recovery);
  closeSaveRecovery();
  const { recovery: newerRecovery } = await startRecovery();

  pending.resolve({ status: 'completed' });

  await expect(result).resolves.toEqual({ status: 'stale' });
  expect(getSaveRecovery()).toBe(newerRecovery);
});

test('a late rejection cannot restore a dismissed recovery phase', async () => {
  const { recovery, attempt } = await startRecovery();
  const pending = Promise.withResolvers<ImportResult>();
  attempt.mockReturnValueOnce(pending.promise);
  const result = resumeSaveRecovery(recovery);
  closeSaveRecovery();

  pending.reject(new Error('Connection lost'));

  await expect(result).rejects.toThrow('Connection lost');
  expect(getSaveRecovery()).toBeUndefined();
  expect(shouldHideSaveWarning()).toBe(false);
});
