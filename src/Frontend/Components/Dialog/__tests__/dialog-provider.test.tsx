// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useState } from 'react';

import { Dialog } from '../dialog';
import { DialogProvider } from '../dialog-provider';

describe('DialogProvider', () => {
  beforeEach(() => {
    vi.mocked(window.electronAPI.setFrontendPopupOpen).mockClear();
  });

  it('reports only aggregate open-state transitions and handles a handoff', async () => {
    function Dialogs() {
      const [firstOpen, setFirstOpen] = useState(false);
      const [secondOpen, setSecondOpen] = useState(false);
      return (
        <>
          <button onClick={() => setFirstOpen(true)}>Open first</button>
          <button onClick={() => setSecondOpen(true)}>Open second</button>
          <button
            onClick={() => {
              setFirstOpen(false);
              setSecondOpen(true);
            }}
          >
            Handoff
          </button>
          <button onClick={() => setSecondOpen(false)}>Close second</button>
          <Dialog open={firstOpen}>First</Dialog>
          <Dialog open={secondOpen}>Second</Dialog>
        </>
      );
    }

    const { unmount } = render(
      <StrictMode>
        <DialogProvider>
          <Dialogs />
        </DialogProvider>
      </StrictMode>,
    );

    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).not.toHaveBeenCalled(),
    );

    fireEvent.click(screen.getByText('Open first'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
        true,
      ),
    );

    fireEvent.click(screen.getByText('Open second'));
    fireEvent.click(screen.getByText('Close second'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenCalledTimes(1),
    );

    fireEvent.click(screen.getByText('Handoff'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenCalledTimes(1),
    );

    unmount();
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
        false,
      ),
    );
  });

  it('replays initially open dialogs and tracks close, reopen, and overlap', async () => {
    function InitiallyOpenDialogs() {
      const [firstOpen, setFirstOpen] = useState(true);
      const [secondOpen, setSecondOpen] = useState(false);
      return (
        <>
          <button onClick={() => setFirstOpen(false)}>Close first</button>
          <button onClick={() => setFirstOpen(true)}>Reopen first</button>
          <button onClick={() => setSecondOpen(true)}>Open second</button>
          <Dialog open={firstOpen}>First</Dialog>
          <Dialog open={secondOpen}>Second</Dialog>
        </>
      );
    }

    render(
      <StrictMode>
        <DialogProvider>
          <InitiallyOpenDialogs />
        </DialogProvider>
      </StrictMode>,
    );

    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenCalledTimes(1),
    );
    expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
      true,
    );

    fireEvent.click(screen.getByText('Close first'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
        false,
      ),
    );

    fireEvent.click(screen.getByText('Reopen first'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
        true,
      ),
    );

    fireEvent.click(screen.getByText('Open second'));
    fireEvent.click(screen.getByText('Close first'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenCalledTimes(3),
    );
    expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
      true,
    );
  });

  it('rejects dialogs rendered without a provider', () => {
    expect(() => render(<Dialog open={true} />)).toThrow(
      'Dialog must be rendered within a DialogProvider',
    );
  });
});
