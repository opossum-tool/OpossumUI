// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import {
  getLatestReleaseAssetDownloadUrl,
  UPDATE_ASSET_NAMES,
} from '../../../../shared/release-assets';
import {
  expectButtonVisibility,
  expectTextVisible,
} from '../../../../testing/ui';
import { renderComponent } from '../../../test-helpers/render';
import { MacArchitectureWarning } from '../mac-architecture-warning';

describe('MacArchitectureWarning', () => {
  it('shows a persistent warning and opens the Apple Silicon download', async () => {
    vi.mocked(window.electronAPI.getMacArchitectureMismatch).mockResolvedValue(
      true,
    );
    const { rerender } = await renderComponent(<MacArchitectureWarning />);

    await expectTextVisible(/You’re running the Intel version/, true);
    fireEvent.click(
      screen.getByRole('link', {
        name: 'Download Apple Silicon (ARM64) version',
      }),
    );
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(
      getLatestReleaseAssetDownloadUrl(UPDATE_ASSET_NAMES.macArm64),
    );

    await expectButtonVisibility('Close warning', false);
    rerender(<MacArchitectureWarning />);
    await expectTextVisible(/You’re running the Intel version/, true);
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
    await expectTextVisible(/You’re running the Intel version/, false);
  });
});
