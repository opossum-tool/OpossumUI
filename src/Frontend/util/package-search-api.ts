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

export interface PackageResponse {
  kind: 'PACKAGE' | 'PROJECT';
  name: string;
  system: string;
}

export interface PackagesResponse {
  results: Array<PackageResponse>;
}

export interface VersionKey {
  system: System;
  name: string;
  version: string;
}

export interface Links {
  origins?: Array<string>;
  homepage?: string;
  issues?: string;
  repo?: string;
}

export interface WebVersionResponse {
  version: {
    licenses: Array<string>;
    links: Links;
  };
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

export interface Version {
  url: string | undefined;
  license: string;
}

export class PackageSearchApi {
  private readonly baseUrlApi = 'https://api.deps.dev';
  private readonly baseUrlWeb = 'https://deps.dev';

  constructor(private readonly httpClient: HttpClient) {}

  private sanitize<T extends object, K extends Array<keyof T>>(
    input: T,
    keys: K,
  ): Pick<T, (typeof keys)[number]> {
    return mapValues(pick(input, keys), (value, key) => {
      const sanitized = value?.toString().trim().toLowerCase();
      return key === 'packageType' && sanitized === 'golang' ? 'go' : sanitized;
    }) as Pick<T, (typeof keys)[number]>;
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
    const data: PackagesResponse = await response.json();

    return data.results
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

  public async getVersion(props: PackageInfo): Promise<Version> {
    const { packageName, packageType, packageVersion } = this.sanitize(props, [
      'packageName',
      'packageType',
      'packageVersion',
    ]);

    if (
      !packageType ||
      !packageName ||
      !packageVersion ||
      !systems.some((type) => type === packageType.toUpperCase())
    ) {
      return { url: undefined, license: '' };
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrlWeb,
      path: `_/s/${packageType}/p/${packageName}/v/${packageVersion}`,
    });
    const {
      version: { links, licenses },
    }: WebVersionResponse = await response.json();

    return {
      url: links.repo || links.homepage || links.origins?.[0],
      license: licenses.join(' AND '),
    };
  }
}

export default new PackageSearchApi(new HttpClient());
