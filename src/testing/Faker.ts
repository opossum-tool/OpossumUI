// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line no-restricted-imports
import { base, en, Faker as NativeFaker } from '@faker-js/faker';
import path from 'path';

import type {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
  RawFrequentLicense,
} from '../ElectronBackend/types/types';
import { HttpClient } from '../Frontend/util/http-client';
import {
  AdvisorySuggestion,
  DefaultVersionResponse,
  GitHubLicenseResponse,
  GitLabLicenseResponse,
  GitLabProjectResponse,
  Links,
  PackageSuggestion,
  PackageSystem,
  packageSystems,
  ProjectSuggestion,
  ProjectType,
  projectTypes,
  SearchSuggestion,
  SearchSuggestionResponse,
  TagResponse,
  VersionKey,
  VersionResponse,
  VersionsResponse,
  WebVersionResponse,
} from '../Frontend/util/package-search-api';
import { PackageSearchHooks } from '../Frontend/util/package-search-hooks';
import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  DiscreteConfidence,
  ExternalAttributionSource,
  ExternalAttributionSources,
  PackageInfo,
  ProjectMetadata,
  RawAttributions,
  RawPackageInfo,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  Source,
} from '../shared/shared-types';

type Tuple<N extends number, T> = N extends N
  ? number extends N
    ? Array<T>
    : _TupleOf<N, T, []>
  : never;
type _TupleOf<
  N extends number,
  T,
  L extends Array<unknown>,
> = L['length'] extends N ? L : _TupleOf<N, T, [T, ...L]>;

class OpossumModule {
  public static metadata(
    props: Partial<ProjectMetadata> = {},
  ): ProjectMetadata {
    return {
      fileCreationDate: faker.date.recent().toISOString(),
      projectId: faker.string.uuid(),
      ...props,
    };
  }

  public static resourceName(): string {
    return faker.word.words({ count: 3 }).toLowerCase().replace(/\W/g, '-');
  }

  public static resourceNames<N extends number>({
    count,
  }: {
    count: N;
  }): Tuple<N, string> {
    return faker.helpers
      .multiple(OpossumModule.resourceName, {
        count,
      })
      .sort() as Tuple<N, string>;
  }

  public static resources(props?: Resources): Resources {
    return (
      props || {
        [OpossumModule.resourceName()]: 1,
      }
    );
  }

  public static source(props: Partial<Source> = {}): Source {
    return {
      documentConfidence: faker.number.int({ max: 100 }),
      name: faker.company.name(),
      ...props,
    };
  }

  public static copyright(name = faker.company.name()) {
    return `Copyright (c) ${name}`;
  }

  public static rawPackageInfo(
    props: Partial<RawPackageInfo> = {},
  ): RawPackageInfo {
    return {
      attributionConfidence: faker.number.int({
        min: DiscreteConfidence.Low + 1,
        max: DiscreteConfidence.High - 1,
      }),
      copyright: OpossumModule.copyright(),
      licenseName: faker.commerce.productName(),
      packageName: faker.internet.domainWord(),
      packageType: faker.commerce.productMaterial().toLowerCase(),
      packageVersion: faker.system.semver(),
      source: OpossumModule.source(),
      url: faker.internet.url(),
      ...props,
    };
  }

  public static packageInfo(props: Partial<PackageInfo> = {}): PackageInfo {
    return {
      attributionConfidence: faker.number.int({
        min: DiscreteConfidence.Low + 1,
        max: DiscreteConfidence.High - 1,
      }),
      copyright: OpossumModule.copyright(),
      id: faker.string.uuid(),
      licenseName: faker.commerce.productName(),
      packageName: faker.internet.domainWord(),
      packageType: faker.commerce.productMaterial().toLowerCase(),
      packageVersion: faker.system.semver(),
      url: faker.internet.url(),
      ...props,
    };
  }

  public static rawAttribution(
    props?: Partial<RawPackageInfo>,
  ): [attributionId: string, attribution: RawPackageInfo] {
    return [faker.string.uuid(), OpossumModule.rawPackageInfo(props)];
  }

  public static rawAttributions(props?: RawAttributions): RawAttributions {
    const [attributionId, attribution] = OpossumModule.rawAttribution();
    return (
      props || {
        [attributionId]: attribution,
      }
    );
  }

  public static attributions(props?: Attributions): Attributions {
    const packageInfo = OpossumModule.packageInfo();
    return (
      props || {
        [packageInfo.id]: packageInfo,
      }
    );
  }

