// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
export function getMacArchitectureMismatch(
  platform: NodeJS.Platform,
  runningUnderARM64Translation: boolean,
): boolean {
  return platform === 'darwin' && runningUnderARM64Translation;
}
