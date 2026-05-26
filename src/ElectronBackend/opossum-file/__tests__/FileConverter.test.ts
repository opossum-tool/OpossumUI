// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

import { text } from '../../../shared/text';
import { ExternalFileConverter } from '../ExternalFileConverter';
import { FileConverter } from '../FileConverter';

const electronMock = vi.hoisted(() => ({
  app: {
    getAppPath: vi.fn(() => '/repo'),
    isPackaged: false,
  },
}));

vi.mock('electron', () => electronMock);

class TestFileConverter extends FileConverter {
  protected override readonly fileTypeSwitch = '--test';
  protected override readonly fileTypeName = 'Test';

  get executable(): string {
    return this.OPOSSUM_FILE_EXECUTABLE;
  }

  protected override preConvertFile(): Promise<string | null> {
    return Promise.resolve(null);
  }

  override convertToOpossum(): Promise<void> {
    return Promise.resolve();
  }

  setExecFile(mock: typeof this.execFile): void {
    Reflect.set(this, 'execFile', mock);
  }

  runMerge(): Promise<void> {
    return this.mergeFileIntoOpossum('/input', '/output.opossum');
  }
}

class TestExternalFileConverter extends ExternalFileConverter {
  protected override readonly fileTypeSwitch = '--test';
  protected override readonly fileTypeName = 'Test';

  setExecFile(mock: typeof this.execFile): void {
    Reflect.set(this, 'execFile', mock);
  }
}

describe('FileConverter executable resolution', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    electronMock.app.getAppPath.mockReturnValue('/repo');
    electronMock.app.isPackaged = false;
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: originalPlatform,
    });
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: '/resources',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the packaged resources bin directory when packaged', () => {
    electronMock.app.isPackaged = true;

    const converter = new TestFileConverter();

    expect(converter.executable).toBe(
      path.join('/resources', 'bin', 'opossum-file-cli'),
    );
  });

  it('uses the packaged .exe CLI on Windows', () => {
    electronMock.app.isPackaged = true;
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    });

    const converter = new TestFileConverter();

    expect(converter.executable).toBe(
      path.join('/resources', 'bin', 'opossum-file-cli.exe'),
    );
  });

  it('falls back to a repo-level bin directory in development', () => {
    electronMock.app.getAppPath.mockReturnValue('/repo/build/ElectronBackend');

    const converter = new TestFileConverter();

    expect(converter.executable).toBe(
      path.join('/repo', 'bin', 'opossum-file-cli'),
    );
  });

  it('surfaces a dedicated converter error when the CLI cannot be executed', async () => {
    const converter = new TestFileConverter();
    converter.setExecFile(
      vi.fn().mockRejectedValue({
        code: 'ENOENT',
        message: 'spawn ENOENT',
        syscall: 'spawn /repo/bin/opossum-file-cli',
      }),
    );

    await expect(converter.runMerge()).rejects.toThrow(
      text.backendError.fileConverterExecutionFailed('Test'),
    );
  });

  it('keeps invalid-input messaging when the converter exits with a numeric failure code', async () => {
    const converter = new TestFileConverter();
    converter.setExecFile(
      vi.fn().mockRejectedValue({
        code: 2,
        message: 'command failed',
        stderr: 'bad input',
      }),
    );

    await expect(converter.runMerge()).rejects.toThrow(
      text.backendError.inputFileInvalid('Test'),
    );
  });
});

describe('ExternalFileConverter error handling', () => {
  it('uses the dedicated converter error for execution failures in direct conversion', async () => {
    const converter = new TestExternalFileConverter();
    converter.setExecFile(
      vi.fn().mockRejectedValue({
        code: 'EACCES',
        message: 'permission denied',
        syscall: 'spawn /resources/bin/opossum-file-cli',
      }),
    );

    await expect(
      converter.convertToOpossum('/input', '/output.opossum'),
    ).rejects.toThrow(text.backendError.fileConverterExecutionFailed('Test'));
  });
});
