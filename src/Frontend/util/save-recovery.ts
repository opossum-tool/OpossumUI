// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { LeaveResult, SaveFailure } from '../../shared/shared-types';

type LeaveAttempt = (failureId?: string) => Promise<LeaveResult>;
type Recovery = {
  action: 'open' | 'quit' | 'import' | 'restart-and-update';
  failure: SaveFailure;
  attempt: LeaveAttempt;
};

let recovery: Recovery | undefined;
let dismissedFailureId: string | undefined;
type LeavePhase = 'idle' | 'checking' | 'awaiting-decision';

let leavePhase: LeavePhase = 'idle';
const listeners = new Set<() => void>();

function notifySubscribers(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToSaveRecovery(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSaveRecovery(): Recovery | undefined {
  return recovery;
}

export function shouldHideSaveWarning(failureId?: string): boolean {
  return (
    leavePhase !== 'idle' ||
    (failureId !== undefined && failureId === dismissedFailureId)
  );
}

export function closeSaveRecovery(): void {
  dismissedFailureId = recovery?.failure.id;
  recovery = undefined;
  leavePhase = 'idle';
  notifySubscribers();
}

export function updateSaveRecoveryFailure(
  expected: Recovery,
  failure: SaveFailure,
): void {
  if (recovery === expected) {
    recovery = { ...expected, failure };
    notifySubscribers();
  }
}

export async function attemptToLeave(
  action: Recovery['action'],
  attempt: LeaveAttempt,
  failureId?: string,
): Promise<void> {
  if (leavePhase !== 'idle') {
    return;
  }
  leavePhase = 'checking';
  notifySubscribers();
  try {
    const result = await attempt(failureId);
    if (result?.status === 'blocked') {
      recovery = { action, attempt, failure: result.failure };
      leavePhase = 'awaiting-decision';
    } else {
      recovery = undefined;
      leavePhase = 'idle';
    }
  } catch (error) {
    recovery = undefined;
    leavePhase = 'idle';
    throw error;
  } finally {
    notifySubscribers();
  }
}

export async function resumeSaveRecovery(
  expected: Recovery,
  failureId?: string,
): Promise<SaveFailure | undefined> {
  if (leavePhase !== 'awaiting-decision' || recovery !== expected) {
    return undefined;
  }
  leavePhase = 'checking';
  notifySubscribers();
  try {
    const result = await expected.attempt(failureId);
    if (result?.status === 'blocked') {
      recovery = { ...expected, failure: result.failure };
      leavePhase = 'awaiting-decision';
      return result.failure;
    }
    recovery = undefined;
    leavePhase = 'idle';
    return undefined;
  } catch (error) {
    leavePhase = 'awaiting-decision';
    throw error;
  } finally {
    notifySubscribers();
  }
}
