// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compareVersions, validate } from 'compare-versions';
import { compact, mapValues, partition, pick } from 'lodash';

import {
  AutocompleteSignal,
  PackageInfo,
  Source,
} from '../../shared/shared-types';
import { text } from '../../shared/text';
import { HttpClient } from './http-client';

export const packageSystems = [
  'GO',
  'NPM',
  'CARGO',
  'MAVEN',
  'PYPI',
  'NUGET',
] as const;
export type PackageSystem = (typeof packageSystems)[number];

export const projectTypes = ['GITHUB', 'GITLAB', 'BITBUCKET'] as const;
export type ProjectType = (typeof projectTypes)[number];

export interface PackageSuggestion {
  kind: 'PACKAGE';
  name: string;
  system: PackageSystem;
  projectType?: never;
}

export interface ProjectSuggestion {
  kind: 'PROJECT';
  name: string;
  system?: never;
  projectType: ProjectType;
}

export interface AdvisorySuggestion {
  kind: 'ADVISORY';
  name: string;
  system?: never;
  projectType?: never;
}

export type SearchSuggestion =
  | PackageSuggestion
  | ProjectSuggestion
  | AdvisorySuggestion;

export interface SearchSuggestionResponse {
  results: Array<SearchSuggestion>;
}

export interface ProjectResponse {
  license: string;
}

export interface VersionKey {
  system: PackageSystem;
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

export type UrlAndLicense = Pick<PackageInfo, 'url' | 'licenseName'>;

export class PackageSearchApi {
  private readonly baseUrlApi = 'https://api.deps.dev';
  private readonly baseUrlWeb = 'https://deps.dev';
  private readonly projectTypeDomains: Record<ProjectType, string> = {
    GITHUB: 'github.com',
    GITLAB: 'gitlab.com',
    BITBUCKET: 'bitbucket.org',
  };

  constructor(private readonly httpClient: HttpClient) {}

  private deserialize(input: PackageInfo): Partial<SearchSuggestion> {
    const { packageName, packageNamespace, packageType } = mapValues(
      pick(input, ['packageName', 'packageNamespace', 'packageType']),
      (value) => value?.trim().toLowerCase(),
    );

    if (
      packageType &&
      [...packageSystems, 'golang'].some(
        (system) => system.toLowerCase() === packageType,
      )
    ) {
      return {
        kind: 'PACKAGE',
        name:
          packageType === 'maven'
            ? compact([packageNamespace, packageName]).join(':')
            : packageName,
        system:
          packageType === 'golang'
            ? 'GO'
            : (packageType.toUpperCase() as PackageSystem),
        projectType: undefined,
      };
    }

    if (
      packageType &&
      projectTypes.some((type) => type.toLowerCase() === packageType)
    ) {
      return {
        kind: 'PROJECT',
        name: compact([packageNamespace, packageName]).join('/'),
        system: undefined,
        projectType: packageType.toUpperCase() as ProjectType,
      };
    }

    return {
      kind: undefined,
      name: packageName,
      system: undefined,
      projectType: undefined,
    };
  }

  private serialize({
    name,
    system,
    projectType,
    version,
  }: {
    name: string;
    version?: string;
    system?: PackageSystem;
    projectType?: ProjectType;
  }): PackageInfo {
    const type = system || projectType;
    const source: Source = {
      name: text.attributionColumn.openSourceInsights,
      documentConfidence: 100,
    };
    switch (type) {
      case 'MAVEN': {
        const [packageNamespace, packageName] = name.split(':');
        return {
          packageName,
          packageNamespace,
          packageType: 'maven',
          packageVersion: version,
          source,
        };
      }
      case 'GITHUB':
      case 'GITLAB':
      case 'BITBUCKET': {
        const [packageNamespace, packageName] = name.split('/');
        return {
          packageName,
          packageNamespace,
          packageType: type.toLowerCase(),
          packageVersion: version,
          source,
          url: `https://${this.projectTypeDomains[type]}/${name}`,
        };
      }
      case 'GO': {
        return {
          packageName: name,
          packageNamespace: undefined,
          packageType: 'golang',
          packageVersion: version,
          source,
        };
      }
      default: {
        return {
          packageName: name,
          packageNamespace: undefined,
          packageType: type?.toLowerCase(),
          packageVersion: version,
          source,
        };
      }
    }
  }

