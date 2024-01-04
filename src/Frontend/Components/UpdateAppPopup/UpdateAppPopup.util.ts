// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useQuery } from '@tanstack/react-query';

interface LatestReleaseResponse {
  tag_name: string;
  html_url: string;
}

export function useLatestRelease() {
  const { isLoading, data, error } = useQuery({
    queryKey: ['latestRelease'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      );
      const { html_url, tag_name }: LatestReleaseResponse =
        await response.json();

      return { html_url, tag_name };
    },
  });

  return {
    latestReleaseLoading: isLoading,
    latestReleaseError: error,
    latestRelease:
      data?.tag_name && data.html_url
        ? {
            name: data.tag_name,
            url: data.html_url,
          }
        : undefined,
  };
}
