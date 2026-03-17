// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { shell } from 'electron';

import { Criticality, ExportType } from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { setGlobalBackendState } from '../../main/globalBackendState';
import { writeCsvToFile } from '../../output/writeCsvToFile';
import { writeSpdxFile } from '../../output/writeSpdxFile';
import {
  exportCompactBom,
  exportDetailedBom,
  exportFollowUp,
  exportSpdxDocument,
} from '../exportCommands';

vi.resetModules();
vi.mock('electron', () => ({
  shell: { showItemInFolder: vi.fn() },
}));
vi.mock('../../output/writeCsvToFile', () => ({
  writeCsvToFile: vi.fn(),
}));
vi.mock('../../output/writeSpdxFile', () => ({
  writeSpdxFile: vi.fn(),
}));

describe('export tests', () => {
  it('exports follow-up attributions to CSV', async () => {
    const csvPath = faker.outputPath(`${faker.string.uuid()}.csv`);
    setGlobalBackendState({ followUpFilePath: csvPath });

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

    await exportFollowUp();

    expect(writeCsvToFile).toHaveBeenCalledWith(
      csvPath,
      {
        uuid1: expect.objectContaining({ packageName: 'follow-up-pkg' }),
      },
      [
        'packageName',
        'packageVersion',
        'url',
        'copyright',
        'licenseName',
        'resources',
      ],
      true,
    );
    expect(shell.showItemInFolder).toHaveBeenCalledWith(csvPath);
  });

  it('exports compact BOM to CSV', async () => {
    const compactBomFilePath = '/some/compact_bom.csv';
    setGlobalBackendState({ compactBomFilePath });

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

    await exportCompactBom();

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
    setGlobalBackendState({ detailedBomFilePath });

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

    await exportDetailedBom();

    expect(writeCsvToFile).toHaveBeenCalledWith(
      detailedBomFilePath,
      {
        uuid1: expect.objectContaining({
          packageName: 'detailed-pkg',
          resources: expect.arrayContaining(['/a', '/b']),
        }),
      },
      [
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
    );
    expect(shell.showItemInFolder).toHaveBeenCalledWith(detailedBomFilePath);
  });

  it('exports SPDX YAML document', async () => {
    const spdxYamlFilePath = '/test.yaml';
    setGlobalBackendState({ spdxYamlFilePath });

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

    await exportSpdxDocument({ type: ExportType.SpdxDocumentYaml });

    expect(writeSpdxFile).toHaveBeenCalledWith({
      path: spdxYamlFilePath,
      type: ExportType.SpdxDocumentYaml,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'spdx-pkg' }),
      },
    });
    expect(shell.showItemInFolder).toHaveBeenCalledWith(spdxYamlFilePath);
  });

  it('exports SPDX JSON document', async () => {
    const spdxJsonFilePath = '/test.json';
    setGlobalBackendState({ spdxJsonFilePath });

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

    await exportSpdxDocument({ type: ExportType.SpdxDocumentJson });

    expect(writeSpdxFile).toHaveBeenCalledWith({
      path: spdxJsonFilePath,
      type: ExportType.SpdxDocumentJson,
      attributions: {
        uuid1: expect.objectContaining({ packageName: 'spdx-pkg' }),
      },
    });
    expect(shell.showItemInFolder).toHaveBeenCalledWith(spdxJsonFilePath);
  });
});
