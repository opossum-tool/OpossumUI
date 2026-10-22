// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { sendToRenderers } from '../send-to-renderers';

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
}));

describe('sendToRenderer', () => {
  const send = vi.fn();
  const window = {
    isDestroyed: vi.fn(() => false),
    webContents: { isDestroyed: vi.fn(() => false), send },
  };

  beforeEach(() => {
    send.mockReset();
    window.isDestroyed.mockReset().mockReturnValue(false);
    window.webContents.isDestroyed.mockReset().mockReturnValue(false);
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([
      window as unknown as BrowserWindow,
    ]);
  });

  it('forwards the channel and payload to the app window', () => {
    const state = { status: 'checking' };
    sendToRenderers(AllowedFrontendChannels.UpdateStateChanged, state);
    expect(send).toHaveBeenCalledExactlyOnceWith(
      AllowedFrontendChannels.UpdateStateChanged,
      state,
    );
  });

  it('does nothing when no window exists', () => {
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([]);
    sendToRenderers(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'checking',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('does not send to destroyed windows', () => {
    window.isDestroyed.mockReturnValue(true);
    sendToRenderers(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'checking',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('does not send to destroyed web contents', () => {
    window.webContents.isDestroyed.mockReturnValue(true);
    sendToRenderers(AllowedFrontendChannels.UpdateStateChanged, {
      status: 'checking',
    });
    expect(send).not.toHaveBeenCalled();
  });
});
