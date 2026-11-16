// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';

import { importFileFormats } from '../ElectronBackend/main/menu/fileMenu';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { AllowedFrontendChannels } from '../shared/ipc-channels';
import { text } from '../shared/text';
import { renderApp } from '../testing/render-app';
import {
  clickPopupButton,
  expectImportInputFilePath,
  expectImportOutputFilePath,
  expectPopupHidden,
  getPopup,
  IMPORT_DIALOG_LABEL,
  openImportDialogFromMenu,
  selectImportInputFile,
  selectImportOutputFile,
} from '../testing/ui';

describe('new-project import dialog lifecycle', () => {
  it('waits for the import form to complete before presenting statistics', async () => {
    const importResponse = Promise.withResolvers<boolean>();
    const selectFile = vi
      .spyOn(window.electronAPI, 'selectFile')
      .mockResolvedValue('/input.json');
    const selectSaveFile = vi
      .spyOn(window.electronAPI, 'selectSaveFile')
      .mockResolvedValue('/output.opossum');
    const importFile = vi
      .spyOn(window.electronAPI, 'importFileConvertAndLoad')
      .mockReturnValue(importResponse.promise);
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({}),
      userSettings: { showProjectStatistics: true },
    });

    act(() =>
      openImportDialogFromMenu(sendToChannel, importFileFormats[0], false),
    );
    await getPopup(IMPORT_DIALOG_LABEL);
    await selectImportInputFile();
    await waitFor(() => expect(selectFile).toHaveBeenCalledOnce());
    await selectImportOutputFile();
    await waitFor(() => expect(selectSaveFile).toHaveBeenCalledOnce());
    await expectImportInputFilePath('/input.json');
    await expectImportOutputFilePath('/output.opossum');

    await clickPopupButton(IMPORT_DIALOG_LABEL, text.buttons.import);
    await waitFor(() => expect(importFile).toHaveBeenCalledOnce());
    act(() => sendToChannel(AllowedFrontendChannels.ProjectOpened));
    await expectPopupHidden('project statistics');
    await getPopup(IMPORT_DIALOG_LABEL);

    await act(async () => {
      importResponse.resolve(true);
      await importResponse.promise;
    });
    await expectPopupHidden(IMPORT_DIALOG_LABEL);
    await getPopup('project statistics');
    expect(screen.getAllByLabelText('project statistics')).toHaveLength(1);

    await clickPopupButton('project statistics', text.buttons.close);
    await expectPopupHidden('project statistics');
    expect(importFile).toHaveBeenCalledOnce();
    selectFile.mockRestore();
    selectSaveFile.mockRestore();
    importFile.mockRestore();
  });

  it('retains selected paths when import fails and allows retry', async () => {
    const selectFile = vi
      .spyOn(window.electronAPI, 'selectFile')
      .mockResolvedValue('/input.json');
    const selectSaveFile = vi
      .spyOn(window.electronAPI, 'selectSaveFile')
      .mockResolvedValue('/output.opossum');
    const importFile = vi
      .spyOn(window.electronAPI, 'importFileConvertAndLoad')
      .mockResolvedValue(false);
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({}),
    });

    act(() =>
      openImportDialogFromMenu(sendToChannel, importFileFormats[0], false),
    );
    await getPopup(IMPORT_DIALOG_LABEL);
    await selectImportInputFile();
    await waitFor(() => expect(selectFile).toHaveBeenCalledOnce());
    await selectImportOutputFile();
    await waitFor(() => expect(selectSaveFile).toHaveBeenCalledOnce());
    await expectImportInputFilePath('/input.json');
    await expectImportOutputFilePath('/output.opossum');

    await clickPopupButton(IMPORT_DIALOG_LABEL, text.buttons.import);
    await waitFor(() => expect(importFile).toHaveBeenCalledOnce());
    await expectImportInputFilePath('/input.json');
    await expectImportOutputFilePath('/output.opossum');

    await clickPopupButton(IMPORT_DIALOG_LABEL, text.buttons.import);
    await waitFor(() => expect(importFile).toHaveBeenCalledTimes(2));
    expect(importFile).toHaveBeenLastCalledWith(
      '/input.json',
      importFileFormats[0].fileType,
      '/output.opossum',
    );

    await clickPopupButton(IMPORT_DIALOG_LABEL, text.buttons.cancel);
    await expectPopupHidden(IMPORT_DIALOG_LABEL);
    selectFile.mockRestore();
    selectSaveFile.mockRestore();
    importFile.mockRestore();
  });
});
