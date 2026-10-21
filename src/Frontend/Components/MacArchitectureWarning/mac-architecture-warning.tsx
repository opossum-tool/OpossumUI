// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import { useQuery } from '@tanstack/react-query';

import {
  getLatestReleaseAssetDownloadUrl,
  UPDATE_ASSET_NAMES,
} from '../../../shared/release-assets';
import { text } from '../../../shared/text';
import { openUrl } from '../../util/open-url';
import { NotificationBanner } from '../NotificationBanner/NotificationBanner';

export function MacArchitectureWarning(): React.ReactNode {
  const { data, isSuccess } = useQuery({
    queryKey: ['macArchitectureMismatch'],
    queryFn: () => window.electronAPI.getMacArchitectureMismatch(),
    staleTime: Infinity,
    retry: false,
  });

  if (!isSuccess || !data) {
    return null;
  }

  return (
    <NotificationBanner severity={'warning'}>
      {text.macArchitectureMismatch.warning}{' '}
      <MuiLink
        href={'#'}
        color={'inherit'}
        onClick={(event) => {
          event.preventDefault();
          openUrl(
            getLatestReleaseAssetDownloadUrl(UPDATE_ASSET_NAMES.macArm64),
          );
        }}
      >
        {text.macArchitectureMismatch.download}
      </MuiLink>
    </NotificationBanner>
  );
}
