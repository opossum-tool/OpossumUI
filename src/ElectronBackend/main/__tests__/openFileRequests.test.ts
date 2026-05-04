// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  queueMacOsOpenFile,
  resetMacOsOpenFileHandlingForTests,
  setRuntimeMacOsOpenFileHandler,
} from '../openFileRequests';

describe('openFileRequests', () => {
  beforeEach(() => {
    resetMacOsOpenFileHandlingForTests();
  });

  it('delivers queued file-open requests once the runtime handler is registered', () => {
    const runtimeOpenFileHandler = vi.fn();
    const filePath = '/path/to/project.opossum';

    queueMacOsOpenFile(filePath);
    setRuntimeMacOsOpenFileHandler(runtimeOpenFileHandler);

    expect(runtimeOpenFileHandler).toHaveBeenCalledWith(filePath);
  });

  it('forwards file-open requests directly after the runtime handler is registered', () => {
    const runtimeOpenFileHandler = vi.fn();
    const filePath = '/path/to/project.opossum';

    setRuntimeMacOsOpenFileHandler(runtimeOpenFileHandler);
    queueMacOsOpenFile(filePath);

    expect(runtimeOpenFileHandler).toHaveBeenCalledWith(filePath);
  });
});
