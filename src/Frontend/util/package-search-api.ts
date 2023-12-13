// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compareVersions } from 'compare-versions';
import { mapValues, partition, pick } from 'lodash';

import { AutocompleteSignal, PackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { HttpClient } from './http-client';

export const systems = [
  'GO',
  'NPM',
  'CARGO',
  'MAVEN',
  'PYPI',
  'NUGET',
] as const;
export type System = (typeof systems)[number];

export interface SearchResponse {
  kind: 'PACKAGE' | 'PROJECT';
  name: string;
  system: string;
}

export interface RawSearchResponse {
  results: Array<SearchResponse>;
}

export interface VersionKey {
  system: System;
  name: string;
  version: string;
}

export interface VersionResponse {
  versionKey: VersionKey;
  publishedAt: string;
  isDefault: boolean;
}

export interface VersionsResponse {
  versions: Array<VersionResponse>;
}

export interface Versions {
  default: Array<AutocompleteSignal>;
  other: Array<AutocompleteSignal>;
}

export class PackageSearchApi {
  private readonly baseUrlApi = 'https://api.deps.dev';
  private readonly baseUrlWeb = 'https://deps.dev';

  constructor(private readonly httpClient: HttpClient) {}

  private sanitize<T extends object, K extends Array<keyof T>>(
    input: T,
    keys: K,
  ): Pick<T, (typeof keys)[number]> {
    return mapValues(
      pick(input, keys),
      (value) => value?.toString().trim().toLowerCase(),
    ) as Pick<T, (typeof keys)[number]>;
  }

  public async getPackages(
    props: PackageInfo,
  ): Promise<Array<AutocompleteSignal>> {
    const { packageName } = this.sanitize(props, ['packageName']);
    if (!packageName) {
      return [];
    }
    const response = await this.httpClient.request({
      baseUrl: this.baseUrlWeb,
      path: '/_/search/suggest',
      params: {
        q: packageName,
      },
    });
    const data: Array<SearchResponse> = (await response.json()).results;

    return data
      .filter((searchResponse) => searchResponse.kind === 'PACKAGE')
      .map<AutocompleteSignal>(({ name, system }) => ({
        packageName: name,
        packageType: system.toLowerCase(),
        source: {
          name: text.attributionColumn.depsDev,
          documentConfidence: 100,
        },
      }));
  }

  public async getVersions(props: PackageInfo): Promise<Versions> {
    const { packageName, packageType } = this.sanitize(props, [
      'packageName',
      'packageType',
    ]);

    if (
      !packageType ||
      !packageName ||
      !systems.some((type) => type === packageType.toUpperCase())
    ) {
      return { default: [], other: [] };
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrlApi,
      path: `/v3alpha/systems/${packageType}/packages/${packageName}`,
    });
    const { versions }: VersionsResponse = await response.json();

    const [defaultVersions, otherVersions] = partition(
      versions
        .sort((a, b) =>
          compareVersions(a.versionKey.version, b.versionKey.version),
        )
        .reverse(),
      ({ isDefault }) => isDefault,
    );

    return {
      default: defaultVersions.map<AutocompleteSignal>(
        ({ versionKey: { name, system, version } }) => ({
          packageName: name,
          packageType: system.toLowerCase(),
          packageVersion: version,
          source: {
            name: text.attributionColumn.depsDev,
            documentConfidence: 100,
          },
          suffix: '(default)',
        }),
      ),
      other: otherVersions.map<AutocompleteSignal>(
        ({ versionKey: { name, system, version } }) => ({
          packageName: name,
          packageType: system.toLowerCase(),
          packageVersion: version,
          source: {
            name: text.attributionColumn.depsDev,
            documentConfidence: 100,
          },
        }),
      ),
    };
  }
}

export default new PackageSearchApi(new HttpClient());
