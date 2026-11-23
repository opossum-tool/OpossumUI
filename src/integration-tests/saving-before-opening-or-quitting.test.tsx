// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdmZip from 'adm-zip';
import type {
  BrowserWindow,
  IpcMainInvokeEvent,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import * as saveFileModule from '../ElectronBackend/api/saveFile';
import {
  type DbProcessRequest,
  handleDbProcessMessage,
  resetDbProcessStateForTesting,
} from '../ElectronBackend/dbProcess/dbProcess';
import * as dbProcessClientModule from '../ElectronBackend/dbProcess/dbProcessClient';
import * as dialogs from '../ElectronBackend/main/dialogs';
import { setGlobalBackendState } from '../ElectronBackend/main/globalBackendState';
import {
  importFileConvertAndLoadListener,
  mergeFileAndLoadListener,
  openFileListener,
  saveFileListener,
} from '../ElectronBackend/main/listeners';
import {
  getFileMenu,
  importFileFormats,
} from '../ElectronBackend/main/menu/fileMenu';
import { menuItemIds } from '../ElectronBackend/main/menu/menuItemIds';
import {
  confirmQuit,
  handleWindowClose,
  resetQuitStateForTesting,
} from '../ElectronBackend/main/quit-handling';
import * as converters from '../ElectronBackend/opossum-file/opossum-file';
import '../ElectronBackend/preload';
import type { OpossumOutputFile } from '../ElectronBackend/types/types';
import { setDatabaseInitialized } from '../Frontend/util/backendClient';
import { AllowedFrontendChannels, IpcChannel } from '../shared/ipc-channels';
import type { ElectronAPI } from '../shared/shared-types';
import { text } from '../shared/text';
import { writeOpossumFile } from '../shared/write-file';
import { OUTPUT_FILE_NAME } from '../shared/write-file-utils';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  clickPopupButton,
  expectFormFieldValues,
  expectPopupHidden,
  fillFormField,
  gotoResource,
  IMPORT_DIALOG_LABEL,
  openImportDialogFromMenu,
  resourceTreeItem,
  saveChangesInAttributionColumn,
  selectImportInputFile,
  selectImportOutputFile,
} from '../testing/ui';

