// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compareVersions, validate } from 'compare-versions';
import { compact, mapValues, partition } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { PackageInfo, Source } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { HttpClient } from './http-client';
import { pick } from './lodash-extension-utils';

const DEPS_DEV_NON_STANDARD_LICENSE_MARKER = 'non-standard';
const COPYRIGHT_REGEX = /^Copyright \(c\).*$/gm;
const GITHUB_REGEX = /^https:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)/;
const GITLAB_REGEX = /^https:\/\/(www\.)?gitlab\.com\/([^\/]+)\/([^\/]+)/;

export const packageSystems = [
  'GO',
  'NPM',
  'CARGO',
  'MAVEN',
  'PYPI',
  'NUGET',
] as const;
export type PackageSystem = (typeof packageSystems)[number];

export const packageSystemsRequiringNamespace: Array<PackageSystem> = ['MAVEN'];

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
    description?: string;
    licenses?: Array<string>;
    links?: Links;
  };
}

export interface VersionResponse {
  versionKey: VersionKey;
  publishedAt: string;
  isDefault: boolean;
}

export interface DefaultVersionResponse {
  defaultVersion: string;
}

export interface VersionsResponse {
  versions: Array<VersionResponse>;
}

export interface GitHubLicenseResponse {
  license: { name: string } | null;
  content: string;
}

export interface TagResponse {
  name: string;
}

export interface GitLabProjectResponse {
  license: { name: string } | null;
  license_url?: string;
}

export interface GitLabLicenseResponse {
  content: string;
}

export class PackageSearchApi {
  private readonly baseUrls = {
    GITHUB: 'https://api.github.com/',
    GITLAB: 'https://gitlab.com/api/v4/',
    DEPS_DEV_WEB: 'https://deps.dev/_/',
    DEPS_DEV_API: 'https://api.deps.dev/v3alpha/',
  } as const;
  private readonly projectTypeDomains: Record<ProjectType, string> = {
    GITHUB: 'github.com',
    GITLAB: 'gitlab.com',
    BITBUCKET: 'bitbucket.org',
  };

  constructor(private readonly httpClient: HttpClient) {}

