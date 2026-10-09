// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Rectangle } from 'electron';

export const menuMock = {
  Menu: {
    setApplicationMenu: vi.fn(),
    buildFromTemplate: vi.fn(),
    getApplicationMenu: vi.fn(),
  },
};

const DEFAULT_WORK_AREA_SIZE = { width: 1920, height: 1080 };

let workAreaSize: { width: number; height: number } = DEFAULT_WORK_AREA_SIZE;
let nearestPointWorkAreaSize: { width: number; height: number } =
  DEFAULT_WORK_AREA_SIZE;

export const setWorkAreaSize = (width: number, height: number): void => {
  workAreaSize = { width, height };
};

export const setNearestPointWorkAreaSize = (
  width: number,
  height: number,
): void => {
  nearestPointWorkAreaSize = { width, height };
};

export const resetWorkAreaSize = (): void => {
  workAreaSize = { ...DEFAULT_WORK_AREA_SIZE };
  nearestPointWorkAreaSize = { ...DEFAULT_WORK_AREA_SIZE };
};

const createDisplayMock = (size: {
  width: number;
  height: number;
}): {
  workArea: Rectangle;
  workAreaSize: { width: number; height: number };
} => ({
  workArea: { x: 0, y: 0, width: size.width, height: size.height },
  workAreaSize: size,
});

export const screenMock = {
  screen: {
    getCursorScreenPoint: (): { x: number; y: number } => ({ x: 0, y: 0 }),
    getDisplayNearestPoint: (): {
      workArea: Rectangle;
      workAreaSize: { width: number; height: number };
    } => createDisplayMock(nearestPointWorkAreaSize),
    getPrimaryDisplay: (): {
      workAreaSize: { width: number; height: number };
    } => createDisplayMock(workAreaSize),
  },
};
