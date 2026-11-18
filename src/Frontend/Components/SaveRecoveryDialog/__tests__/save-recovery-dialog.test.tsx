// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { attemptToLeave, closeSaveRecovery } from '../../../util/save-recovery';
import { SaveRecoveryDialog } from '../save-recovery-dialog';

const dialogName = text.saveError.heading;

afterEach(() => act(closeSaveRecovery));

async function showRecovery(
  failureMessage = 'Disk full',
  action: 'open' | 'quit' = 'open',
) {
  await renderComponent(<SaveRecoveryDialog />);
  const attempt = vi.fn().mockResolvedValueOnce({
    status: 'blocked',
    failure: {
      id: 'failed-write',
      fileName: 'project.opossum',
      message: failureMessage,
    },
  });
  await act(() => attemptToLeave(action, attempt));
  attempt.mockClear();
  const dialog = await screen.findByRole('dialog', { name: dialogName });
  return { attempt, dialog };
}

test('Escape dismisses recovery without saving or retrying the action', async () => {
  const { attempt, dialog } = await showRecovery();
  fireEvent.keyDown(dialog, { key: 'Escape' });

  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: dialogName }),
    ).not.toBeInTheDocument(),
  );
  expect(window.electronAPI.saveFile).not.toHaveBeenCalled();
  expect(attempt).not.toHaveBeenCalled();
});

test('quit recovery labels its retry action and preserves the quit-without-saving option', async () => {
  const { dialog } = await showRecovery('Disk full', 'quit');

  expect(
    within(dialog).getByRole('button', { name: text.saveError.retry }),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole('button', {
      name: text.saveError.quitWithoutSaving,
    }),
  ).toBeInTheDocument();
});

test('recovery accepts only one submission while Retry is pending', async () => {
  const { attempt, dialog } = await showRecovery();
  const pending = Promise.withResolvers<undefined>();
  vi.mocked(window.electronAPI.saveFile).mockReturnValueOnce(pending.promise);
  const retry = within(dialog).getByRole('button', {
    name: text.saveError.retry,
  });
  const continueWithoutSaving = within(dialog).getByRole('button', {
    name: text.saveError.openWithoutSaving,
  });

  fireEvent.click(retry);
  fireEvent.click(retry);
  fireEvent.click(continueWithoutSaving);
  expect(window.electronAPI.saveFile).toHaveBeenCalledOnce();
  expect(attempt).not.toHaveBeenCalled();
  expect(await within(dialog).findByRole('progressbar')).toBeInTheDocument();

  await act(() => {
    pending.resolve(undefined);
    return pending.promise;
  });
  expect(attempt).toHaveBeenCalledOnce();
});

test('three immediate retries update the reason and acknowledge the newest failure', async () => {
  const repeatedError = `Disk full: ${'read-only-project-file-'.repeat(8)}`;
  const { attempt, dialog } = await showRecovery(repeatedError);
  vi.mocked(window.electronAPI.saveFile)
    .mockResolvedValueOnce({
      id: 'retry-failure-1',
      fileName: 'project.opossum',
      message: repeatedError,
    })
    .mockResolvedValueOnce({
      id: 'retry-failure-2',
      fileName: 'project.opossum',
      message: repeatedError,
    })
    .mockResolvedValueOnce({
      id: 'retry-failure-3',
      fileName: 'project.opossum',
      message: repeatedError,
    });
  const retry = within(dialog).getByRole('button', {
    name: text.saveError.retry,
  });
  const stay = within(dialog).getByRole('button', {
    name: text.saveError.stay,
  });
  const continueWithoutSaving = within(dialog).getByRole('button', {
    name: text.saveError.openWithoutSaving,
  });
  expect(retry).toHaveClass('MuiButton-contained', 'MuiButton-colorPrimary');
  expect(stay).toHaveClass('MuiButton-contained', 'MuiButton-colorSecondary');
  expect(continueWithoutSaving).toHaveClass(
    'MuiButton-outlined',
    'MuiButton-colorError',
  );
  let previousReason = within(dialog).getByText(repeatedError);
  for (const retryId of [
    'retry-failure-1',
    'retry-failure-2',
    'retry-failure-3',
  ]) {
    fireEvent.click(retry);
    await waitFor(() => expect(retry).toBeEnabled());
    const latestReason = await within(dialog).findByText(repeatedError, {
      selector: `[data-failure-id="${retryId}"]`,
    });
    expect(latestReason).not.toBe(previousReason);
    expect(latestReason).toHaveAttribute('data-failure-id', retryId);
    expect(latestReason).toHaveStyle({ overflowWrap: 'anywhere' });
    expect(
      within(dialog).getByRole('button', { name: text.saveError.retry }),
    ).toBe(retry);
    const status = await waitFor(() => {
      const latestStatus = within(dialog)
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
  expect(within(dialog).queryByText('project.opossum')).not.toBeInTheDocument();
  expect(within(dialog).getByText(repeatedError)).toBeInTheDocument();
  expect(continueWithoutSaving).toBeEnabled();
  fireEvent.click(continueWithoutSaving);
  await waitFor(() => expect(attempt).toHaveBeenCalledWith('retry-failure-3'));
  expect(
    screen.queryByRole('dialog', { name: dialogName }),
  ).not.toBeInTheDocument();
});
