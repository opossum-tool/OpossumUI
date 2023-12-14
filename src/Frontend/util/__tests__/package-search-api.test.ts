// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../shared/Faker';
import { AutocompleteSignal } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PackageSearchApi, Version, Versions } from '../package-search-api';

describe('PackageSearchApi', () => {
  describe('getVersions', () => {
    it('provides semantically sorted default and non-default versions for known systems', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: faker.packageSearch.system(),
      });
      const defaultVersion = faker.packageSearch.versionResponse({
        isDefault: true,
      });
      const versionKey1 = faker.packageSearch.versionKey({
        version: '9.0.0',
      });
      const versionKey2 = faker.packageSearch.versionKey({
        version: '13.0.0',
      });
      const nonDefaultVersion1 = faker.packageSearch.versionResponse({
        isDefault: false,
        versionKey: versionKey1,
      });
      const nonDefaultVersion2 = faker.packageSearch.versionResponse({
        isDefault: false,
        versionKey: versionKey2,
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse({
          versions: [nonDefaultVersion1, defaultVersion, nonDefaultVersion2],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const versions = await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(versions).toEqual<Versions>({
        default: [
          {
            packageName: defaultVersion.versionKey.name,
            packageType: defaultVersion.versionKey.system.toLowerCase(),
            packageVersion: defaultVersion.versionKey.version,
            source: {
              name: text.attributionColumn.depsDev,
              documentConfidence: 100,
            },
            suffix: '(default)',
          },
        ],
        other: [
          {
            packageName: versionKey2.name,
            packageType: versionKey2.system.toLowerCase(),
            packageVersion: versionKey2.version,
            source: {
              name: text.attributionColumn.depsDev,
              documentConfidence: 100,
            },
          },
          {
            packageName: versionKey1.name,
            packageType: versionKey1.system.toLowerCase(),
            packageVersion: versionKey1.version,
            source: {
              name: text.attributionColumn.depsDev,
              documentConfidence: 100,
            },
          },
        ],
      });
    });

    it('does not provide any versions for unknown systems', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: 'github',
      });
      const httpClient = faker.httpClient();
      const packageSearchApi = new PackageSearchApi(httpClient);

      const versions = await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).not.toHaveBeenCalled();
      expect(versions).toEqual<Versions>({
        default: [],
        other: [],
      });
    });

    it('trims inputs', async () => {
      const system = faker.packageSearch.system();
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: ` ${system}  `,
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining(`/${system.toLowerCase()}/`),
        }),
      );
    });

    it('maps package type "golang" to "go"', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: 'golang',
      });
      const httpClient = faker.httpClient(
        faker.packageSearch.versionsResponse(),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      await packageSearchApi.getVersions(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('/go/'),
        }),
      );
    });
  });

  describe('getVersion', () => {
    it('provides repo URL and license for a given package version', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: faker.packageSearch.system(),
      });
      const repoUrl = faker.internet.url();
      const license1 = faker.commerce.productName();
      const license2 = faker.commerce.productName();
      const httpClient = faker.httpClient(
        faker.packageSearch.webVersionResponse({
          version: {
            links: faker.packageSearch.links({ repo: repoUrl }),
            licenses: [license1, license2],
          },
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const version = await packageSearchApi.getVersion(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(version).toEqual<Version>({
        url: repoUrl,
        license: `${license1} AND ${license2}`,
      });
    });

    it('falls back to homepage URL when repo URL not available', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: faker.packageSearch.system(),
      });
      const homepageUrl = faker.internet.url();
      const httpClient = faker.httpClient(
        faker.packageSearch.webVersionResponse({
          version: {
            links: faker.packageSearch.links({ homepage: homepageUrl }),
            licenses: [],
          },
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const version = await packageSearchApi.getVersion(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(version).toEqual<Version>({
        url: homepageUrl,
        license: '',
      });
    });

    it('falls back to first origin URL when neither repo URL nor homepage URL are available', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: faker.packageSearch.system(),
      });
      const originUrl = faker.internet.url();
      const httpClient = faker.httpClient(
        faker.packageSearch.webVersionResponse({
          version: {
            links: faker.packageSearch.links({
              origins: [originUrl, faker.internet.url()],
            }),
            licenses: [],
          },
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const version = await packageSearchApi.getVersion(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(version).toEqual<Version>({
        url: originUrl,
        license: '',
      });
    });
  });

  describe('getPackages', () => {
    it('provides packages but no projects', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: faker.packageSearch.system(),
      });
      const searchResponsePackage = faker.packageSearch.packageResponse({
        kind: 'PACKAGE',
      });
      const searchResponseProject = faker.packageSearch.packageResponse({
        kind: 'PROJECT',
      });

      const httpClient = faker.httpClient(
        faker.packageSearch.packagesResponse({
          results: [searchResponsePackage, searchResponseProject],
        }),
      );
      const packageSearchApi = new PackageSearchApi(httpClient);

      const searchResults = await packageSearchApi.getPackages(packageInfo);

      expect(httpClient.request).toHaveBeenCalledTimes(1);
      expect(searchResults).toEqual<Array<AutocompleteSignal>>([
        {
          packageName: searchResponsePackage.name,
          packageType: searchResponsePackage.system.toLowerCase(),
          source: {
            name: text.attributionColumn.depsDev,
            documentConfidence: 100,
          },
        },
      ]);
    });
  });
});
