// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import axios from 'axios';

export async function searchLatestReleaseNameAndUrl(): Promise<{
  name: string;
  url: string;
} | null> {
  const response = await axios.get(
    'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
  );
  if (!response.data) {
    return null;
  }
  const name = response.data.name as string;
  const url = response.data.html_url as string;
  return { name, url };
}