  private deserialize(
    input: PackageInfo,
  ): Partial<SearchSuggestion> & { isComplete: boolean } {
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
        isComplete:
          packageType === 'maven'
            ? !!packageName && !!packageNamespace
            : !!packageName,
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
        isComplete: !!packageName && !!packageNamespace,
      };
    }

    return {
      kind: undefined,
      name: packageName,
      system: undefined,
      projectType: undefined,
      isComplete: false,
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
    };
    switch (type) {
      case 'MAVEN': {
        const [packageNamespace, packageName] = name.split(':');
        return {
          synthetic: true,
          id: uuid4(),
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
          synthetic: true,
          id: uuid4(),
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
          synthetic: true,
          id: uuid4(),
          packageName: name,
          packageNamespace: undefined,
          packageType: 'golang',
          packageVersion: version,
          source,
        };
      }
      default: {
        return {
          synthetic: true,
          id: uuid4(),
          packageName: name,
          packageNamespace: undefined,
          packageType: type?.toLowerCase(),
          packageVersion: version,
          source,
        };
      }
    }
  }

  public async getNames(props: PackageInfo): Promise<Array<PackageInfo>> {
    const { name } = this.deserialize(props);

    if (!name) {
      return [];
    }
    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // endpoint not available via API
      path: 'search/suggest',
      params: {
        q: name,
      },
    });

    const data: SearchSuggestionResponse = await response.json();

    return data.results
      .filter(({ kind }) => kind !== 'ADVISORY')
      .map<PackageInfo>(({ name, system, projectType }) =>
        this.serialize({ name, system, projectType }),
      );
  }

  public async getNamespaces(props: PackageInfo): Promise<Array<PackageInfo>> {
    const { kind, name, system, projectType } = this.deserialize(props);

    if (
      !name ||
      (!system && !projectType) ||
      (system && !packageSystemsRequiringNamespace.includes(system))
    ) {
      return [];
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // endpoint not available via API
      path: 'search/suggest',
      params: { q: name, kind, ...(system && { system }) },
    });
    const data: SearchSuggestionResponse = await response.json();

    return data.results.map<PackageInfo>(({ name, system, projectType }) =>
      this.serialize({ name, system, projectType }),
    );
  }

  public getVersions({
    packageVersion,
    ...props
  }: PackageInfo): Promise<Array<PackageInfo>> {
    const { isComplete, kind, name, projectType, system } =
      this.deserialize(props);

    if (isComplete && kind && system && name) {
      return this.getSystemPackageVersions({ kind, name, projectType, system });
    }

    if (isComplete && kind && projectType && name) {
      return this.getProjectPackageVersions({
        kind,
        name,
        projectType,
        system,
        packageVersion,
      });
    }

    return Promise.resolve([]);
  }

  private async getSystemPackageVersions({
    name,
    system,
  }: PackageSuggestion): Promise<Array<PackageInfo>> {
    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_API,
      path: `systems/${system}/packages/${encodeURIComponent(name)}`,
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

    return [
      ...defaultVersions.map<PackageInfo>(
        ({ versionKey: { name, system, version } }) => ({
          ...this.serialize({ name, system, version }),
          suffix: '(default)',
        }),
      ),
      ...otherVersions.map<PackageInfo>(
        ({ versionKey: { name, system, version } }) =>
          this.serialize({ name, system, version }),
      ),
    ];
  }

  private async getProjectPackageVersions({
    name,
    projectType,
    system,
    packageVersion,
  }: ProjectSuggestion & { packageVersion: string | undefined }): Promise<
    Array<PackageInfo>
  > {
    switch (projectType) {
      case 'GITHUB': {
        const response = await this.httpClient.request({
          baseUrl: this.baseUrls.GITHUB,
          path: `repos/${name}/tags`,
          params: { per_page: 100 },
        });

        const tags: Array<TagResponse> = await response.json();

        return tags.map((tag) =>
          this.serialize({ name, projectType, system, version: tag.name }),
        );
      }
      case 'GITLAB': {
        const response = await this.httpClient.request({
          baseUrl: this.baseUrls.GITLAB,
          path: `projects/${encodeURIComponent(name)}/repository/tags`,
          params: { search: packageVersion, per_page: 100 },
        });

        const tags: Array<TagResponse> = await response.json();

        return tags.map((tag) =>
          this.serialize({ name, projectType, system, version: tag.name }),
        );
      }
      default:
        return [];
    }
  }

  public async enrichPackageInfo(
    packageInfo: PackageInfo,
  ): Promise<PackageInfo> {
    if (packageInfo.url && packageInfo.copyright && packageInfo.licenseName) {
      return packageInfo;
    }

    const { isComplete, name, projectType, system, kind } =
      this.deserialize(packageInfo);

    if (isComplete && kind && name && system) {
      return this.enrichSystemPackageInfo({
        ...packageInfo,
        kind,
        name,
        system,
      });
    }

    if (isComplete && kind && name && projectType) {
      return this.enrichProjectPackageInfo({
        ...packageInfo,
        kind,
        name,
        projectType,
      });
    }

    throw new Error(text.attributionColumn.enrichFailure);
  }

  private async enrichSystemPackageInfo({
    kind,
    name,
    system,
    ...packageInfo
  }: PackageSuggestion & PackageInfo): Promise<PackageInfo> {
    const effectiveVersion =
      packageInfo.packageVersion ||
      (await this.getSystemPackageDefaultVersion({
        kind,
        name,
        system,
      }));

    if (!effectiveVersion) {
      return packageInfo;
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // website provides source repo URL in a better format than API
      path: `s/${system}/p/${encodeURIComponent(name)}/v/${encodeURIComponent(
        effectiveVersion,
      )}`,
    });

    const {
      version: { links, licenses, description },
    }: WebVersionResponse = await response.json();

    return this.enrichPackageInfoViaRepoUrl({
      ...packageInfo,
      comment:
        packageInfo.comment ||
        [
          ...(description
            ? [`${text.attributionColumn.description}: ${description}`]
            : []),
          ...(links?.homepage
            ? [`${text.attributionColumn.homepage}: ${links.homepage}`]
            : []),
          ...(links?.origins?.length
            ? links.origins.map(
                (origin, index, origins) =>
                  `${text.attributionColumn.origin}${
                    origins.length > 1 ? ` #${index + 1}` : ''
                  }: ${origin}`,
              )
            : []),
        ].join('\n'),
      licenseName:
        packageInfo.licenseName ||
        licenses
          ?.filter(
            (license) => license !== DEPS_DEV_NON_STANDARD_LICENSE_MARKER,
          )
          .join(' AND '),
      url: packageInfo.url || links?.repo,
    });
  }

  private async getSystemPackageDefaultVersion({
    name,
    system,
  }: PackageSuggestion): Promise<string | undefined> {
    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // endpoint not available via API
      path: `s/${system}/p/${encodeURIComponent(name)}/v/`,
    });

    const { defaultVersion }: DefaultVersionResponse = await response.json();

    return defaultVersion;
  }

  private enrichProjectPackageInfo({
    name,
    projectType,
    ...packageInfo
  }: ProjectSuggestion & PackageInfo): Promise<PackageInfo> {
    return this.enrichPackageInfoViaRepoUrl({
      ...packageInfo,
      url:
        packageInfo.url ||
        `https://${this.projectTypeDomains[projectType]}/${name}`,
    });
  }

  private async enrichPackageInfoViaRepoUrl(
    packageInfo: PackageInfo,
  ): Promise<PackageInfo> {
    if (packageInfo.copyright && packageInfo.licenseName) {
      return packageInfo;
    }

    const githubMatch = packageInfo.url?.match(GITHUB_REGEX);

    if (githubMatch) {
      const response = await this.httpClient.request({
        baseUrl: this.baseUrls.GITHUB,
        path: `repos/${githubMatch[2]}/${githubMatch[3]}/license`,
      });

      const { license, content }: GitHubLicenseResponse = await response.json();

      return {
        ...packageInfo,
        copyright:
          packageInfo.copyright || this.getCopyrightFromFileContent(content),
        licenseName: packageInfo.licenseName || license?.name,
      };
    }

    const gitlabMatch = packageInfo.url?.match(GITLAB_REGEX);

    if (gitlabMatch) {
      const response = await this.httpClient.request({
        baseUrl: this.baseUrls.GITLAB,
        path: `projects/${gitlabMatch[2]}%2F${gitlabMatch[3]}`,
        params: { license: 'true' },
      });

      const { license_url: licenseUrl, license }: GitLabProjectResponse =
        await response.json();

      if (licenseUrl) {
        const [fileName, ref] = licenseUrl.split('/').reverse();

        const licenseResponse = await this.httpClient.request({
          baseUrl: this.baseUrls.GITLAB,
          path: `projects/${gitlabMatch[2]}%2F${gitlabMatch[3]}/repository/files/${fileName}`,
          params: { ref },
        });

        if (!licenseResponse.ok) {
          return {
            ...packageInfo,
            licenseName: packageInfo.licenseName || license?.name,
          };
        }

        const { content }: GitLabLicenseResponse = await licenseResponse.json();

        return {
          ...packageInfo,
          copyright:
            packageInfo.copyright || this.getCopyrightFromFileContent(content),
          licenseName: packageInfo.licenseName || license?.name,
        };
      }

      return {
        ...packageInfo,
        licenseName: packageInfo.licenseName || license?.name,
      };
    }

    return packageInfo;
  }

  private getCopyrightFromFileContent(content: string) {
    return atob(content).match(COPYRIGHT_REGEX)?.join('\n');
  }
}

export default new PackageSearchApi(new HttpClient());
