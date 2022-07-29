// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom/extend-expect';

const TEST_TIMEOUT = 15000;
jest.setTimeout(TEST_TIMEOUT);

jest.mock('./src/Frontend/web-workers/get-new-accordion-workers');
jest.mock('./src/Frontend/web-workers/get-new-folder-progress-bar-worker');

beforeAll(() => {
  global.window.electronAPI = {
    openLink: jest.fn().mockReturnValue(Promise.resolve()),
    openFile: jest.fn(),
    deleteFile: jest.fn(),
    keepFile: jest.fn(),
    sendErrorInformation: jest.fn(),
    exportFile: jest.fn(),
    saveFile: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  };

  jest.spyOn(console, 'info').mockImplementation();
});

beforeEach(() => jest.clearAllMocks());
