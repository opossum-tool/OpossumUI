// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function openUrl(urlString: string): void {
  if (!urlString.startsWith('https://') && !urlString.startsWith('http://')) {
    urlString = `https://${urlString}`;
  }
  void window.electronAPI.openLink(urlString);
}
