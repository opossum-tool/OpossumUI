// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from 'node:crypto';

import type { SaveFailure, SaveResult } from '../../shared/shared-types';

const DEFAULT_AUTOSAVE_INTERVAL_MS = 60_000;
const AUTOSAVE_INTERVAL_MS = readAutosaveInterval();

function readAutosaveInterval(): number {
  const value = process.env.OPOSSUM_AUTOSAVE_INTERVAL_MS;
  if (value === undefined) {
    return DEFAULT_AUTOSAVE_INTERVAL_MS;
  }

  const interval = Number(value);
  if (Number.isInteger(interval) && interval > 0) {
    return interval;
  }

  console.error(
    `Invalid OPOSSUM_AUTOSAVE_INTERVAL_MS: ${JSON.stringify(value)}. Expected a positive integer; using ${DEFAULT_AUTOSAVE_INTERVAL_MS} ms.`,
  );
  return DEFAULT_AUTOSAVE_INTERVAL_MS;
}

/**
 * Owns the lifecycle of tracked operations and project-file saves: what
 * work is pending, in which order saves are written, and whether a save
 * failure is outstanding. Successful edits are tracked separately
 * from pending work until a save writes them.
 */
export class SaveWorker {
  private readonly writeCurrentProject: () => Promise<void>;
  /**
   * Completion promises of all currently tracked operations and saves.
   * Each promise resolves when its tracked work concludes, so waiting is
   * awaiting this set.
   */
  private readonly pending = new Set<Promise<void>>();
  /**
   * Records only ordinary saves; split, merge, and force unlock write the
   * project file as one of several steps and do not record here.
   */
  private currentFailure: SaveFailure | undefined;
  private saveTail: Promise<void> = Promise.resolve();
  private dirty = false;
  private autosaveInterval: ReturnType<typeof setInterval> | undefined;
  private readonly getFileName: () => string;
  private readonly onFailureChanged?: (
    failure: SaveFailure | undefined,
  ) => void;

  constructor(options: {
    writeCurrentProject: () => Promise<void>;
    getFileName: () => string;
    onFailureChanged?: (failure: SaveFailure | undefined) => void;
  }) {
    this.writeCurrentProject = options.writeCurrentProject;
    this.getFileName = options.getFileName;
    this.onFailureChanged = options.onFailureChanged;
  }

  /**
   * Runs the operation and returns its result as soon as it is available.
   * Mutations mark the project dirty before releasing their pending slot.
   */
  run<T>(
    operation: () => Promise<T>,
    options?: { markDirty?: boolean },
  ): Promise<T> {
    return this.track(async () => {
      const result = await operation();
      if (options?.markDirty === true) {
        this.dirty = true;
      }
      return result;
    });
  }

  save(): Promise<SaveResult> {
    return this.track(() => this.enqueueWrite());
  }

  startAutosave(): void {
    this.autosaveInterval ??= setInterval(
      () => this.autosave(),
      AUTOSAVE_INTERVAL_MS,
    );
  }

  stopAutosave(): void {
    clearInterval(this.autosaveInterval);
    this.autosaveInterval = undefined;
  }

  private autosave(): void {
    if (this.dirty && this.pending.size === 0) {
      void this.save().catch((error) => {
        console.error('Unexpected error during automatic save.', error);
      });
    }
  }

  /** Waits for tracked work, then writes dirty edits unless a save failure is outstanding. */
  async flush(): Promise<SaveResult> {
    while (true) {
      if (this.pending.size > 0) {
        await Promise.all([...this.pending]);
      } else if (this.currentFailure) {
        // Leave the failure available for recovery instead of retrying here.
        return { status: 'failed', failure: this.currentFailure };
      } else if (!this.dirty) {
        return { status: 'saved' };
      } else {
        await this.save();
      }
    }
  }

  resetSaveFailure(): void {
    this.setFailure(undefined);
  }

  private setFailure(failure: SaveFailure | undefined): void {
    if (this.currentFailure !== failure) {
      this.currentFailure = failure;
      this.onFailureChanged?.(failure);
    }
  }

  /**
   * Runs `work` while counting it as pending tracked work: registers it
   * before it starts and releases the registration once it concludes,
   * successfully or with an error.
   */
  private async track<T>(work: () => Promise<T>): Promise<T> {
    const done = Promise.withResolvers<void>();
    this.pending.add(done.promise);
    try {
      return await work();
    } finally {
      this.pending.delete(done.promise);
      done.resolve();
    }
  }

  /**
   * Appends a write of the current project state to the save tail and
   * records its outcome. The snapshot is read when the write starts, so
   * edits completed during a write stay dirty for the next write.
   */
  private enqueueWrite(): Promise<SaveResult> {
    const write = this.saveTail.then(async (): Promise<SaveResult> => {
      this.dirty = false;
      const fileName = this.getFileName();
      let failure: SaveFailure | undefined;
      try {
        await this.writeCurrentProject();
      } catch (error) {
        this.dirty = true;
        failure = {
          id: randomUUID(),
          fileName,
          message: error instanceof Error ? error.message : String(error),
        };
      }
      this.setFailure(failure);
      return failure ? { status: 'failed', failure } : { status: 'saved' };
    });
    // A failed save must not prevent later saves from starting.
    this.saveTail = write.then(
      () => undefined,
      () => undefined,
    );
    return write;
  }
}
