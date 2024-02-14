// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../shared/text';

export interface RequestProps {
  baseUrl: string;
  body?: object;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | undefined>;
  path?: string;
  throwForStatus?: boolean;
}

export class HttpClient {
  public async request({
    baseUrl,
    body,
    headers,
    method = 'GET',
    params = {},
    path,
    throwForStatus = true,
  }: RequestProps): Promise<Response> {
    const url = path ? new URL(path, baseUrl) : new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok && throwForStatus) {
      throw new Error(
        `${response.status}(${response.statusText || text.generic.unknown})`,
      );
    }

    return response;
  }
}
