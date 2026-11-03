// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isDevRestarted } from '../dev-env';

const electronMock = vi.hoisted(() => ({
  app: {
    isPackaged: false,
  },
}));

vi.mock('electron', () => electronMock);

const ORIGINAL_ENV = { ...process.env };

describe('isDevRestarted', () => {
  beforeEach(() => {
    delete process.env.OPOSSUM_ELECTRON_RESTARTED;
    electronMock.app.isPackaged = false;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('is true for an unpackaged app restarted by the watcher', () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '1';

    expect(isDevRestarted()).toBe(true);
  });

  it('is false for a fresh dev start', () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '0';

    expect(isDevRestarted()).toBe(false);
  });

  it('is false when the restarted flag is not set', () => {
    expect(isDevRestarted()).toBe(false);
  });

  it('is false for a packaged app even if the restarted flag is set', () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '1';
    electronMock.app.isPackaged = true;

    expect(isDevRestarted()).toBe(false);
  });
});