  public static attributionBreakpoints(props?: Set<string>): Set<string> {
    return props || new Set();
  }

  public static resolvedAttributions(props?: Set<string>): Set<string> {
    return props || new Set();
  }

  public static resourcesToAttributions(
    props?: ResourcesToAttributions,
  ): ResourcesToAttributions {
    return (
      props || {
        [faker.system.filePath()]: [faker.string.uuid()],
      }
    );
  }

  public static attributionsToResources(
    props?: AttributionsToResources,
  ): AttributionsToResources {
    return (
      props || {
        [faker.string.uuid()]: [faker.system.filePath()],
      }
    );
  }

  public static filePath(...elements: Array<string>): string {
    if (!elements[0]?.startsWith('/')) {
      elements.unshift('');
    }
    return elements.join('/');
  }

  public static folderPath(...elements: Array<string>): string {
    if (!elements[0]?.startsWith('/')) {
      elements.unshift('');
    }
    elements.push('');
    return elements.join('/');
  }

  public static baseUrlsForSources(
    props?: BaseUrlsForSources,
  ): BaseUrlsForSources {
    return (
      props || {
        [faker.system.filePath()]: faker.internet.url(),
      }
    );
  }

  public static externalAttributionSource(
    props?: Partial<ExternalAttributionSource>,
  ): ExternalAttributionSource {
    return {
      name: faker.word.words({ count: 3 }),
      priority: faker.number.int({ min: 1, max: 100 }),
      ...props,
    };
  }

  public static externalAttributionSources(
    props?: ExternalAttributionSources,
  ): ExternalAttributionSources {
    const source = OpossumModule.externalAttributionSource();
    return {
      ...(props || {
        [source.name]: OpossumModule.externalAttributionSource(),
      }),
    };
  }

  public static license(
    props?: Partial<RawFrequentLicense>,
  ): RawFrequentLicense {
    const fullName = faker.commerce.productName();

    return {
      defaultText: faker.lorem.sentences(),
      fullName,
      shortName: fullName.match(/\b([A-Z])/g)!.join(''),
      ...props,
    };
  }

  public static inputData(
    props: Partial<ParsedOpossumInputFile> = {},
  ): ParsedOpossumInputFile {
    return {
      metadata: OpossumModule.metadata(),
      resources: {},
      externalAttributions: {},
      resourcesToAttributions: {},
      ...props,
    };
  }

  public static outputData(
    props: Partial<ParsedOpossumOutputFile> = {},
  ): ParsedOpossumOutputFile {
    return {
      metadata: OpossumModule.metadata(),
      manualAttributions: {},
      resourcesToAttributions: {},
      resolvedExternalAttributions: [],
      ...props,
    };
  }

  public static resourcesWithAttributedChildren(
    props: Partial<ResourcesWithAttributedChildren> = {},
  ): ResourcesWithAttributedChildren {
    return {
      paths: [],
      pathsToIndices: {},
      attributedChildren: {},
      ...props,
    };
  }

  public static attributionData(
    props: Partial<AttributionData> = {},
  ): AttributionData {
    return {
      attributions: OpossumModule.attributions(),
      attributionsToResources: OpossumModule.attributionsToResources(),
      resourcesToAttributions: OpossumModule.resourcesToAttributions(),
      resourcesWithAttributedChildren:
        OpossumModule.resourcesWithAttributedChildren(),
      ...props,
    };
  }
}

class PackageSearchModule {
  public static usePackageNames() {
    jest.spyOn(PackageSearchHooks, 'usePackageNames').mockReturnValue({
      packageNames: [],
      packageNamesError: null,
      packageNamesLoading: false,
    });
  }

  public static usePackageNamespaces() {
    jest.spyOn(PackageSearchHooks, 'usePackageNamespaces').mockReturnValue({
      packageNamespaces: [],
      packageNamespacesError: null,
      packageNamespacesLoading: false,
    });
  }

  public static usePackageVersions() {
    jest.spyOn(PackageSearchHooks, 'usePackageVersions').mockReturnValue({
      packageVersions: [],
      packageVersionsError: null,
      packageVersionsLoading: false,
    });
  }

  public static packageSystem(): PackageSystem {
    return faker.helpers.arrayElement(packageSystems);
  }

  public static projectType(): ProjectType {
    return faker.helpers.arrayElement(projectTypes);
  }

