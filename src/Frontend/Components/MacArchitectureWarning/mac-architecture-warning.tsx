// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import { useQuery } from '@tanstack/react-query';

import { LATEST_RELEASES_PAGE_URL } from '../../../shared/shared-constants';
import { text } from '../../../shared/text';
import { openUrl } from '../../util/open-url';

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
    <MuiAlert severity={'warning'} sx={{ flexShrink: 0, mx: 2, mt: 1 }}>
      {text.macArchitectureMismatch.warning}{' '}
      <MuiLink
        href={'#'}
        color={'inherit'}
        onClick={(event) => {
          event.preventDefault();
          openUrl(LATEST_RELEASES_PAGE_URL);
        }}
      >
        {text.macArchitectureMismatch.download}
      </MuiLink>
    </MuiAlert>
  );
}
