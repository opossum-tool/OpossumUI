// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';
import AdmZip from 'adm-zip';
import type {
  BrowserWindow,
  IpcMainInvokeEvent,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';
import { readFileSync } from 'node:fs';

import * as saveFileModule from '../ElectronBackend/api/saveFile';
import {
  type DbProcessRequest,
  handleDbProcessMessage,
  resetDbProcessStateForTesting,
} from '../ElectronBackend/dbProcess/dbProcess';
import * as dbProcessClientModule from '../ElectronBackend/dbProcess/dbProcessClient';
import * as dialogs from '../ElectronBackend/main/dialogs';
import { setGlobalBackendState } from '../ElectronBackend/main/globalBackendState';
import { openFileListener } from '../ElectronBackend/main/listeners';
import { getFileMenu } from '../ElectronBackend/main/menu/fileMenu';
import { menuItemIds } from '../ElectronBackend/main/menu/menuItemIds';
import {
  confirmQuit,
  resetQuitStateForTesting,
} from '../ElectronBackend/main/quit-handling';
import type { OpossumOutputFile } from '../ElectronBackend/types/types';
import { setDatabaseInitialized } from '../Frontend/util/backendClient';
import { AllowedFrontendChannels } from '../shared/ipc-channels';
import { text } from '../shared/text';
import { writeOpossumFile } from '../shared/write-file';
import { OUTPUT_FILE_NAME } from '../shared/write-file-utils';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  clickPopupButton,
  expectFormFieldValues,
  fillFormField,
  gotoResource,
  saveChangesInAttributionColumn,
} from '../testing/ui';

const { quit, getUserSetting } = vi.hoisted(() => ({
  quit: vi.fn(),
  getUserSetting: vi.fn(),
}));
vi.mock('electron', () => ({ app: { quit } }));
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
const draftName = 'unsubmitted draft';

// Keep the real request/response client and DB-process handler, replacing only
// the Electron MessagePort transport with an in-process connection.
function createClient() {
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
  return new dbProcessClientModule.DbProcessClient(port);
}

let client: dbProcessClientModule.DbProcessClient;
let firstPath: string;
let secondPath: string;
let releaseSave: () => void;
let saveStarted: Promise<void>;

beforeEach(async () => {
  resetDbProcessStateForTesting();
  resetQuitStateForTesting();
  setGlobalBackendState({});
  client = createClient();
  vi.spyOn(dbProcessClientModule, 'getMainDbClient').mockReturnValue(client);
  vi.mocked(window.electronAPI.api).mockImplementation(client.api.bind(client));
  vi.mocked(window.electronAPI.whenBackendIdle).mockImplementation(async () => {
    await client.waitForPendingSaves();
  });
  vi.mocked(window.electronAPI.confirmQuit).mockImplementation(confirmQuit);

  firstPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  secondPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  vi.spyOn(dialogs, 'openOpossumFileDialog').mockReturnValue([secondPath]);
  for (const path of [firstPath, secondPath]) {
    const metadata = faker.opossum.metadata();
    await writeOpossumFile({
      path,
      input: faker.opossum.inputData({
        metadata,
        resources: { file: 1 },
        externalAttributions: {},
        resourcesToAttributions: {},
      }),
      output: faker.opossum.outputData({
        metadata,
        manualAttributions: { [attributionId]: packageInfo },
        resourcesToAttributions: { '/file': [attributionId] },
      }),
    });
  }
  const result = await client.loadFile(firstPath);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
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
  releaseSave();
  await client.waitForPendingSaves();
  vi.mocked(saveFileModule.saveFile).mockRestore();
  vi.mocked(dbProcessClientModule.getMainDbClient).mockRestore();
  vi.mocked(dialogs.openOpossumFileDialog).mockRestore();
  vi.mocked(window.electronAPI.openFile).mockReset();
  vi.mocked(window.electronAPI.confirmQuit).mockReset();
  vi.mocked(window.electronAPI.whenBackendIdle).mockReset();
  quit.mockReset();
});

async function submitChange() {
  const view = await renderApp();
  await gotoResource('file');
  await expectFormFieldValues({ name: packageInfo.packageName });
  fillFormField('name', savedName);
  await saveChangesInAttributionColumn();
  await saveStarted;
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
    releaseSave();
    expect(packageNameInArchive(await exited)).toBe(savedName);
  });
  expect(quit).toHaveBeenCalledOnce();
}

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

test('persists the submitted change when the main process quits without renderer approval', async () => {
  await submitChange();
  const exited = Promise.withResolvers<Buffer>();
  quit.mockImplementation(() => exited.resolve(readFileSync(firstPath)));

  // The unresponsive-renderer fallback calls confirmQuit directly. Its save
  // barrier must work independently of the renderer's approval flow.
  const quitting = confirmQuit();
  releaseSave();
  await quitting;

  expect(packageNameInArchive(await exited.promise)).toBe(savedName);
  expect(quit).toHaveBeenCalledOnce();
});