  public static versionKey(props: Partial<VersionKey> = {}): VersionKey {
    return {
      name: faker.commerce.productName(),
      system: 'NPM',
      version: faker.system.semver(),
      ...props,
    };
  }

  public static versionResponse(
    props: Partial<VersionResponse> = {},
  ): VersionResponse {
    return {
      versionKey: PackageSearchModule.versionKey(),
      publishedAt: faker.date.past().toISOString(),
      isDefault: faker.datatype.boolean(),
      ...props,
    };
  }

  public static defaultVersionResponse(
    props: Partial<DefaultVersionResponse> = {},
  ): DefaultVersionResponse {
    return {
      defaultVersion: faker.system.semver(),
      ...props,
    };
  }

  public static versionsResponse(
    props: Partial<VersionsResponse> = {},
  ): VersionsResponse {
    return {
      versions: faker.helpers.multiple(PackageSearchModule.versionResponse),
      ...props,
    };
  }

  public static licenseTextWithCopyright(
    copyright = OpossumModule.copyright(),
  ) {
    return btoa(
      `${faker.lorem.sentence()}\n${copyright}\n${faker.lorem.sentence()}`,
    );
  }

  public static gitHubLicenseResponse(
    props: Partial<GitHubLicenseResponse> = {},
  ): GitHubLicenseResponse {
    return {
      content: PackageSearchModule.licenseTextWithCopyright(),
      license: { name: faker.commerce.productName() },
      ...props,
    };
  }

  public static gitLabProjectResponse(
    props: Partial<GitLabProjectResponse> = {},
  ): GitLabProjectResponse {
    return {
      license: { name: faker.commerce.productName() },
      license_url: faker.internet.url(),
      ...props,
    };
  }

  public static gitLabLicenseResponse(
    props: Partial<GitLabLicenseResponse> = {},
  ): GitLabLicenseResponse {
    return {
      content: PackageSearchModule.licenseTextWithCopyright(),
      ...props,
    };
  }

  public static packageSuggestion(
    props: Partial<PackageSuggestion> = {},
  ): PackageSuggestion {
    return {
      kind: 'PACKAGE',
      name: faker.internet.domainWord(),
      system: PackageSearchModule.packageSystem(),
      ...props,
    };
  }

  public static projectSuggestion(
    props: Partial<ProjectSuggestion> = {},
  ): ProjectSuggestion {
    return {
      kind: 'PROJECT',
      name: `${faker.internet.domainWord()}/${faker.internet.domainWord()}`,
      projectType: PackageSearchModule.projectType(),
      ...props,
    };
  }

  public static advisorySuggestion(
    props: Partial<AdvisorySuggestion> = {},
  ): AdvisorySuggestion {
    return {
      kind: 'ADVISORY',
      name: faker.internet.domainWord(),
      ...props,
    };
  }

  public static searchSuggestion(): SearchSuggestion {
    return faker.helpers.arrayElement([
      PackageSearchModule.packageSuggestion,
      PackageSearchModule.projectSuggestion,
    ])();
  }

  public static searchSuggestionResponse(
    props: Partial<SearchSuggestionResponse> = {},
  ): SearchSuggestionResponse {
    return {
      results: faker.helpers.multiple(PackageSearchModule.searchSuggestion),
      ...props,
    };
  }

  public static links(props: Partial<Links> = {}): Links {
    return {
      origins: faker.helpers.multiple(faker.internet.url),
      homepage: faker.internet.url(),
      repo: faker.internet.url(),
      issues: faker.internet.url(),
      ...props,
    };
  }

  public static webVersionResponse(
    props: Partial<WebVersionResponse> = {},
  ): WebVersionResponse {
    return {
      version: {
        licenses: faker.helpers.multiple(faker.commerce.productName),
        links: PackageSearchModule.links(),
      },
      ...props,
    };
  }

  public static tagResponse(props: Partial<TagResponse> = {}): TagResponse {
    return {
      name: faker.system.semver(),
      ...props,
    };
  }
}

class Faker extends NativeFaker {
  public readonly opossum = OpossumModule;
  public readonly packageSearch = PackageSearchModule;

  public outputPath(fileName: string): string {
    return path.join('test-output', fileName);
  }

  public httpClient(...body: Array<object>): HttpClient {
    const request = jest.fn();

    body.forEach((item) =>
      request.mockResolvedValueOnce(new Response(JSON.stringify(item))),
    );

    return { request } satisfies Partial<HttpClient> as unknown as HttpClient;
  }
}

export const faker = new Faker({ locale: [en, base] });
