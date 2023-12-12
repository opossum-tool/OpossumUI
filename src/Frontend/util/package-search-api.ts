// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface SearchSuggestion {
  kind: 'PACKAGE' | 'PROJECT';
  name: string;
  system: string;
}

export class PackageSearchApi {
  private static async request({
    params = {},
    path,
  }: {
    path: string;
    params?: Record<string, string | number | undefined>;
  }) {
    const url = new URL(path, 'https://deps.dev');

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url);

    return response;
  }
  public static async getSuggestions(
    searchTerm: string,
  ): Promise<Array<SearchSuggestion>> {
    const response = await this.request({
      path: '/_/search/suggest',
      params: {
        q: searchTerm,
      },
    });
    return response.json();
  }
}
