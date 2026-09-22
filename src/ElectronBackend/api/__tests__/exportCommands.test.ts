// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality, ExportType } from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { writeCsvToFile } from '../../output/writeCsvToFile';
import { writeSpdxFile } from '../../output/writeSpdxFile';
import { exportFile } from '../exportCommands';

vi.mock('../../output/writeCsvToFile', () => ({
  writeCsvToFile: vi.fn(),
}));
vi.mock('../../output/writeSpdxFile', () => ({
  writeSpdxFile: vi.fn(),
}));

describe('export tests', () => {
  it('exports follow-up attributions to CSV', async () => {
    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);

    await initializeDbWithTestData({
      resources: pathsToResources(['/resource1', '/resource2']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            followUp: true,
            licenseText: 'license text',
            packageName: 'follow-up-pkg',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            packageName: 'no-follow-up-pkg',
          },
        },
        resourcesToAttributions: {
          '/resource1': ['uuid1'],
          '/resource2': ['uuid2'],
        },
        attributionsToResources: {
          uuid1: ['/resource1'],
          uuid2: ['/resource2'],
        },
      },
    });

    await exportFile(ExportType.FollowUp, csvPath);

    expect(writeCsvToFile).toHaveBeenCalledWith({
      path: csvPath,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'follow-up-pkg' }),
      },
      columns: [
        'packageName',
        'packageVersion',
        'url',
        'copyright',
        'licenseName',
        'resources',
      ],
      shortenResources: true,
    });
  });

  it('resolves follow-up paths via closest attributed ancestors ordered by resource id', async () => {
    const csvPath = '/some/follow_up_ancestors.csv';

    await initializeDbWithTestData({
      resources: pathsToResources(['/folder/a-file', '/folder/b-file']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            followUp: true,
            packageName: 'ancestor-pkg',
          },
        },
        resourcesToAttributions: {
          '/folder/': ['uuid1'],
        },
        attributionsToResources: {
          uuid1: ['/folder/'],
        },
      },
    });

    await exportFile(ExportType.FollowUp, csvPath);

    expect(writeCsvToFile).toHaveBeenCalledWith({
      path: csvPath,
      attributions: {
        uuid1: expect.objectContaining({
          packageName: 'ancestor-pkg',
          resources: ['/folder/a-file', '/folder/b-file'],
        }),
      },
      columns: [
        'packageName',
        'packageVersion',
        'url',
        'copyright',
        'licenseName',
        'resources',
      ],
      shortenResources: true,
    });
  });

  it('exports compact BOM to CSV', async () => {
    const compactBomFilePath = '/some/compact_bom.csv';

    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'bom-pkg',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            followUp: true,
          },
          uuid3: {
            id: 'uuid3',
            criticality: Criticality.None,
            firstParty: true,
          },
          uuid4: {
            id: 'uuid4',
            criticality: Criticality.None,
            excludeFromNotice: true,
          },
        },
        resourcesToAttributions: {
          '/resource': ['uuid1', 'uuid2', 'uuid3', 'uuid4'],
        },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
          uuid3: ['/resource'],
          uuid4: ['/resource'],
        },
      },
    });

    await exportFile(ExportType.CompactBom, compactBomFilePath);

    expect(writeCsvToFile).toHaveBeenCalledWith({
      path: compactBomFilePath,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'bom-pkg' }),
      },
      columns: [
        'packageName',
        'packageVersion',
        'licenseName',
        'copyright',
        'url',
      ],
    });
  });

  it('exports detailed BOM to CSV with resources', async () => {
    const detailedBomFilePath = '/some/detailed_bom.csv';

    await initializeDbWithTestData({
      resources: pathsToResources(['/a', '/b']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'detailed-pkg',
          },
        },
        resourcesToAttributions: {
          '/a': ['uuid1'],
          '/b': ['uuid1'],
        },
        attributionsToResources: {
          uuid1: ['/a', '/b'],
        },
      },
    });

    await exportFile(ExportType.DetailedBom, detailedBomFilePath);

    expect(writeCsvToFile).toHaveBeenCalledWith({
      path: detailedBomFilePath,
      attributions: {
        uuid1: expect.objectContaining({
          packageName: 'detailed-pkg',
          resources: expect.arrayContaining(['/a', '/b']),
        }),
      },
      columns: [
        'packageName',
        'packageVersion',
        'packageNamespace',
        'packageType',
        'packagePURLAppendix',
        'url',
        'copyright',
        'licenseName',
        'licenseText',
        'resources',
      ],
    });
  });

  it('excludes follow-up and first-party attributions from detailed BOM', async () => {
    const detailedBomFilePath = '/some/detailed_bom_filtered.csv';

    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'detailed-pkg',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            followUp: true,
          },
          uuid3: {
            id: 'uuid3',
            criticality: Criticality.None,
            firstParty: true,
          },
        },
        resourcesToAttributions: {
          '/resource': ['uuid1', 'uuid2', 'uuid3'],
        },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
          uuid3: ['/resource'],
        },
      },
    });

    await exportFile(ExportType.DetailedBom, detailedBomFilePath);

    expect(writeCsvToFile).toHaveBeenCalledWith({
      path: detailedBomFilePath,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'detailed-pkg' }),
      },
      columns: [
        'packageName',
        'packageVersion',
        'packageNamespace',
        'packageType',
        'packagePURLAppendix',
        'url',
        'copyright',
        'licenseName',
        'licenseText',
        'resources',
      ],
    });
  });

  it('exports SPDX YAML document', async () => {
    const spdxYamlFilePath = '/test.yaml';

    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'spdx-pkg',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1'] },
        attributionsToResources: { uuid1: ['/resource'] },
      },
    });

    await exportFile(ExportType.SpdxDocumentYaml, spdxYamlFilePath);

    expect(writeSpdxFile).toHaveBeenCalledWith({
      path: spdxYamlFilePath,
      type: ExportType.SpdxDocumentYaml,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'spdx-pkg' }),
      },
    });
  });

  it('exports SPDX JSON document', async () => {
    const spdxJsonFilePath = '/test.json';

    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'spdx-pkg',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1'] },
        attributionsToResources: { uuid1: ['/resource'] },
      },
    });

    await exportFile(ExportType.SpdxDocumentJson, spdxJsonFilePath);

    expect(writeSpdxFile).toHaveBeenCalledWith({
      path: spdxJsonFilePath,
      type: ExportType.SpdxDocumentJson,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'spdx-pkg' }),
      },
    });
  });

  it('falls back to frequent license texts and empty string for SPDX license texts', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'pkg-with-own-text',
            licenseName: 'MIT License',
            licenseText: 'own license text',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            packageName: 'pkg-with-frequent-license-text',
            licenseName: 'Apache License 2.0',
          },
          uuid3: {
            id: 'uuid3',
            criticality: Criticality.None,
            packageName: 'pkg-with-unknown-license',
            licenseName: 'Unknown License',
          },
        },
        resourcesToAttributions: {
          '/resource': ['uuid1', 'uuid2', 'uuid3'],
        },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
          uuid3: ['/resource'],
        },
      },
      frequentLicenses: {
        nameOrder: [
          { shortName: 'MIT', fullName: 'MIT License' },
          { shortName: 'Apache-2.0', fullName: 'Apache License 2.0' },
        ],
        texts: {
          MIT: 'MIT license text',
          'Apache-2.0': 'Apache license text',
        },
      },
    });

    await exportFile(ExportType.SpdxDocumentYaml, '/test.yaml');

    expect(writeSpdxFile).toHaveBeenCalledWith({
      path: '/test.yaml',
      type: ExportType.SpdxDocumentYaml,
      attributions: {
        uuid1: expect.objectContaining({
          packageName: 'pkg-with-own-text',
          licenseText: 'own license text',
        }),
        uuid2: expect.objectContaining({
          packageName: 'pkg-with-frequent-license-text',
          licenseText: 'Apache license text',
        }),
        uuid3: expect.objectContaining({
          packageName: 'pkg-with-unknown-license',
          licenseText: '',
        }),
      },
    });
  });

  it('exports an empty CSV when no attributions match the follow-up filter', async () => {
    await initializeDbWithTestData();

    await exportFile(ExportType.FollowUp, '/empty_follow_up.csv');

    expect(writeCsvToFile).toHaveBeenCalledWith({
      path: '/empty_follow_up.csv',
      attributions: {},
      columns: [
        'packageName',
        'packageVersion',
        'url',
        'copyright',
        'licenseName',
        'resources',
      ],
      shortenResources: true,
    });
  });

  it('exports an empty SPDX document when there are no attributions', async () => {
    await initializeDbWithTestData();

    await exportFile(ExportType.SpdxDocumentJson, '/empty_spdx.json');

    expect(writeSpdxFile).toHaveBeenCalledWith({
      path: '/empty_spdx.json',
      type: ExportType.SpdxDocumentJson,
      attributions: {},
    });
  });
});
