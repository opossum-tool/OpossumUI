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
    licenses: Array<string>;
    links: Links;
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

export interface LatestReleaseResponse {
  tag_name?: string;
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

export type UrlAndLegal = Pick<
  PackageInfo,
  'url' | 'licenseName' | 'copyright' | 'packageVersion'
>;

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
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // endpoint not available via API
      path: 'search/suggest',
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

  public async getNamespaces(
    props: PackageInfo,
  ): Promise<Array<AutocompleteSignal>> {
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

    return data.results.map<AutocompleteSignal>(
      ({ name, system, projectType }) =>
        this.serialize({ name, system, projectType }),
    );
  }

  public getVersions({
    packageVersion,
    ...props
  }: PackageInfo): Promise<Array<AutocompleteSignal>> {
    const { isComplete, kind, name, projectType, system } =
      this.deserialize(props);

    if (isComplete && kind && system && name) {
      return this.getPackageVersions({ kind, name, projectType, system });
    }

    if (isComplete && kind && projectType && name) {
      return this.getProjectVersions({
        kind,
        name,
        projectType,
        system,
        packageVersion,
      });
    }

    return Promise.resolve([]);
  }

  private async getPackageVersions({
    name,
    system,
  }: PackageSuggestion): Promise<Array<AutocompleteSignal>> {
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
      ...defaultVersions.map<AutocompleteSignal>(
        ({ versionKey: { name, system, version } }) => ({
          ...this.serialize({ name, system, version }),
          suffix: '(default)',
        }),
      ),
      ...otherVersions.map<AutocompleteSignal>(
        ({ versionKey: { name, system, version } }) =>
          this.serialize({ name, system, version }),
      ),
    ];
  }

  private async getProjectVersions({
    name,
    projectType,
    system,
    packageVersion,
  }: ProjectSuggestion & { packageVersion: string | undefined }): Promise<
    Array<AutocompleteSignal>
  > {
    switch (projectType) {
      case 'GITHUB': {
        const response = await this.httpClient.request({
          baseUrl: this.baseUrls.GITHUB,
          path: `repos/${name}/tags`,
          params: { per_page: 100 },
        });

        if (!response.ok) {
          return [];
        }

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

        if (!response.ok) {
          return [];
        }

        const tags: Array<TagResponse> = await response.json();

        return tags.map((tag) =>
          this.serialize({ name, projectType, system, version: tag.name }),
        );
      }
      default:
        return [];
    }
  }

  public getUrlAndLegal({
    url,
    licenseName,
    packageVersion,
    copyright,
    ...props
  }: PackageInfo): Promise<UrlAndLegal> {
    const { isComplete, name, projectType, system, kind } =
      this.deserialize(props);

    if (isComplete && kind && name && system) {
      return this.getPackageUrlAndLegal({
        copyright,
        kind,
        licenseName,
        name,
        packageVersion,
        system,
        url,
      });
    }

    if (isComplete && kind && name && projectType) {
      return this.getProjectUrlAndLegal({
        copyright,
        kind,
        licenseName,
        name,
        packageVersion,
        projectType,
        url,
      });
    }

    return Promise.resolve({ url, licenseName, copyright, packageVersion });
  }

  private async getPackageUrlAndLegal({
    copyright,
    kind,
    licenseName,
    name,
    packageVersion,
    projectType,
    system,
    url,
  }: PackageSuggestion & UrlAndLegal): Promise<UrlAndLegal> {
    const effectiveVersion =
      packageVersion ||
      (await this.getPackageDefaultVersion({
        kind,
        name,
        projectType,
        system,
      }));

    if (!effectiveVersion) {
      return { url, licenseName, copyright, packageVersion };
    }

    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // website provides source repo URL in a better format than API
      path: `s/${system}/p/${encodeURIComponent(name)}/v/${encodeURIComponent(
        effectiveVersion,
      )}`,
    });

    if (!response.ok) {
      return { url, licenseName, copyright, packageVersion: effectiveVersion };
    }

    const {
      version: { links, licenses },
    }: WebVersionResponse = await response.json();
    const newUrl = url || links.repo || links.homepage || links.origins?.[0];

    return this.getLegalFromUrl({
      copyright,
      licenseName: licenses
        .filter((license) => license !== DEPS_DEV_NON_STANDARD_LICENSE_MARKER)
        .join(' AND '),
      packageVersion: effectiveVersion,
      url: newUrl,
    });
  }

  private async getPackageDefaultVersion({
    name,
    system,
  }: PackageSuggestion): Promise<string | undefined> {
    const response = await this.httpClient.request({
      baseUrl: this.baseUrls.DEPS_DEV_WEB, // endpoint not available via API
      path: `s/${system}/p/${encodeURIComponent(name)}/v/`,
    });

    if (!response.ok) {
      return undefined;
    }

    const { defaultVersion }: DefaultVersionResponse = await response.json();

    return defaultVersion;
  }

  private async getProjectUrlAndLegal({
    copyright,
    kind,
    licenseName,
    name,
    packageVersion,
    projectType,
    system,
    url,
  }: ProjectSuggestion & UrlAndLegal): Promise<UrlAndLegal> {
    const [effectiveVersion, urlAndLegal] = await Promise.all([
      packageVersion ||
        this.getProjectDefaultVersion({
          kind,
          name,
          projectType,
          system,
        }),
      this.getLegalFromUrl({
        copyright,
        licenseName,
        packageVersion,
        url: url || `https://${this.projectTypeDomains[projectType]}/${name}`,
      }),
    ]);

    return {
      ...urlAndLegal,
      packageVersion: effectiveVersion,
    };
  }

  private async getProjectDefaultVersion({
    name,
    projectType,
  }: ProjectSuggestion): Promise<string | undefined> {
    switch (projectType) {
      case 'GITHUB': {
        const response = await this.httpClient.request({
          baseUrl: this.baseUrls.GITHUB,
          path: `repos/${name}/releases/latest`,
        });

        if (!response.ok) {
          return undefined;
        }

        const { tag_name }: LatestReleaseResponse = await response.json();

        return tag_name;
      }
      case 'GITLAB': {
        const response = await this.httpClient.request({
          baseUrl: this.baseUrls.GITLAB,
          path: `projects/${encodeURIComponent(
            name,
          )}/releases/permalink/latest`,
        });

        if (!response.ok) {
          return undefined;
        }

        const { tag_name }: LatestReleaseResponse = await response.json();

        return tag_name;
      }
      default:
        return undefined;
    }
  }

  private async getLegalFromUrl({
    copyright,
    licenseName,
    packageVersion,
    url,
  }: UrlAndLegal): Promise<UrlAndLegal> {
    const githubMatch = url?.match(GITHUB_REGEX);

    if (githubMatch) {
      const response = await this.httpClient.request({
        baseUrl: this.baseUrls.GITHUB,
        path: `repos/${githubMatch[2]}/${githubMatch[3]}/license`,
      });

      if (!response.ok) {
        return { url, licenseName, copyright, packageVersion };
      }

      const { license, content }: GitHubLicenseResponse = await response.json();

      return {
        copyright: copyright || this.getCopyrightFromFileContent(content),
        licenseName: licenseName || license?.name,
        packageVersion,
        url,
      };
    }

    const gitlabMatch = url?.match(GITLAB_REGEX);

    if (gitlabMatch) {
      const response = await this.httpClient.request({
        baseUrl: this.baseUrls.GITLAB,
        path: `projects/${gitlabMatch[2]}%2F${gitlabMatch[3]}`,
        params: { license: 'true' },
      });

      if (!response.ok) {
        return { url, licenseName, copyright, packageVersion };
      }

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
            url,
            licenseName: licenseName || license?.name,
            copyright,
            packageVersion,
          };
        }

        const { content }: GitLabLicenseResponse = await licenseResponse.json();

        return {
          copyright: copyright || this.getCopyrightFromFileContent(content),
          licenseName: licenseName || license?.name,
          packageVersion,
          url,
        };
      }

      return {
        url,
        licenseName: licenseName || license?.name,
        copyright,
        packageVersion,
      };
    }

    return { url, licenseName, copyright, packageVersion };
  }

  private getCopyrightFromFileContent(content: string) {
    return atob(content).match(COPYRIGHT_REGEX)?.join('\n');
  }
}

export default new PackageSearchApi(new HttpClient());
