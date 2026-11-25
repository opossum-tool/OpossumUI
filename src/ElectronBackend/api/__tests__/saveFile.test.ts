// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import { Criticality } from '../../../shared/shared-types';
import { writeOpossumFile } from '../../../shared/write-file';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';
import { saveFile } from '../saveFile';

vi.mock('../../../shared/write-file', async () => ({
  ...(await vi.importActual('../../../shared/write-file')),
  writeOpossumFile: vi.fn(),
}));

describe('saveFile', () => {
  afterEach(() => {
    vi.mocked(writeOpossumFile).mockReset();
  });

  it('writes current, empty, and absent AI metadata from the database', async () => {
    const opossumZip = new AdmZip();
    await initializeDbWithTestData({
      resources: pathsToResources(['/a']),
      manualAttributions: {
        attributions: {
          withAi: {
            id: 'withAi',
            packageName: 'before',
            criticality: Criticality.None,
            ...{ aiAttributes: { model: 'test' } },
          },
          emptyAi: {
            id: 'emptyAi',
            packageName: 'empty',
            criticality: Criticality.None,
            ...{ aiAttributes: {} },
          },
          missingFlagAi: {
            id: 'missingFlagAi',
            criticality: Criticality.None,
            ...{ aiAttributes: { model: 'missing flag' } },
          },
          falseAi: {
            id: 'falseAi',
            packageName: 'false',
            criticality: Criticality.None,
            ...{ aiAttributes: { model: 'kept', humanModified: false } },
          },
          extraField: {
            id: 'extraField',
            packageName: 'extra',
            criticality: Criticality.None,
            ...{ ai_attributions: { legacy: true } },
          },
          absent: {
            id: 'absent',
            packageName: 'absent',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: {
          '/a': [
            'withAi',
            'emptyAi',
            'missingFlagAi',
            'falseAi',
            'extraField',
            'absent',
          ],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/a', readonly: true }],
    });
    await getDb()
      .updateTable('attribution_ai')
      .set({
        additional_data: '{"databaseValue":{"preserved":true}}',
        human_modified: 1,
      })
      .where('attribution_uuid', '=', 'withAi')
      .execute();
    await saveFile(
      { projectId: 'project', opossumFilePath: '/output/file.opossum' },
      opossumZip,
    );

    expect(writeOpossumFile).toHaveBeenCalledWith(
      expect.objectContaining({
        output: expect.objectContaining({
          manualAttributions: expect.objectContaining({
            withAi: expect.objectContaining({
              aiAttributes: {
                databaseValue: { preserved: true },
                humanModified: true,
              },
            }),
            emptyAi: expect.objectContaining({
              aiAttributes: {},
            }),
            missingFlagAi: expect.objectContaining({
              aiAttributes: { model: 'missing flag' },
            }),
            falseAi: expect.objectContaining({
              aiAttributes: { model: 'kept', humanModified: false },
            }),
            extraField: expect.objectContaining({
              ai_attributions: { legacy: true },
            }),
            absent: expect.not.objectContaining({
              aiAttributes: expect.anything(),
            }),
          }),
        }),
      }),
    );
  });

  it('writes to opossumFilePath as .opossum format', async () => {
    const opossumZip = new AdmZip();

    await initializeDbWithTestData({
      resources: pathsToResources(['/a']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            packageName: 'opossum-pkg',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: { '/a': ['uuid1'] },
        attributionsToResources: { uuid1: ['/a'] },
      },
    });

    await saveFile(
      {
        projectId: 'project-2',
        opossumFilePath: '/output/file.opossum',
      },
      opossumZip,
    );

    expect(writeOpossumFile).toHaveBeenCalledWith({
      path: '/output/file.opossum',
      zip: opossumZip,
      readonlyRules: [],
      output: expect.objectContaining({
        metadata: expect.objectContaining({
          projectId: 'project-2',
        }),
        manualAttributions: {
          uuid1: expect.objectContaining({
            packageName: 'opossum-pkg',
          }),
        },
        resourcesToAttributions: { '/a': ['uuid1'] },
      }),
    });
  });

  it('passes readonly split metadata from the database to the archive writer', async () => {
    const opossumZip = new AdmZip();
    await initializeDbWithTestData();
    await getDb()
      .insertInto('readonly_rule')
      .values({ path: '/readonly', readonly: 1 })
      .execute();

    await saveFile(
      { projectId: 'project-3', opossumFilePath: '/output/file.opossum' },
      opossumZip,
    );

    expect(writeOpossumFile).toHaveBeenCalledWith(
      expect.objectContaining({
        readonlyRules: [{ path: '/readonly', readonly: true }],
      }),
    );
  });
});
