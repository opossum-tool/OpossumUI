// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../shared/Faker';
import { AutocompleteSignal } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PackageSearchApi, Versions } from '../package-search-api';

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
  });

  describe('getPackages', () => {
    it('provides packages but no projects', async () => {
      const packageInfo = faker.opossum.externalPackageInfo({
        packageType: faker.packageSearch.system(),
      });
      const searchResponsePackage = faker.packageSearch.searchResponse({
        kind: 'PACKAGE',
      });
      const searchResponseProject = faker.packageSearch.searchResponse({
        kind: 'PROJECT',
      });

      const httpClient = faker.httpClient(
        faker.packageSearch.rawSearchResponse({
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
