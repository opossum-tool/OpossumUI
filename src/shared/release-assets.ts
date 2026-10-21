// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { OPOSSUM_UI_GITHUB_URL } from './shared-constants';

export const UPDATE_ASSET_NAMES = {
  windows: 'OpossumUI-for-win.exe',
  macIntel: 'OpossumUI-for-mac-intel.zip',
  macArm64: 'OpossumUI-for-mac-arm64.zip',
  linuxSnap: 'OpossumUI-for-linux.snap',
  linuxAppImage: 'OpossumUI-for-linux.AppImage',
} as const;

export function getReleaseAssetDownloadUrl(tag: string, assetName: string) {
  return `${OPOSSUM_UI_GITHUB_URL}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
}

export function getLatestReleaseAssetDownloadUrl(assetName: string) {
  return `${OPOSSUM_UI_GITHUB_URL}/releases/latest/download/${encodeURIComponent(assetName)}`;
}
