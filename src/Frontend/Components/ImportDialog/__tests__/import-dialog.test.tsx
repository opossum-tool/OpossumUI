// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { importFileFormats } from '../../../../ElectronBackend/main/menu/fileMenu';
import { DEFAULT_USER_SETTINGS } from '../../../../shared/shared-constants';
import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { openImportDialog } from '../../../state/actions/view-actions/view-actions';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';

describe('ImportDialog statistics behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes a successful new-project import before opening enabled statistics', async () => {
    vi.mocked(window.electronAPI.getUserSettings).mockResolvedValue({
      ...DEFAULT_USER_SETTINGS,
      showProjectStatistics: true,
    });
    vi.mocked(window.electronAPI.selectFile).mockResolvedValue('/input.json');
    vi.mocked(window.electronAPI.selectSaveFile).mockResolvedValue(
      '/output.opossum',
    );
    let resolveImport: ((success: boolean) => void) | undefined;
    vi.mocked(window.electronAPI.importFileConvertAndLoad).mockReturnValue(
      new Promise((resolve) => {
        resolveImport = resolve;
      }),
    );

    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [
        setUserSetting({ showProjectStatistics: true }),
        openImportDialog(importFileFormats[0]),
      ],
    });
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.ImportDialog);

    fireEvent.click(screen.getByTestId('import-input-file-path-input'));
    await waitFor(() =>
      expect(window.electronAPI.selectFile).toHaveBeenCalled(),
    );
    fireEvent.click(screen.getByTestId('import-opossum-file-path-input'));
    await waitFor(() =>
      expect(window.electronAPI.selectSaveFile).toHaveBeenCalled(),
    );
    fireEvent.click(screen.getByRole('button', { name: text.buttons.import }));
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.ImportDialog);

    resolveImport?.(true);
    await waitFor(() =>
      expect(getOpenPopup(store.getState())?.popup).toBe(
        PopupType.ProjectStatisticsPopup,
      ),
    );
    expect(
      store.getState().viewState.popupInfo.map(({ info }) => info),
    ).toEqual([{ popup: PopupType.ProjectStatisticsPopup }]);
  });

  it('closes a successful current-project import without opening statistics', async () => {
    vi.mocked(window.electronAPI.getUserSettings).mockResolvedValue({
      ...DEFAULT_USER_SETTINGS,
      showProjectStatistics: true,
    });
    vi.mocked(window.electronAPI.selectFile).mockResolvedValue('/input.json');
    let resolveImport: ((success: boolean) => void) | undefined;
    vi.mocked(window.electronAPI.mergeFileAndLoad).mockReturnValue(
      new Promise((resolve) => {
        resolveImport = resolve;
      }),
    );

    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [
        setUserSetting({ showProjectStatistics: true }),
        openImportDialog(importFileFormats[0], true),
      ],
    });

    fireEvent.click(screen.getByTestId('import-input-file-path-input'));
    await waitFor(() =>
      expect(window.electronAPI.selectFile).toHaveBeenCalled(),
    );
    fireEvent.click(screen.getByRole('button', { name: text.buttons.import }));
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.ImportDialog);
    resolveImport?.(true);
    await waitFor(() => expect(getOpenPopup(store.getState())).toBeNull());
    expect(store.getState().viewState.popupInfo).toEqual([]);
  });
});
