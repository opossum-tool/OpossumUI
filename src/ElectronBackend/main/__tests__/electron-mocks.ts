// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
export const menuMock = {
  Menu: {
    setApplicationMenu: vi.fn(),
    buildFromTemplate: vi.fn(),
    getApplicationMenu: vi.fn(),
  },
};

export const screenMock = {
  screen: {
    getPrimaryDisplay: (): {
      workAreaSize: { width: number; height: number };
    } => ({
      workAreaSize: { width: 1920, height: 1080 },
    }),
  },
};
