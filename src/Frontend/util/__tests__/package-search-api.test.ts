// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { difference } from 'lodash';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { faker } from '../../../testing/Faker';
import { RequestProps } from '../http-client';
import {
  PackageSearchApi,
  packageSystems,
  packageSystemsRequiringNamespace,
} from '../package-search-api';

describe('PackageSearchApi', () => {
  describe('getNames', () => {
    it('serializes project with deterministic URL', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const name = faker.internet.domainWord();
      const namespace = faker.internet.domainWord();
      const projectSuggestion = faker.packageSearch.projectSuggestion({
        name: `${namespace}/${name}`,
        projectType: 'GITHUB',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [projectSuggestion],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const searchResults = await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(searchResults).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: name,
          packageNamespace: namespace,
          packageType: 'github',
          url: `https://github.com/${projectSuggestion.name}`,
        }),
      ]);
    });

    it('serializes maven package', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const name = faker.internet.domainWord();
      const namespace = faker.internet.domainWord();
      const projectSuggestion = faker.packageSearch.packageSuggestion({
        name: `${namespace}:${name}`,
        system: 'MAVEN',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [projectSuggestion],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const searchResults = await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(searchResults).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: name,
          packageNamespace: namespace,
          packageType: 'maven',
        }),
      ]);
    });

    it('serializes golang package', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const projectSuggestion = faker.packageSearch.packageSuggestion({
        system: 'GO',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [projectSuggestion],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const searchResults = await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(searchResults).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: projectSuggestion.name,
          packageNamespace: undefined,
          packageType: 'golang',
        }),
      ]);
    });

    it('serializes NPM package', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const projectSuggestion = faker.packageSearch.packageSuggestion({
        system: 'NPM',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [projectSuggestion],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const searchResults = await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(searchResults).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: projectSuggestion.name,
          packageNamespace: undefined,
          packageType: 'npm',
        }),
      ]);
    });

    it('removes advisories from results', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const advisorySuggestion = faker.packageSearch.advisorySuggestion();
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [advisorySuggestion],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const searchResults = await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(searchResults).toEqual([]);
    });

    it('deserializes input name', async () => {
      const deserializedPackageName = faker.internet.domainWord();
      const packageInfo = faker.opossum.packageInfo({
        packageName: ` ${deserializedPackageName.toUpperCase()} `,
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RequestProps>>({
          params: { q: deserializedPackageName },
        }),
      );
    });

    it('does not perform request when no package name present', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageName: '   ',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse({
          results: [],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getNames(packageInfo);

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('getNamespaces', () => {
    it('gets namespaces for project', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: faker.packageSearch.projectType(),
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getNamespaces(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RequestProps>>({
          params: { q: packageInfo.packageName, kind: 'PROJECT' },
        }),
      );
    });

    it('gets namespaces for package system which requires one', async () => {
      const system = faker.helpers.arrayElement(
        packageSystemsRequiringNamespace,
      );
      const packageInfo = faker.opossum.packageInfo({
        packageType: system,
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getNamespaces(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RequestProps>>({
          params: { q: packageInfo.packageName, system, kind: 'PACKAGE' },
        }),
      );
    });

    it('does not get namespaces for package system which does not require one', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: faker.helpers.arrayElement(
          difference(packageSystems, packageSystemsRequiringNamespace),
        ),
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getNamespaces(packageInfo);

      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('does not get namespaces for unknown package type', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const httpClient = faker.httpClient(
        faker.packageSearch.searchSuggestionResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getNamespaces(packageInfo);

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('getVersions', () => {
    it('provides semantically sorted default and non-default versions for known package types', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'npm',
      });
      const defaultVersion = faker.packageSearch.versionResponse({
        isDefault: true,
      });
      const nonDefaultVersion1 = faker.packageSearch.versionResponse({
        isDefault: false,
        versionKey: faker.packageSearch.versionKey({
          version: '9.0.0',
        }),
      });
      const nonDefaultVersion2 = faker.packageSearch.versionResponse({
        isDefault: false,
        versionKey: faker.packageSearch.versionKey({
          version: '13.0.0',
        }),
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse({
          versions: [nonDefaultVersion1, defaultVersion, nonDefaultVersion2],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const versions = await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(versions).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: defaultVersion.versionKey.name,
          packageType: defaultVersion.versionKey.system.toLowerCase(),
          packageVersion: defaultVersion.versionKey.version,
          source: {
            name: text.attributionColumn.openSourceInsights,
          },
          suffix: '(default)',
        }),
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: nonDefaultVersion2.versionKey.name,
          packageType: nonDefaultVersion2.versionKey.system.toLowerCase(),
          packageVersion: nonDefaultVersion2.versionKey.version,
          source: {
            name: text.attributionColumn.openSourceInsights,
          },
        }),
        expect.objectContaining<Partial<PackageInfo>>({
          packageName: nonDefaultVersion1.versionKey.name,
          packageType: nonDefaultVersion1.versionKey.system.toLowerCase(),
          packageVersion: nonDefaultVersion1.versionKey.version,
          source: {
            name: text.attributionColumn.openSourceInsights,
          },
        }),
      ]);
    });

    it('provides tags as versions for GitHub packages', async () => {
      const packageName = faker.internet.domainWord();
      const packageNamespace = faker.internet.domainWord();
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'github',
        packageName,
        packageNamespace,
      });
      const tagName = faker.system.semver();
      const httpClient = faker.httpClient([
        faker.packageSearch.tagResponse({ name: tagName }),
      ]);
      const packageSearchApi = new PackageSearchApi(httpClient);

      const versions = await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(versions).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName,
          packageNamespace,
          packageType: 'github',
          packageVersion: tagName,
          source: {
            name: text.attributionColumn.openSourceInsights,
          },
          url: `https://github.com/${packageNamespace}/${packageName}`,
        }),
      ]);
    });

    it('provides tags as versions for GitLab packages', async () => {
      const packageName = faker.internet.domainWord();
      const packageNamespace = faker.internet.domainWord();
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'gitlab',
        packageName,
        packageNamespace,
      });
      const tagName = faker.system.semver();
      const httpClient = faker.httpClient([
        faker.packageSearch.tagResponse({ name: tagName }),
      ]);
      const packageSearchApi = new PackageSearchApi(httpClient);

      const versions = await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(versions).toEqual([
        expect.objectContaining<Partial<PackageInfo>>({
          packageName,
          packageNamespace,
          packageType: 'gitlab',
          packageVersion: tagName,
          source: {
            name: text.attributionColumn.openSourceInsights,
          },
          url: `https://gitlab.com/${packageNamespace}/${packageName}`,
        }),
      ]);
    });

    it('deserializes "golang" package type', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'golang',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RequestProps>>({
          path: expect.stringContaining('/GO/'),
        }),
      );
    });

    it('deserializes "go" package type', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'go',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RequestProps>>({
          path: expect.stringContaining('/GO/'),
        }),
      );
    });

    it('deserializes maven name and namespace', async () => {
      const name = faker.internet.domainWord();
      const namespace = faker.internet.domainWord();
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'maven',
        packageName: name,
        packageNamespace: namespace,
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RequestProps>>({
          path: expect.stringContaining(`/${namespace}%3A${name}`),
        }),
      );
    });
  });

  describe('enrichPackageInfo', () => {
    it('provides repo URL and license for a given package version', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: faker.packageSearch.packageSystem(),
        packageNamespace: faker.internet.domainWord(),
        url: undefined,
        licenseName: undefined,
      });
      const links = faker.packageSearch.links({ origins: [] });
      const license1 = faker.commerce.productName();
      const license2 = faker.commerce.productName();
      const httpClient = faker.httpClient(
        faker.packageSearch.webVersionResponse({
          version: { links, licenses: [license1, license2] },
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const enriched = await packageSearchApi.enrichPackageInfo(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(enriched).toEqual(
        expect.objectContaining<Partial<PackageInfo>>({
          url: links.repo,
          licenseName: `${license1} AND ${license2}`,
          comment: `${text.attributionColumn.homepage}: ${links.homepage!}`,
        }),
      );
    });

    it('gets license based on package default version if no package version provided', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: faker.packageSearch.packageSystem(),
        packageNamespace: faker.internet.domainWord(),
        packageVersion: undefined,
        url: undefined,
        licenseName: undefined,
        copyright: undefined,
      });
      const defaultVersion = faker.system.semver();
      const httpClient = faker.httpClient(
        faker.packageSearch.defaultVersionResponse({ defaultVersion }),
        faker.packageSearch.webVersionResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.enrichPackageInfo(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(2);
      expect(httpClient.request).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining<Partial<RequestProps>>({
          path: expect.stringContaining(`/v/${defaultVersion}`),
        }),
      );
    });

    it('provides repo URL, license, and copyright for a GitHub project', async () => {
      const name = faker.internet.domainWord();
      const namespace = faker.internet.domainWord();
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'github',
        packageName: name,
        packageNamespace: namespace,
        url: undefined,
        licenseName: undefined,
        copyright: undefined,
      });
      const license = faker.commerce.productName();
      const copyright = faker.opossum.copyright();
      const httpClient = faker.httpClient(
        faker.packageSearch.gitHubLicenseResponse({
          license: { name: license },
          content: faker.packageSearch.licenseTextWithCopyright(copyright),
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const enriched = await packageSearchApi.enrichPackageInfo(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(enriched).toEqual(
        expect.objectContaining<Partial<PackageInfo>>({
          url: `https://github.com/${namespace}/${name}`,
          licenseName: license,
          packageVersion: packageInfo.packageVersion,
          copyright,
        }),
      );
    });

    it('provides repo URL, license, and copyright for a GitLab project', async () => {
      const name = faker.internet.domainWord();
      const namespace = faker.internet.domainWord();
      const packageInfo = faker.opossum.packageInfo({
        packageType: 'gitlab',
        packageName: name,
        packageNamespace: namespace,
        url: undefined,
        licenseName: undefined,
        copyright: undefined,
      });
      const license = faker.commerce.productName();
      const copyright = faker.opossum.copyright();
      const httpClient = faker.httpClient(
        faker.packageSearch.gitLabProjectResponse({
          license: { name: license },
        }),
        faker.packageSearch.gitLabLicenseResponse({
          content: faker.packageSearch.licenseTextWithCopyright(copyright),
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const enriched = await packageSearchApi.enrichPackageInfo(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(2);
      expect(enriched).toEqual(
        expect.objectContaining<Partial<PackageInfo>>({
          url: `https://gitlab.com/${namespace}/${name}`,
          licenseName: license,
          packageVersion: packageInfo.packageVersion,
          copyright,
        }),
      );
    });

    it('does not enrich package info if URL, copyright, and license name are already known', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageType: faker.packageSearch.packageSystem(),
        packageNamespace: faker.internet.domainWord(),
      });
      const httpClient = faker.httpClient();
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.enrichPackageInfo(packageInfo);

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });
});
