// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type { SaveFailure, SaveResult } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { attemptToLeave, closeSaveRecovery } from '../../../util/save-recovery';
import { SaveRecoveryDialog } from '../../SaveRecoveryDialog/save-recovery-dialog';
import { toast } from '../../Toaster';
import { Toaster } from '../../Toaster/Toaster';
import { SaveErrorNotification } from '../save-error-notification';

const failed: SaveFailure = {
  id: 'first',
  fileName: 'project.opossum',
  message: 'Permission denied',
};
let listener: (
  event: IpcRendererEvent,
  failure: SaveFailure | undefined,
) => void;
function emit(failure?: SaveFailure) {
  act(() => listener({} as IpcRendererEvent, failure));
}
async function renderNotification() {
  return renderComponent(
    <>
      <Toaster />
      <SaveErrorNotification />
      <SaveRecoveryDialog />
    </>,
  );
}
beforeEach(() => {
  vi.mocked(window.electronAPI.on).mockImplementation((channel, callback) => {
    if (channel === AllowedFrontendChannels.SaveFailureChanged) {
      listener = callback;
    }
    return vi.fn();
  });
});

afterEach(() => act(closeSaveRecovery));

test('shows one persistent toast and updates repeated failures', async () => {
  const toastError = vi.spyOn(toast, 'error');
  await renderNotification();
  emit(failed);
  expect(await screen.findByText(text.saveError.heading)).toBeInTheDocument();
  expect(screen.getByText('Permission denied')).toBeInTheDocument();
  expect(screen.queryByText('project.opossum')).not.toBeInTheDocument();
  expect(toastError).toHaveBeenCalledWith(expect.any(Function), {
    id: 'project-save-error',
    duration: Infinity,
    style: {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
    },
  });
  emit({
    ...failed,
    id: 'second',
    message: 'Disk full',
  });
  expect(await screen.findByText('Disk full')).toBeInTheDocument();
  expect(screen.queryByText('Permission denied')).not.toBeInTheDocument();
  expect(
    screen.getAllByRole('button', { name: text.saveError.retry }),
  ).toHaveLength(1);
});

test('three immediate retries with identical errors each update and announce the reason', async () => {
  const repeatedError = `Permission denied: ${'read-only-project-file-'.repeat(8)}`;
  vi.mocked(window.electronAPI.saveFile)
    .mockResolvedValueOnce({
      status: 'failed',
      failure: {
        ...failed,
        id: 'retry-failure-1',
        message: repeatedError,
      },
    })
    .mockResolvedValueOnce({
      status: 'failed',
      failure: {
        ...failed,
        id: 'retry-failure-2',
        message: repeatedError,
      },
    })
    .mockResolvedValueOnce({
      status: 'failed',
      failure: {
        ...failed,
        id: 'retry-failure-3',
        message: repeatedError,
      },
    });
  await renderNotification();
  emit({ ...failed, message: repeatedError });
  const retry = await screen.findByRole('button', {
    name: text.saveError.retry,
  });
  let previousReason = screen.getByText(repeatedError);
  for (const retryId of [
    'retry-failure-1',
    'retry-failure-2',
    'retry-failure-3',
  ]) {
    fireEvent.click(retry);
    await waitFor(() => expect(retry).toBeEnabled());
    emit({ ...failed, id: retryId, message: repeatedError });
    const latestReason = await screen.findByText(repeatedError, {
      selector: `[data-failure-id="${retryId}"]`,
    });
    expect(latestReason).toBe(previousReason);
    expect(latestReason).toHaveAttribute('data-failure-id', retryId);
    expect(latestReason).toHaveStyle({ overflowWrap: 'anywhere' });
    expect(screen.getByRole('button', { name: text.saveError.retry })).toBe(
      retry,
    );
    const status = await waitFor(() => {
      const latestStatus = screen
        .getAllByRole('status')
        .find((element) => element.getAttribute('data-failure-id') === retryId);
      expect(latestStatus).toBeDefined();
      return latestStatus;
    });
    expect(status).toHaveAttribute('data-failure-id', retryId);
    expect(status).toHaveTextContent(
      `${text.saveError.retryFailed}: ${repeatedError}`,
    );
    previousReason = latestReason;
  }
  expect(
    screen.getAllByRole('button', { name: text.saveError.retry }),
  ).toHaveLength(1);
  expect(screen.getByText(text.saveError.heading)).toBeInTheDocument();
  expect(screen.getByText(repeatedError)).toBeInTheDocument();
  expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(3);
});

test('keeps the backend reason when a retry reply is older than the latest failure', async () => {
  const delayedRetry = Promise.withResolvers<SaveResult>();
  vi.mocked(window.electronAPI.saveFile).mockReturnValueOnce(
    delayedRetry.promise,
  );
  await renderNotification();
  emit(failed);
  fireEvent.click(
    await screen.findByRole('button', { name: text.saveError.retry }),
  );
  emit({ ...failed, id: 'newer', message: 'Disk full' });
  await act(async () => {
    delayedRetry.resolve({
      status: 'failed',
      failure: {
        ...failed,
        id: 'older-retry',
        message: 'Permission denied',
      },
    });
    await delayedRetry.promise;
  });

  expect(screen.getByText('Disk full')).toBeInTheDocument();
  expect(screen.queryByText('Permission denied')).not.toBeInTheDocument();
});

