// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';

import { faker } from '../../../testing/Faker';
import { getLastOpenedFilePath } from '../last-opened-file';

const mockUserSettingsGet = vi.fn().mockResolvedValue([]);
vi.mock('../user-settings-service', () => ({
  UserSettingsService: {
    get: (...args: Array<unknown>): unknown => mockUserSettingsGet(...args),
  },
}));

describe('getLastOpenedFilePath', () => {
  beforeEach(() => {
    mockUserSettingsGet.mockClear();
    mockUserSettingsGet.mockResolvedValue([]);
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

  it('returns the most recently opened file', async () => {
    const filePath = createOpossumFile();
    setRecentlyOpenedPaths([filePath, '/older/file.opossum']);

    expect(await getLastOpenedFilePath()).toBe(filePath);
  });

  it('does not return a non-.opossum file', async () => {
    const filePath = faker.outputPath(`${faker.string.uuid()}.txt`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'text');
    setRecentlyOpenedPaths([filePath]);

    expect(await getLastOpenedFilePath()).toBeUndefined();
  });

  it('does not return a file that no longer exists', async () => {
    setRecentlyOpenedPaths(['/path/deleted-file.opossum']);

    expect(await getLastOpenedFilePath()).toBeUndefined();
  });

  it('returns undefined when no file was opened before', async () => {
    setRecentlyOpenedPaths([]);

    expect(await getLastOpenedFilePath()).toBeUndefined();
  });
});
