// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';

import { getReleaseAssetDownloadUrl } from '../../shared/release-assets';
import { OPOSSUM_UI_GITHUB_URL } from '../../shared/shared-constants';
import {
  formatReleaseTag,
  parseInstalledVersion,
} from '../../shared/update-version';

export function getUserGuideUrl(): string {
  const version = app.isPackaged
    ? parseInstalledVersion(app.getVersion())
    : undefined;
  return version
    ? getReleaseAssetDownloadUrl(formatReleaseTag(version), 'USER_GUIDE.html')
    : `${OPOSSUM_UI_GITHUB_URL}/blob/main/USER_GUIDE.md`;
}
