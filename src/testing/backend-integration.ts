// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ParsedFileContent } from '../shared/shared-types';

export function unexpectedBackendCall(): Promise<never> {
  return Promise.reject(
    new Error(
      'Unexpected backend API call in a lightweight test. Supply database fixtures to createTestStore() or setupBackendIntegration().',
    ),
  );
}

export async function setupBackendIntegration(data: ParsedFileContent) {
  if (typeof window !== 'undefined') {
    const { executeCommand } = await import('../ElectronBackend/api/commands');
    const api = vi.mocked(window.electronAPI.api);
    if (api.getMockImplementation() === unexpectedBackendCall) {
      api.mockImplementation(executeCommand);
    }
  }
  const { initializeDb } = await import('../ElectronBackend/db/initializeDb');
  await initializeDb(data);
}
