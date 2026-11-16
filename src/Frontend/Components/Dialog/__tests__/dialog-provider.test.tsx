// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { StrictMode, useState } from 'react';

import { Dialog } from '../dialog';
import {
  DialogProvider,
  useDialogRegistration,
  useDialogRegistrySnapshot,
} from '../dialog-provider';

describe('DialogProvider', () => {
  beforeEach(() => {
    vi.mocked(window.electronAPI.setFrontendDialogState).mockClear();
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
      expect(window.electronAPI.setFrontendDialogState).not.toHaveBeenCalled(),
    );

    fireEvent.click(screen.getByText('Open first'));
    await waitFor(() =>
      expect(
        window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );

    fireEvent.click(screen.getByText('Open second'));
    fireEvent.click(screen.getByText('Close second'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendDialogState).toHaveBeenCalledTimes(
        1,
      ),
    );

    fireEvent.click(screen.getByText('Handoff'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendDialogState).toHaveBeenCalledTimes(
        1,
      ),
    );

    unmount();
    await waitFor(() =>
      expect(
        window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: false,
        activityActive: false,
      }),
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
      expect(window.electronAPI.setFrontendDialogState).toHaveBeenCalledTimes(
        1,
      ),
    );
    expect(window.electronAPI.setFrontendDialogState).toHaveBeenLastCalledWith({
      anyDialogOpen: true,
      activityActive: false,
    });

    fireEvent.click(screen.getByText('Close first'));
    await waitFor(() =>
      expect(
        window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: false,
        activityActive: false,
      }),
    );

    fireEvent.click(screen.getByText('Reopen first'));
    await waitFor(() =>
      expect(
        window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );

    fireEvent.click(screen.getByText('Open second'));
    fireEvent.click(screen.getByText('Close first'));
    await waitFor(() =>
      expect(window.electronAPI.setFrontendDialogState).toHaveBeenCalledTimes(
        3,
      ),
    );
    expect(window.electronAPI.setFrontendDialogState).toHaveBeenLastCalledWith({
      anyDialogOpen: true,
      activityActive: false,
    });
  });

  it('leaves stacking of simultaneously open dialogs to MUI', async () => {
    render(
      <DialogProvider>
        <Dialog open={true} aria-label={'first dialog'}>
          First
        </Dialog>
        <Dialog open={true} aria-label={'second dialog'}>
          Second
        </Dialog>
      </DialogProvider>,
    );

    expect(await screen.findByText('First')).toBeVisible();
    expect(screen.getByText('Second')).toBeVisible();
  });

  it('reports reference dialogs separately without clearing workflow activity', async () => {
    let registerActivity: (id: string) => void;

    function Probe() {
      const registry = useDialogRegistration();
      const snapshot = useDialogRegistrySnapshot();
      registerActivity = registry.registerActivity;
      return <output data-testid="registry">{JSON.stringify(snapshot)}</output>;
    }

    const { rerender } = render(
      <DialogProvider>
        <Probe />
        <Dialog
          open={false}
          classification={'reference'}
          aria-label={'reference'}
        />
      </DialogProvider>,
    );

    act(() => registerActivity('workflow-activity'));

    rerender(
      <DialogProvider>
        <Probe />
        <Dialog
          open={true}
          classification={'reference'}
          aria-label={'reference'}
        />
      </DialogProvider>,
    );

    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId('registry').textContent ?? ''),
      ).toEqual({
        referenceDialogOpen: true,
        anyDialogOpen: true,
        activityActive: true,
      });
    });

    rerender(
      <DialogProvider>
        <Probe />
        <Dialog
          open={false}
          classification={'reference'}
          aria-label={'reference'}
        />
      </DialogProvider>,
    );
    await waitFor(() => {
      expect(
        JSON.parse(screen.getByTestId('registry').textContent ?? ''),
      ).toEqual({
        referenceDialogOpen: false,
        anyDialogOpen: false,
        activityActive: true,
      });
    });
  });

  it('rejects dialogs rendered without a provider', () => {
    expect(() => render(<Dialog open={true} />)).toThrow(
      'Dialog must be rendered within a DialogProvider',
    );
  });
});
