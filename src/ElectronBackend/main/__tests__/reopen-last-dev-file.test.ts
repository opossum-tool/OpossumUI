// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';

import { faker } from '../../../testing/Faker';
import { getDevReopenFilePath } from '../reopen-last-dev-file';

const mockUserSettingsGet = vi.fn().mockResolvedValue([]);
vi.mock('../user-settings-service', () => ({
  UserSettingsService: {
    get: (...args: Array<unknown>): unknown => mockUserSettingsGet(...args),
  },
}));

const ORIGINAL_ENV = { ...process.env };

describe('getDevReopenFilePath', () => {
  beforeEach(() => {
    mockUserSettingsGet.mockClear();
    mockUserSettingsGet.mockResolvedValue([]);
    delete process.env.OPOSSUM_ELECTRON_RESTARTED;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function setRecentlyOpenedPaths(paths: Array<string>): void {
    mockUserSettingsGet.mockResolvedValue(paths);
  }

  function createOpossumFile(): string {
    const filePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'opossum');
    return filePath;
  }

  it('returns no file when the process was not restarted by the watcher', async () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '0';
    const filePath = createOpossumFile();
    setRecentlyOpenedPaths([filePath]);

    expect(await getDevReopenFilePath()).toBeUndefined();
    expect(mockUserSettingsGet).not.toHaveBeenCalled();
  });

  it('reopens the most recently opened file after a watcher restart', async () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '1';
    const filePath = createOpossumFile();
    setRecentlyOpenedPaths([filePath, '/older/file.opossum']);

    expect(await getDevReopenFilePath()).toBe(filePath);
  });

  it('does not reopen a non-.opossum file', async () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '1';
    const filePath = faker.outputPath(`${faker.string.uuid()}.txt`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'text');
    setRecentlyOpenedPaths([filePath]);

    expect(await getDevReopenFilePath()).toBeUndefined();
  });

  it('does not reopen a file that no longer exists', async () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '1';
    setRecentlyOpenedPaths(['/path/deleted-file.opossum']);

    expect(await getDevReopenFilePath()).toBeUndefined();
  });

  it('does not reopen when no file was opened before the restart', async () => {
    process.env.OPOSSUM_ELECTRON_RESTARTED = '1';
    setRecentlyOpenedPaths([]);

    expect(await getDevReopenFilePath()).toBeUndefined();
  });
});
