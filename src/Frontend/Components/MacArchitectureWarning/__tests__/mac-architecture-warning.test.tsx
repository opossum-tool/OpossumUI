// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderComponent } from '../../../test-helpers/render';
import { MacArchitectureWarning } from '../mac-architecture-warning';

describe('MacArchitectureWarning', () => {
  it('shows a persistent warning and opens the release page', async () => {
    vi.mocked(window.electronAPI.getMacArchitectureMismatch).mockResolvedValue(
      true,
    );
    const { rerender } = await renderComponent(<MacArchitectureWarning />);

    expect(
      await screen.findByText(/You’re running the Intel version/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('link', {
        name: 'Download Apple Silicon (ARM64) version',
      }),
    );
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(
      'https://github.com/opossum-tool/OpossumUI/releases/latest',
    );

    expect(screen.queryByRole('button', { name: 'Close warning' })).toBeNull();
    rerender(<MacArchitectureWarning />);
    expect(
      screen.getByText(/You’re running the Intel version/),
    ).toBeInTheDocument();
  });

  it('hides the warning when detection fails', async () => {
    vi.mocked(window.electronAPI.getMacArchitectureMismatch).mockRejectedValue(
      new Error('detection failed'),
    );
    const { queryClient } = await renderComponent(<MacArchitectureWarning />);

    await waitFor(() =>
      expect(
        queryClient.getQueryState(['macArchitectureMismatch'])?.status,
      ).toBe('error'),
    );
    expect(
      screen.queryByText(/You’re running the Intel version/),
    ).not.toBeInTheDocument();
  });
});