const { quit, getUserSetting, exposeInMainWorld, invoke, on } = vi.hoisted(
  () => ({
    quit: vi.fn(),
    getUserSetting: vi.fn(),
    exposeInMainWorld: vi.fn<(name: string, api: ElectronAPI) => void>(),
    invoke: vi.fn(),
    on: vi.fn<
      (
        channel: string,
        listener: (event: {
          ports: Array<ReturnType<typeof createPort>>;
        }) => void,
      ) => void
    >(),
  }),
);
vi.mock('electron', () => ({
  app: { quit },
  contextBridge: { exposeInMainWorld },
  ipcRenderer: { invoke, on },
}));
vi.mock('../ElectronBackend/main/iconHelpers', () => ({
  getIconBasedOnTheme: vi.fn(),
}));
vi.mock('../ElectronBackend/main/user-settings-service', () => ({
  UserSettingsService: {
    get: getUserSetting,
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

const [attributionId, packageInfo] = faker.opossum.rawAttribution({
  packageName: 'original package',
});
const savedName = 'submitted change';
const [otherAttributionId, otherPackageInfo] = faker.opossum.rawAttribution();
const draftName = 'unsubmitted draft';

// Keep the real request/response client and DB-process handler, replacing only
// the Electron MessagePort transport with an in-process connection.
function createPort() {
  const port = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage(request: DbProcessRequest) {
      void handleDbProcessMessage(
        {
          postMessage(response) {
            port.onmessage?.({ data: response } as MessageEvent);
          },
        },
        request,
      );
    },
  };
  return port;
}

const [, preloadAPI] = exposeInMainWorld.mock.calls[0];
const [, connectPreload] = on.mock.calls.find(
  ([channel]) => channel === dbProcessClientModule.FRONTEND_TO_DB_PROCESS_PORT,
)!;

let client: dbProcessClientModule.DbProcessClient;
let firstPath: string;
let projectId: string;
let secondPath: string;
let releaseSave: () => void;
let saveStarted: Promise<void>;

beforeEach(async () => {
  resetDbProcessStateForTesting();
  resetQuitStateForTesting();
  setGlobalBackendState({});
  client = new dbProcessClientModule.DbProcessClient(createPort());
  connectPreload({ ports: [createPort()] });
  vi.spyOn(dbProcessClientModule, 'getMainDbClient').mockReturnValue(client);
  vi.mocked(window.electronAPI.api).mockImplementation(preloadAPI.api);
  vi.mocked(window.electronAPI.whenBackendIdle).mockImplementation(
    preloadAPI.whenBackendIdle,
  );
  vi.mocked(window.electronAPI.confirmQuit).mockImplementation(confirmQuit);

  firstPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  secondPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  mkdirSync(dirname(firstPath), { recursive: true });
  vi.spyOn(dialogs, 'openOpossumFileDialog').mockReturnValue([secondPath]);
  for (const path of [firstPath, secondPath]) {
    const metadata = faker.opossum.metadata();
    await writeOpossumFile({
      path,
      input: faker.opossum.inputData({
        metadata,
        resources: { file: 1, other: 1 },
        externalAttributions: {},
        resourcesToAttributions: {},
      }),
      output: faker.opossum.outputData({
        metadata,
        manualAttributions: {
          [attributionId]: packageInfo,
          [otherAttributionId]: otherPackageInfo,
        },
        resourcesToAttributions:
          path === firstPath
            ? { '/file': [attributionId], '/other': [otherAttributionId] }
            : { '/file': [attributionId], '/other': [attributionId] },
      }),
    });
  }
  const result = await client.loadFile(firstPath);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  projectId = result.projectId;
  setDatabaseInitialized(true);

  const started = Promise.withResolvers<void>();
  const gate = Promise.withResolvers<void>();
  saveStarted = started.promise;
  releaseSave = gate.resolve;
  const realSaveFile = saveFileModule.saveFile;
  // Pause before serialization, when the save still needs project A's database.
  // Loading B prematurely would replace precisely that state.
  vi.spyOn(saveFileModule, 'saveFile').mockImplementationOnce(
    async (...args) => {
      started.resolve();
      await gate.promise;
      await realSaveFile(...args);
    },
  );
});

afterEach(async () => {
  releaseSave?.();
  await client.flushSaves();
  resetDbProcessStateForTesting();
  vi.mocked(saveFileModule.saveFile).mockRestore();
  vi.mocked(dbProcessClientModule.getMainDbClient).mockRestore();
  vi.mocked(dialogs.openOpossumFileDialog).mockRestore();
  vi.mocked(window.electronAPI.openFile).mockReset();
  vi.mocked(window.electronAPI.saveFile)
    .mockReset()
    .mockResolvedValue(undefined);
  vi.mocked(window.electronAPI.confirmQuit).mockReset();
  vi.mocked(window.electronAPI.whenBackendIdle).mockReset();
  invoke.mockReset();
  quit.mockReset();
});

async function submitChange() {
  const view = await renderApp();
  await gotoResource('file');
  await expectFormFieldValues({ name: packageInfo.packageName });
  fillFormField('name', savedName);
  await saveChangesInAttributionColumn();
  expect(saveFileModule.saveFile).not.toHaveBeenCalled();
  return view;
}

function packageNameInArchive(archive: Buffer): string | undefined {
  const output: OpossumOutputFile = JSON.parse(
    new AdmZip(archive).readAsText(OUTPUT_FILE_NAME),
  );
  return output.manualAttributions[attributionId]?.packageName;
}

function submenuOf(
  item: MenuItemConstructorOptions,
): Array<MenuItemConstructorOptions> {
  if (!Array.isArray(item.submenu)) {
    throw new Error('Expected a menu template submenu');
  }
  return item.submenu;
}

async function prepareProjectOpening(
  selectMenuItem: (
    fileMenu: MenuItemConstructorOptions,
  ) => MenuItemConstructorOptions,
) {
  const { sendToChannel } = await submitChange();
  const opened = Promise.withResolvers<{ archive: Buffer; loaded: boolean }>();
  const mainWindow = {
    webContents: { send: sendToChannel },
    setTitle: vi.fn(),
  } as unknown as BrowserWindow;
  const updateMenu = vi.fn().mockResolvedValue(undefined);
  const openFile = openFileListener(mainWindow, updateMenu);
  vi.mocked(window.electronAPI.openFile).mockImplementation((path) =>
    openFile({} as IpcMainInvokeEvent, path),
  );
  const loadFile = client.loadFile.bind(client);
  vi.spyOn(client, 'loadFile').mockImplementation(async (...args) => {
    // Capture the archive at the transition, not after allowing a late save
    // to finish and potentially conceal the regression. Observe the DB load
    // so this also catches the old menu callback bypassing the renderer.
    const archive = readFileSync(firstPath);
    const result = await loadFile(...args);
    opened.resolve({ archive, loaded: result.ok });
    return result;
  });
  getUserSetting.mockResolvedValue([secondPath]);
  const fileMenu = await getFileMenu(mainWindow, updateMenu, false);
  const menuItem = selectMenuItem(fileMenu);

  return {
    openProject() {
      act(() => {
        menuItem.click!({ id: menuItem.id } as MenuItem, mainWindow, {});
      });
    },
    opened: opened.promise,
  };
}

async function expectSavedBeforeOpening(
  opened: Promise<{ archive: Buffer; loaded: boolean }>,
) {
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(
    packageInfo.packageName,
  );
  await act(async () => {
    await saveStarted;
    releaseSave();
    const { archive, loaded } = await opened;
    expect(loaded).toBe(true);
    expect(packageNameInArchive(archive)).toBe(savedName);
  });
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(savedName);
  expect(packageNameInArchive(readFileSync(secondPath))).toBe(
    packageInfo.packageName,
  );
}

async function prepareQuit() {
  const { sendToChannel } = await submitChange();
  const exited = Promise.withResolvers<Buffer>();
  quit.mockImplementation(() => exited.resolve(readFileSync(firstPath)));
  return {
    requestQuit() {
      act(() => {
        sendToChannel(AllowedFrontendChannels.RequestQuitApproval);
      });
    },
    exited: exited.promise,
  };
}

async function expectSavedBeforeQuitting(exited: Promise<Buffer>) {
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(
    packageInfo.packageName,
  );
  await act(async () => {
    await saveStarted;
    releaseSave();
    expect(packageNameInArchive(await exited)).toBe(savedName);
  });
  expect(quit).toHaveBeenCalledOnce();
}

async function prepareImport(intoCurrent: boolean) {
  const { sendToChannel } = await submitChange();
  setGlobalBackendState({ projectId, opossumFilePath: firstPath });
  vi.mocked(window.electronAPI.selectFile).mockResolvedValueOnce(secondPath);
  act(() =>
    openImportDialogFromMenu(sendToChannel, importFileFormats[0], intoCurrent),
  );
  await selectImportInputFile();
  return {
    webContents: { send: sendToChannel },
    setTitle: vi.fn(),
  } as unknown as BrowserWindow;
}

async function confirmImport() {
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(
    packageInfo.packageName,
  );
  await clickPopupButton(IMPORT_DIALOG_LABEL, text.buttons.import);
  releaseSave();
  await expectPopupHidden(IMPORT_DIALOG_LABEL);
}

test('saves the current project before converting an import as a new project', async () => {
  const mainWindow = await prepareImport(false);
  const importFile = importFileConvertAndLoadListener(mainWindow, vi.fn());
  const destination = faker.outputPath(`${faker.string.uuid()}.opossum`);
  vi.mocked(window.electronAPI.selectSaveFile).mockResolvedValueOnce(
    destination,
  );
  await selectImportOutputFile();

  const archiveAtConversion = Promise.withResolvers<Buffer>();
  // Stand in for conversion with an archive the real load path can open.
  using convert = vi
    .spyOn(converters, 'convertToOpossum')
    .mockImplementation((source, target) => {
      archiveAtConversion.resolve(readFileSync(firstPath));
      copyFileSync(source, target);
      return Promise.resolve();
    });
  vi.mocked(window.electronAPI.importFileConvertAndLoad).mockImplementationOnce(
    preloadAPI.importFileConvertAndLoad,
  );
  invoke.mockImplementationOnce((_, source, fileType, target) =>
    importFile({} as IpcMainInvokeEvent, source, fileType, target),
  );

  await confirmImport();

  expect(convert).toHaveBeenCalledOnce();
  expect(packageNameInArchive(await archiveAtConversion.promise)).toBe(
    savedName,
  );
});

test('includes the submitted edit in the backup when importing into the current project', async () => {
  const mainWindow = await prepareImport(true);
  const importFile = mergeFileAndLoadListener(mainWindow, vi.fn());
  // The listener still creates the real backup before calling the converter.
  using merge = vi
    .spyOn(converters, 'mergeFileIntoOpossum')
    .mockResolvedValue(undefined);
  vi.mocked(window.electronAPI.mergeFileAndLoad).mockImplementationOnce(
    preloadAPI.mergeFileAndLoad,
  );
  invoke.mockImplementationOnce((_, source, fileType) =>
    importFile({} as IpcMainInvokeEvent, source, fileType),
  );

  await confirmImport();

  expect(merge).toHaveBeenCalledOnce();
  expect(packageNameInArchive(readFileSync(`${firstPath}.backup`))).toBe(
    savedName,
  );
});

test('persists the submitted change before restarting to install an update', async () => {
  vi.mocked(window.electronAPI.getUpdateState).mockResolvedValueOnce({
    status: 'downloaded',
    tag: 'OpossumUI-2026-10-23',
  });
  await submitChange();
  vi.mocked(window.electronAPI.restartAndUpdate).mockImplementationOnce(
    preloadAPI.restartAndUpdate,
  );
  const archiveAtRestart = Promise.withResolvers<Buffer>();
  invoke.mockImplementationOnce((channel) => {
    expect(channel).toBe(IpcChannel.RestartAndUpdate);
    archiveAtRestart.resolve(readFileSync(firstPath));
    return Promise.resolve();
  });
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(
    packageInfo.packageName,
  );

  await userEvent.click(
    await screen.findByRole('button', { name: text.updateApp.restart }),
  );
  releaseSave();

  expect(packageNameInArchive(await archiveAtRestart.promise)).toBe(savedName);
});

describe.each([
  {
    request: 'a recent project',
    selectMenuItem(fileMenu: MenuItemConstructorOptions) {
      const openRecent = submenuOf(fileMenu).find(
        ({ id }) => id === menuItemIds.openRecent,
      )!;
      return submenuOf(openRecent).find(({ id }) => id === secondPath)!;
    },
  },
  {
    request: 'the file picker',
    selectMenuItem(fileMenu: MenuItemConstructorOptions) {
      return submenuOf(fileMenu).find(({ id }) => id === menuItemIds.openFile)!;
    },
  },
])('opening through $request', ({ selectMenuItem }) => {
  it('persists the submitted change before opening the selected project', async () => {
    const { openProject, opened } = await prepareProjectOpening(selectMenuItem);

    openProject();

    await expectSavedBeforeOpening(opened);
  });

  it('discards a newer draft and persists the submitted change before opening the selected project', async () => {
    const { openProject, opened } = await prepareProjectOpening(selectMenuItem);
    fillFormField('name', draftName);

    openProject();
    await clickPopupButton(
      'unsaved changes popup',
      text.unsavedChangesPopup.discard,
    );

    await expectSavedBeforeOpening(opened);
  });
});

async function prepareMenuSave(path = firstPath, id = projectId) {
  const { sendToChannel } = await renderApp();
  const mainWindow = {
    webContents: { send: sendToChannel },
  } as unknown as BrowserWindow;
  setGlobalBackendState({ projectId: id, opossumFilePath: path });
  const fileMenu = await getFileMenu(mainWindow, vi.fn(), false);
  const saveItem = submenuOf(fileMenu).find(
    ({ id }) => id === menuItemIds.saveFile,
  )!;
  const saved = Promise.withResolvers<void>();
  vi.mocked(window.electronAPI.saveFile).mockImplementationOnce(async () => {
    await saveFileListener(mainWindow)(undefined);
    saved.resolve();
  });
  return {
    clickSave: () =>
      act(() =>
        saveItem.click!({ id: saveItem.id } as MenuItem, mainWindow, {}),
      ),
    saved: saved.promise,
  };
}

test('File → Save writes the current draft before the autosave tick', async () => {
  const { clickSave, saved } = await prepareMenuSave();

  await gotoResource('file');
  await expectFormFieldValues({ name: packageInfo.packageName });
  fillFormField('name', savedName);
  clickSave();

  await act(async () => {
    await saveStarted;
    releaseSave();
    await saved;
  });
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(savedName);
});

test('File → Save writes an already submitted edit without a draft', async () => {
  const { clickSave, saved } = await prepareMenuSave();
  await gotoResource('file');
  await expectFormFieldValues({ name: packageInfo.packageName });
  fillFormField('name', savedName);
  await saveChangesInAttributionColumn();
  await expectFormFieldValues({ name: savedName });
  expect(saveFileModule.saveFile).not.toHaveBeenCalled();

  clickSave();
  releaseSave();
  await act(() => saved);
  expect(packageNameInArchive(readFileSync(firstPath))).toBe(savedName);
});

test('File → Save writes a submitted edit while another resource’s details load', async () => {
  const { clickSave, saved } = await prepareMenuSave();
  await gotoResource('file');
  await expectFormFieldValues({ name: packageInfo.packageName });
  fillFormField('name', savedName);
  await saveChangesInAttributionColumn();

  const detailsQuery = Promise.withResolvers<void>();
  vi.mocked(window.electronAPI.api).mockImplementation(
    async (command, params) => {
      if (
        command === 'getAttributionLinkStatus' &&
        (params as { resourcePath: string }).resourcePath === '/other'
      ) {
        await detailsQuery.promise;
      }
      return client.api(command, params);
    },
  );

  try {
    await userEvent.click(resourceTreeItem('other'));
    await screen.findByTestId('attribution-details-loading');
    expect(saveFileModule.saveFile).not.toHaveBeenCalled();

    clickSave();
    releaseSave();
    await act(() => saved);

    expect(packageNameInArchive(readFileSync(firstPath))).toBe(savedName);
    expect(screen.getByTestId('attribution-details-loading')).toBeVisible();
  } finally {
    await act(async () => {
      detailsQuery.resolve();
      await detailsQuery.promise;
    });
  }
});

test('cancelling the File → Save confirmation skips the archive write', async () => {
  const result = await client.loadFile(secondPath);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  const { clickSave } = await prepareMenuSave(secondPath, result.projectId);
  await gotoResource('file');
  await expectFormFieldValues({ name: packageInfo.packageName });
  fillFormField('name', savedName);

  clickSave();
  await clickPopupButton(
    text.saveAttributionsPopup.ariaLabel,
    text.buttons.cancel,
  );

  expect(saveFileModule.saveFile).not.toHaveBeenCalled();
  expect(packageNameInArchive(readFileSync(secondPath))).toBe(
    packageInfo.packageName,
  );
});

test('persists the submitted change before quitting', async () => {
  const { requestQuit, exited } = await prepareQuit();

  requestQuit();

  await expectSavedBeforeQuitting(exited);
});

test('discards a newer draft and persists the submitted change before quitting', async () => {
  const { requestQuit, exited } = await prepareQuit();
  fillFormField('name', draftName);

  requestQuit();
  await clickPopupButton(
    'unsaved changes popup',
    text.unsavedChangesPopup.discardAndQuit,
  );

  await expectSavedBeforeQuitting(exited);
});

test('persists the submitted change before closing with a crashed renderer', async () => {
  await submitChange();
  const exited = Promise.withResolvers<Buffer>();
  quit.mockImplementation(() => exited.resolve(readFileSync(firstPath)));
  const send = vi.fn();
  const preventDefault = vi.fn();
  const mainWindow = {
    webContents: {
      isDestroyed: () => false,
      isCrashed: () => true,
      send,
    },
  } as unknown as BrowserWindow;

  handleWindowClose(mainWindow, { preventDefault, defaultPrevented: false });

  expect(preventDefault).toHaveBeenCalledOnce();
  expect(send).not.toHaveBeenCalled();
  await saveStarted;
  expect(quit).not.toHaveBeenCalled();
  await expectSavedBeforeQuitting(exited.promise);
});