test('announces a retry failure when its matching backend event arrives later', async () => {
  vi.mocked(window.electronAPI.saveFile).mockResolvedValueOnce({
    status: 'failed',
    failure: {
      ...failed,
      id: 'retry-failure',
      message: 'Disk full',
    },
  });
  await renderNotification();
  emit(failed);
  fireEvent.click(
    await screen.findByRole('button', { name: text.saveError.retry }),
  );
  await waitFor(() => expect(window.electronAPI.saveFile).toHaveReturned());

  expect(screen.getByText('Permission denied')).toBeInTheDocument();
  expect(screen.queryByText('Disk full')).not.toBeInTheDocument();
  emit({ ...failed, id: 'retry-failure', message: 'Disk full' });
  expect(await screen.findByText('Disk full')).toBeInTheDocument();
  expect(
    screen.getByText(`${text.saveError.retryFailed}: Disk full`),
  ).toBeInTheDocument();
});

test('shows the retry spinner while saveFile is pending', async () => {
  const pending = Promise.withResolvers<SaveResult>();
  vi.mocked(window.electronAPI.saveFile).mockReturnValueOnce(pending.promise);
  await renderNotification();
  emit(failed);
  const retry = await screen.findByRole('button', {
    name: text.saveError.retry,
  });

  fireEvent.click(retry);

  expect(retry).toBeDisabled();
  expect(retry).toHaveClass('MuiButton-loading');
  expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  await act(async () => {
    pending.resolve({ status: 'saved' });
    await pending.promise;
  });
  expect(retry).toBeEnabled();
});

test('successful retry clears the persistent warning', async () => {
  vi.mocked(window.electronAPI.saveFile).mockResolvedValueOnce({
    status: 'saved',
  });
  await renderNotification();
  emit(failed);
  fireEvent.click(
    await screen.findByRole('button', { name: text.saveError.retry }),
  );
  emit();
  await waitFor(
    () =>
      expect(
        screen.queryByText(text.saveError.heading),
      ).not.toBeInTheDocument(),
    { timeout: 2000 },
  );
});

test('dismisses the toast without trying to save', async () => {
  await renderNotification();
  emit(failed);
  expect(await screen.findByText(text.saveError.heading)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: text.saveError.dismiss }));

  await waitFor(
    () =>
      expect(
        screen.queryByText(text.saveError.heading),
      ).not.toBeInTheDocument(),
    { timeout: 2000 },
  );
  expect(window.electronAPI.saveFile).not.toHaveBeenCalled();
});

test('does not repeat the quit failure after staying, but shows a new failure', async () => {
  const pending = Promise.withResolvers<{
    status: 'blocked';
    failure: SaveFailure;
  }>();
  const toastError = vi.spyOn(toast, 'error');
  await renderNotification();
  emit(failed);
  expect(await screen.findByText(text.saveError.heading)).toBeInTheDocument();

  let leaveAttempt: Promise<void> | undefined;
  act(() => {
    leaveAttempt = attemptToLeave('quit', () => pending.promise);
  });
  const duplicateAttempt = vi.fn().mockResolvedValue({ status: 'completed' });
  await act(() => attemptToLeave('open', duplicateAttempt));
  expect(duplicateAttempt).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.queryByText(text.saveError.heading)).not.toBeInTheDocument(),
  );
  toastError.mockClear();
  const failureDuringQuit = { ...failed, id: 'failure-during-quit' };
  emit(failureDuringQuit);
  expect(screen.queryByText(text.saveError.heading)).not.toBeInTheDocument();

  await act(async () => {
    pending.resolve({ status: 'blocked', failure: failureDuringQuit });
    await leaveAttempt;
  });
  expect(toastError).not.toHaveBeenCalled();

  expect(
    screen.getByRole('dialog', { name: text.saveError.heading }),
  ).toBeVisible();
  expect(screen.getAllByText(text.saveError.heading)).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: text.saveError.stay }));
  expect(screen.queryByText(text.saveError.heading)).not.toBeInTheDocument();
  emit({ ...failureDuringQuit });
  expect(toastError).not.toHaveBeenCalled();

  emit({ ...failureDuringQuit, id: 'next-save-failure' });
  expect(await screen.findByText(failed.message)).toBeVisible();
  expect(toastError).toHaveBeenCalledOnce();
});

test('clears when another project is loaded', async () => {
  await renderNotification();
  emit(failed);
  expect(await screen.findByText(failed.message)).toBeInTheDocument();
  emit();
  await waitFor(
    () => expect(screen.queryByText(failed.message)).not.toBeInTheDocument(),
    { timeout: 2000 },
  );
});
