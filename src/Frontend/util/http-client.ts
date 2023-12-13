// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface RequestProps {
  baseUrl: string;
  body?: object;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | undefined>;
  path?: string;
}

export class HttpClient {
  public request({
    baseUrl,
    body,
    headers,
    method = 'GET',
    params = {},
    path,
  }: RequestProps): Promise<Response> {
    const url = path ? new URL(path, baseUrl) : new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });

    return fetch(url, { method, headers, body: JSON.stringify(body) });
  }
}
