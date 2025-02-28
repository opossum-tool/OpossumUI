// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as fs from 'fs';

import {
  Attributions,
  Criticality,
  PackageInfo,
} from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import {
  CUT_OFF_LENGTH,
  getHeadersFromColumns,
  writeCsvToFile,
} from '../writeCsvToFile';

const testCsvHeader =
  '"Index";"Package Name";"Follow-up";"License Text (truncated)";"First Party";"Resources"';

describe('writeCsvToFile', () => {
  it('writeCsvToFile short', async () => {
    const testFollowUpAttributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text, with; commas',
        firstParty: true,
        resources: ['/test.file'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'Fancy name,: tt',
        resources: ['/a/c/bla.mm', '/b'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
    };

    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    await writeCsvToFile(csvPath, testFollowUpAttributionsWithResources, [
      'packageName',
      'followUp',
      'licenseText',
      'firstParty',
      'resources',
    ]);

    const content = await fs.promises.readFile(csvPath, 'utf8');
    expect(content).toContain(testCsvHeader);
    expect(content).toContain(
      '"1";"";"";"license text, with; commas";"true";"/test.file"',
    );
    expect(content).toContain('"2";"Fancy name,: tt";"";"";"";"/a/c/bla.mm"');
    expect(content).toContain('"2";"";"";"";"";"/b"');
  });

  it('writeCsvToFile custom header', async () => {
    const testFollowUpAttributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text, with; commas',
        firstParty: true,
        resources: ['/test.file'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'Fancy name,: tt',
        resources: ['/a/c/bla.mm', '/b'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
    };
    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    const columns: Array<keyof PackageInfo> = ['packageName', 'licenseText'];
    await writeCsvToFile(
      csvPath,
      testFollowUpAttributionsWithResources,
      columns,
    );

    const content = await fs.promises.readFile(csvPath, 'utf8');
    expect(content).toContain(
      '"Index";"Package Name";"License Text (truncated)"',
    );
    expect(content).toContain('"1";"";"license text, with; commas"');
    expect(content).toContain('"2";"Fancy name,: tt";""');
  });

  it('writeCsvToFile shorten resources', async () => {
    const testFollowUpAttributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text, with; commas',
        firstParty: true,
        resources: ['/test.file'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'Fancy name,: tt',
        resources: ['/a/c/bla.mm', '/b'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
    };

    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    await writeCsvToFile(
      csvPath,
      testFollowUpAttributionsWithResources,
      ['packageName', 'followUp', 'licenseText', 'firstParty', 'resources'],
      true,
    );

    const content = await fs.promises.readFile(csvPath, 'utf8');
    expect(content).toContain(testCsvHeader);
    expect(content).toContain(
      '"1";"";"";"license text, with; commas";"true";"/test.file"',
    );
    expect(content).toContain(
      '"2";"Fancy name,: tt";"";"";"";"/a/c/bla.mm\n/b"',
    );
  });

  it('writeCsvToFile shorten resources long', async () => {
    const manyResources = Array.from(
      { length: 250 },
      (_, i) =>
        '/core/target/classes/org/keycloak/representations/idm/authorization/' +
        `PolicyEvaluationResponse$EvaluationResultRepresentation.class/${i}`,
    );
    const testFollowUpAttributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text, with; commas',
        firstParty: true,
        resources: ['/test.file'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'Fancy name,: tt',
        resources: manyResources,
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
    };

    const expectedResources = `${manyResources
      .slice(0, 225)
      .join('\n')} ... (resources shortened, 25 paths are not displayed)`;

    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    await writeCsvToFile(
      csvPath,
      testFollowUpAttributionsWithResources,
      ['packageName', 'followUp', 'licenseText', 'firstParty', 'resources'],
      true,
    );

    const content = await fs.promises.readFile(csvPath, 'utf8');
    expect(content).toContain(testCsvHeader);
    expect(content).toContain(
      '"1";"";"";"license text, with; commas";"true";"/test.file"',
    );
    expect(content).toContain(
      `"2";"Fancy name,: tt";"";"";"";"${expectedResources}"`,
    );
  });

  it('writeCsvToFile for attributions', async () => {
    const columns: Array<keyof PackageInfo> = ['packageName', 'licenseText'];
    const testFollowUpAttributions: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text, with; commas',
        firstParty: true,
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'Fancy name,: tt',
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
    };

    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    await writeCsvToFile(csvPath, testFollowUpAttributions, columns, false);

    const content = await fs.promises.readFile(csvPath, 'utf8');
    expect(content).toContain(
      '"Index";"Package Name";"License Text (truncated)"',
    );
    expect(content).toContain('"1";"";"license text, with; commas"');
    expect(content).toContain('"2";"Fancy name,: tt";""');
  });

  it('writeCsvToFile long', async () => {
    const testLicenseText = faker.lorem.words(CUT_OFF_LENGTH);
    const testFollowUpAttributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text, with; commas',
        firstParty: true,
        resources: ['/test.file'],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'Fancy name with long license',
        licenseText: testLicenseText,
        resources: [
          '/a',
          '/a/b',
          '/a/b/c',
          '/a/b/c/testi.bla',
          '/a/b/c/testi.blub',
          '/other',
        ],
        criticality: Criticality.NonCritical,
        id: faker.string.uuid(),
      },
    };

    const expectedLicenseText = `${testLicenseText.substring(
      0,
      CUT_OFF_LENGTH,
    )}... (text shortened)`;

    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    await writeCsvToFile(csvPath, testFollowUpAttributionsWithResources, [
      'packageName',
      'followUp',
      'licenseText',
      'firstParty',
      'resources',
    ]);

    const content = await fs.promises.readFile(csvPath, 'utf8');
    expect(content).toContain(testCsvHeader);
    expect(content).toContain(
      '"1";"";"";"license text, with; commas";"true";"/test.file"',
    );
    expect(content).toContain(
      `"2";"Fancy name with long license";"";"${expectedLicenseText}";"";"/a"`,
    );
    expect(content).toContain('"2";"";"";"";"";"/a/b"');
    expect(content).toContain('"2";"";"";"";"";"/a/b/c"');
    expect(content).toContain('"2";"";"";"";"";"/a/b/c/testi.bla"');
    expect(content).toContain('"2";"";"";"";"";"/a/b/c/testi.blub"');
    expect(content).toContain('"2";"";"";"";"";"/other"');
  });
});

describe('getHeadersFromColumnOrder', () => {
  it('returns an header dictionary for keys in package info', () => {
    const columns: Array<keyof PackageInfo> = [
      'copyright',
      'licenseName',
      'licenseText',
    ];
    const expectedHeaders = {
      copyright: 'Copyright',
      licenseName: 'License Name',
      licenseText: 'License Text (truncated)',
    };

    expect(getHeadersFromColumns(columns)).toEqual(expectedHeaders);
  });
});