  public async getNames(
    props: PackageInfo,
  ): Promise<Array<AutocompleteSignal>> {
    const { name } = this.deserialize(props);
    if (!name) {
      return [];
    }
    const response = await this.httpClient.request({
      baseUrl: this.baseUrlWeb, // endpoint not available via API
      path: '/_/search/suggest',
      params: {
        q: name,
      },
    });
    const data: SearchSuggestionResponse = await response.json();

    return data.results
      .filter(({ kind }) => kind !== 'ADVISORY')
      .map<AutocompleteSignal>(({ name, system, projectType }) =>
        this.serialize({ name, system, projectType }),
      );
  }

  public async getVersions(props: PackageInfo): Promise<Versions> {
    const { name, system } = this.deserialize(props);

    if (!system || !name) {
      return { default: [], other: [] };
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrlApi,
      path: `/v3alpha/systems/${system}/packages/${encodeURIComponent(name)}`,
    });
    const { versions }: VersionsResponse = await response.json();

    const [defaultVersions, otherVersions] = partition(
      versions
        .sort((a, b) => {
          const v1 = a.versionKey.version;
          const v2 = b.versionKey.version;
          return validate(v1) && validate(v2) ? compareVersions(v1, v2) : 0;
        })
        .reverse(),
      ({ isDefault }) => isDefault,
    );

    return {
      default: defaultVersions.map<AutocompleteSignal>(
        ({ versionKey: { name, system, version } }) => ({
          ...this.serialize({ name, system, version }),
          suffix: '(default)',
        }),
      ),
      other: otherVersions.map<AutocompleteSignal>(
        ({ versionKey: { name, system, version } }) =>
          this.serialize({ name, system, version }),
      ),
    };
  }

  public async getUrlAndLicense({
    url,
    licenseName,
    packageVersion,
    ...props
  }: PackageInfo): Promise<UrlAndLicense> {
    const { name, projectType, system, kind } = this.deserialize(props);

    if (kind && name && system && packageVersion) {
      return this.getPackageUrlAndLicense({
        kind,
        name,
        system,
        url,
        licenseName,
        packageVersion,
      });
    }

    if (kind && name && projectType) {
      return this.getProjectUrlAndLicense({
        kind,
        name,
        projectType,
        url,
        licenseName,
      });
    }

    return { url, licenseName };
  }

  private async getPackageUrlAndLicense({
    name,
    system,
    url,
    licenseName,
    packageVersion,
  }: PackageSuggestion &
    UrlAndLicense & { packageVersion: string }): Promise<UrlAndLicense> {
    if ((url && licenseName) || !packageVersion) {
      return { url, licenseName };
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrlWeb, // website provides source repo URL in a better format than API
      path: `/_/s/${system}/p/${encodeURIComponent(
        name,
      )}/v/${encodeURIComponent(packageVersion)}`,
    });

    if (!response.ok) {
      return { url, licenseName };
    }

    const {
      version: { links, licenses },
    }: WebVersionResponse = await response.json();

    return {
      url: url || links.repo || links.homepage || links.origins?.[0],
      licenseName: licenseName || licenses.join(' AND '),
    };
  }

  private async getProjectUrlAndLicense({
    name,
    projectType,
    url,
    licenseName,
  }: ProjectSuggestion & UrlAndLicense): Promise<UrlAndLicense> {
    if (url && licenseName) {
      return { url, licenseName };
    }

    const projectId = `${this.projectTypeDomains[projectType]}/${name}`;

    const response = await this.httpClient.request({
      baseUrl: this.baseUrlApi,
      path: `/v3alpha/projects/${encodeURIComponent(projectId)}`,
    });

    if (!response.ok) {
      return { url, licenseName };
    }

    const data: ProjectResponse = await response.json();

    return {
      url: url || `https://${projectId}`,
      licenseName: licenseName || data.license,
    };
  }
}

export default new PackageSearchApi(new HttpClient());
