// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line no-restricted-imports
import { base, en, Faker as NativeFaker } from '@faker-js/faker';

import type {
  RawPackageInfo as ExternalPackageInfo,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
  RawFrequentLicense,
} from '../ElectronBackend/types/types';
import { ensureArray } from '../Frontend/util/ensure-array';
import { HttpClient } from '../Frontend/util/http-client';
import {
  RawSearchResponse,
  SearchResponse,
  System,
  systems,
  VersionKey,
  VersionResponse,
  VersionsResponse,
} from '../Frontend/util/package-search-api';
import { PackageSearchHooks } from '../Frontend/util/package-search-hooks';
import {
  AttributionData,
  AttributionsToResources,
  BaseUrlsForSources,
  DiscreteConfidence,
  DisplayPackageInfo,
  ExternalAttributionSource,
  ExternalAttributionSources,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  Source,
} from './shared-types';

type ManualPackageInfo = Omit<ExternalPackageInfo, 'source'>;
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
      .multiple(this.resourceName, {
        count,
      })
      .sort() as Tuple<N, string>;
  }

  public static resources(props?: Resources): Resources {
    return (
      props || {
        [this.resourceName()]: 1,
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

  public static manualPackageInfo(
    props: Partial<ManualPackageInfo> = {},
  ): ManualPackageInfo {
    return {
      attributionConfidence: faker.number.int({
        min: DiscreteConfidence.Low + 1,
        max: DiscreteConfidence.High - 1,
      }),
      copyright: faker.lorem.sentences(),
      licenseName: faker.commerce.productName(),
      packageName: faker.internet.domainWord(),
      packageVersion: faker.system.semver(),
      url: faker.internet.url(),
      packageType: faker.commerce.productMaterial().toLowerCase(),
      ...props,
    };
  }

  public static displayPackageInfo(
    props: Partial<ManualPackageInfo> = {},
  ): DisplayPackageInfo {
    return {
      ...this.manualPackageInfo(props),
      attributionIds: [faker.string.uuid()],
    };
  }

  public static externalPackageInfo(
    props: Partial<ExternalPackageInfo> = {},
  ): ExternalPackageInfo {
    return {
      source: this.source(),
      ...this.manualPackageInfo(props),
    };
  }

  public static attributionId(): string {
    return faker.string.uuid();
  }

  public static manualAttribution(
    props?: Partial<ManualPackageInfo>,
  ): [attributionId: string, attribution: ManualPackageInfo] {
    return [this.attributionId(), this.manualPackageInfo(props)];
  }

  public static manualAttributions(
    props?: Record<string, ManualPackageInfo>,
  ): Record<string, ManualPackageInfo> {
    return (
      props || {
        [this.attributionId()]: this.manualPackageInfo(),
      }
    );
  }

  public static externalAttribution(
    props?: Partial<ExternalPackageInfo>,
  ): [attributionId: string, attribution: ExternalPackageInfo] {
    return [this.attributionId(), this.externalPackageInfo(props)];
  }

  public static externalAttributions(
    props?: Record<string, ExternalPackageInfo>,
  ): Record<string, ExternalPackageInfo> {
    return (
      props || {
        [this.attributionId()]: this.externalPackageInfo(),
      }
    );
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
    const source = this.externalAttributionSource();
    return {
      ...(props || {
        [source.name]: this.externalAttributionSource(),
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
      metadata: this.metadata(),
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
      metadata: this.metadata(),
      manualAttributions: {},
      resourcesToAttributions: {},
      resolvedExternalAttributions: new Set([]),
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

  public static manualAttributionData(
    props: Partial<AttributionData> = {},
  ): AttributionData {
    return {
      attributions: this.manualAttributions(),
      attributionsToResources: this.attributionsToResources(),
      resourcesToAttributions: this.resourcesToAttributions(),
      resourcesWithAttributedChildren: this.resourcesWithAttributedChildren(),
      ...props,
    };
  }

  public static externalAttributionData(
    props: Partial<AttributionData> = {},
  ): AttributionData {
    return {
      attributions: this.externalAttributions(),
      attributionsToResources: this.attributionsToResources(),
      resourcesToAttributions: this.resourcesToAttributions(),
      resourcesWithAttributedChildren: this.resourcesWithAttributedChildren(),
      ...props,
    };
  }
}

class PackageSearchModule {
  public static system(): System {
    return faker.helpers.arrayElement(systems);
  }

  public static usePackageNames() {
    jest.spyOn(PackageSearchHooks, 'usePackageNames').mockReturnValue({
      packageNames: [],
      packageNamesError: null,
      packageNamesLoading: false,
    });
  }

  public static usePackageVersions() {
    jest.spyOn(PackageSearchHooks, 'usePackageVersions').mockReturnValue({
      packageVersions: { default: [], other: [] },
      packageVersionsError: null,
      packageVersionsLoading: false,
    });
  }

  public static versionKey(props: Partial<VersionKey> = {}): VersionKey {
    return {
      name: faker.commerce.productName(),
      system: PackageSearchModule.system(),
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

  public static versionsResponse(
    props: Partial<VersionsResponse> = {},
  ): VersionsResponse {
    return {
      versions: faker.helpers.multiple(PackageSearchModule.versionResponse),
      ...props,
    };
  }

  public static searchResponse(
    props: Partial<SearchResponse> = {},
  ): SearchResponse {
    return {
      kind: faker.datatype.boolean() ? 'PACKAGE' : 'PROJECT',
      name: faker.commerce.productName(),
      system: PackageSearchModule.system(),
      ...props,
    };
  }

  public static rawSearchResponse(
    props: Partial<RawSearchResponse> = {},
  ): RawSearchResponse {
    return {
      results: faker.helpers.multiple(PackageSearchModule.searchResponse),
      ...props,
    };
  }
}

class Faker extends NativeFaker {
  public readonly opossum = OpossumModule;
  public readonly packageSearch = PackageSearchModule;

  public httpClient(body?: object | Array<object>): HttpClient {
    const request = jest.fn();

    ensureArray(body).forEach((item) =>
      request.mockResolvedValueOnce(new Response(JSON.stringify(item))),
    );

    return { request } satisfies Partial<HttpClient> as unknown as HttpClient;
  }
}

export const faker = new Faker({ locale: [en, base] });
