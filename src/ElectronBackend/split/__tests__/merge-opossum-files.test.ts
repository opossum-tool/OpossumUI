// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import type { ReadonlyRule } from '../../../shared/shared-types';
import { writeOpossumFile } from '../../../shared/write-file';
import {
  INPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
import { parseOpossumFile } from '../../input/parseFile';
import type {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../types/types';
import {
  mergeOpossumArchives,
  MergeOpossumFilesError,
} from '../merge-opossum-files';
import { splitOpossumArchive } from '../split-opossum-file';

const input: ParsedOpossumInputFile = {
  metadata: { fileCreationDate: 'today', projectId: 'project-id' },
  resources: {
    docs: { 'README.md': 1 },
    frontend: { 'App.tsx': 1 },
  },
  externalAttributions: {},
  resourcesToAttributions: {},
};

describe('mergeOpossumArchives', () => {
  it('merges complementary partitions into an editable archive', async () => {
    const sourcePath = await createArchive({
      output: output({
        attributions: {
          docs: 'stale-docs',
          frontend: 'source-frontend',
        },
        resolved: ['source-resolved'],
      }),
      readonlyRules: [{ path: '/docs', readonly: true }],
      additionalFile: 'source data',
    });
    const selectedPath = await createArchive({
      output: output({
        attributions: { docs: 'selected-docs' },
        resolved: ['selected-resolved'],
      }),
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/docs', readonly: false },
      ],
    });
    const outputPath = sourcePath;

    await mergeOpossumArchives({
      inputPaths: [sourcePath, selectedPath],
      outputPath,
    });

    const parsed = await parseMergedArchive(outputPath);
    expect(parsed.readonlyRules).toEqual([]);
    expect(parsed.output).toMatchObject({
      resourcesToAttributions: {
        '/docs/': ['selected-docs'],
        '/frontend/': ['source-frontend'],
      },
      manualAttributions: {
        'selected-docs': { packageName: 'selected-docs' },
        'source-frontend': { packageName: 'source-frontend' },
      },
    });
    expect(parsed.output?.resolvedExternalAttributions).toEqual([
      'source-resolved',
      'selected-resolved',
    ]);
    expect(parsed.output?.manualAttributions).not.toHaveProperty('stale-docs');
    expect(new AdmZip(outputPath).readAsText('additional-data.txt')).toBe(
      'source data',
    );
  });

  it('merges consecutively split archives in any order', async () => {
    const sourcePath = await createArchive({
      output: output({
        attributions: {
          backend: 'initial-backend',
          docs: 'initial-docs',
          frontend: 'initial-frontend',
        },
      }),
      readonlyRules: [],
    });
    const docsPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const firstSplit = await splitOpossumArchive({
      paths: {
        sourceOpossumFilePath: sourcePath,
        selectedFolderPaths: ['/docs'],
        splitOpossumFilePath: docsPath,
      },
      sourceZip: new AdmZip(sourcePath),
      readonlyRules: [],
    });
    const frontendPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await splitOpossumArchive({
      paths: {
        sourceOpossumFilePath: sourcePath,
        selectedFolderPaths: ['/frontend'],
        splitOpossumFilePath: frontendPath,
      },
      sourceZip: new AdmZip(sourcePath),
      readonlyRules: firstSplit.sourceReadonlyRules,
    });

    const updatedSourcePath = await copyArchiveWithOutput(
      sourcePath,
      output({
        attributions: {
          backend: 'updated-backend',
          docs: 'stale-source-docs',
          frontend: 'stale-source-frontend',
        },
      }),
    );
    const updatedDocsPath = await copyArchiveWithOutput(
      docsPath,
      output({
        attributions: {
          backend: 'stale-docs-backend',
          docs: 'updated-docs',
          frontend: 'stale-docs-frontend',
        },
      }),
    );
    const updatedFrontendPath = await copyArchiveWithOutput(
      frontendPath,
      output({
        attributions: {
          backend: 'stale-frontend-backend',
          docs: 'stale-frontend-docs',
          frontend: 'updated-frontend',
        },
      }),
    );

    const expectedOutput = output({
      attributions: {
        backend: 'updated-backend',
        docs: 'updated-docs',
        frontend: 'updated-frontend',
      },
    });
    for (const inputPaths of getPermutations([
      updatedSourcePath,
      updatedDocsPath,
      updatedFrontendPath,
    ])) {
      const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

      await mergeOpossumArchives({ inputPaths, outputPath });

      const parsed = await parseMergedArchive(outputPath);
      expect(parsed.readonlyRules).toEqual([]);
      expect(parsed.output?.resourcesToAttributions).toEqual(
        expectedOutput.resourcesToAttributions,
      );
      expect(parsed.output?.manualAttributions).toEqual(
        expectedOutput.manualAttributions,
      );
    }
  });

  it('keeps split metadata when the merged partitions do not cover all resources', async () => {
    const firstPath = await createArchive({
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/docs', readonly: false },
      ],
    });
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await mergeOpossumArchives({
      inputPaths: [
        firstPath,
        await createArchive({
          readonlyRules: [
            { path: '/', readonly: true },
            { path: '/frontend', readonly: false },
          ],
        }),
      ],
      outputPath,
    });

    expect(getReadonlyRules(outputPath)).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('rejects conflicting readonly resource attribution mappings', async () => {
    const firstPath = await createArchive({
      output: output({
        attributions: { other: 'first-other', shared: 'first-shared' },
      }),
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/docs', readonly: false },
      ],
    });
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await expect(
      mergeOpossumArchives({
        inputPaths: [
          firstPath,
          await createArchive({
            output: output({
              attributions: {
                other: 'second-other',
                shared: 'second-shared',
              },
            }),
            readonlyRules: [
              { path: '/', readonly: true },
              { path: '/frontend', readonly: false },
            ],
          }),
        ],
        outputPath,
      }),
    ).rejects.toThrow(
      "readonly resource output for paths: '/other/', '/shared/'",
    );
  });

  it('uses the first archive readonly resource output when conflicts are ignored', async () => {
    const firstPath = await createArchive({
      output: output({ attributions: { shared: 'first-shared' } }),
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/docs', readonly: false },
      ],
    });
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await mergeOpossumArchives({
      ignoreReadonlyResourceOutputConflicts: true,
      inputPaths: [
        firstPath,
        await createArchive({
          output: output({ attributions: { shared: 'second-shared' } }),
          readonlyRules: [
            { path: '/', readonly: true },
            { path: '/frontend', readonly: false },
          ],
        }),
      ],
      outputPath,
    });

    expect((await parseMergedArchive(outputPath)).output).toMatchObject({
      resourcesToAttributions: { '/shared/': ['first-shared'] },
      manualAttributions: {
        'first-shared': { packageName: 'first-shared' },
      },
    });
  });

  it('rejects conflicting readonly manual attribution payloads', async () => {
    const firstOutput = output({ attributions: { shared: 'shared' } });
    const secondOutput = output({ attributions: { shared: 'shared' } });
    secondOutput.manualAttributions.shared = { packageName: 'updated-shared' };
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await expect(
      mergeOpossumArchives({
        inputPaths: [
          await createArchive({
            output: firstOutput,
            readonlyRules: [
              { path: '/', readonly: true },
              { path: '/docs', readonly: false },
            ],
          }),
          await createArchive({
            output: secondOutput,
            readonlyRules: [
              { path: '/', readonly: true },
              { path: '/frontend', readonly: false },
            ],
          }),
        ],
        outputPath,
      }),
    ).rejects.toThrow("readonly resource output for paths: '/shared/'");
  });

  it('rejects archives with different project IDs', async () => {
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await expect(
      mergeOpossumArchives({
        inputPaths: [
          await createArchive({
            readonlyRules: [{ path: '/docs', readonly: true }],
          }),
          await createArchive({
            projectId: 'other-project-id',
            readonlyRules: [
              { path: '/', readonly: true },
              { path: '/docs', readonly: false },
            ],
          }),
        ],
        outputPath,
      }),
    ).rejects.toThrow('same project ID');
  });

  it('does not parse input.json while merging', async () => {
    const sourcePath = await createArchive({
      inputContent: '{invalid json',
      readonlyRules: [{ path: '/docs', readonly: true }],
    });
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await mergeOpossumArchives({
      inputPaths: [
        sourcePath,
        await createArchive({
          readonlyRules: [
            { path: '/', readonly: true },
            { path: '/docs', readonly: false },
          ],
        }),
      ],
      outputPath,
    });

    expect(new AdmZip(outputPath).getEntry('output.json')).toBeDefined();
  });

  it('rejects overlapping editable partitions', async () => {
    const outputPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await expect(
      mergeOpossumArchives({
        inputPaths: [
          await createArchive({
            readonlyRules: [
              { path: '/', readonly: true },
              { path: '/docs', readonly: false },
            ],
          }),
          await createArchive({
            readonlyRules: [
              { path: '/', readonly: true },
              { path: '/docs', readonly: false },
            ],
          }),
        ],
        outputPath,
      }),
    ).rejects.toBeInstanceOf(MergeOpossumFilesError);
  });
});

async function createArchive({
  additionalFile,
  inputContent,
  output: archiveOutput,
  projectId = input.metadata.projectId,
  readonlyRules,
}: {
  additionalFile?: string;
  inputContent?: string;
  output?: ParsedOpossumOutputFile;
  projectId?: string;
  readonlyRules: Array<ReadonlyRule>;
}): Promise<string> {
  const archivePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  const archiveInput = { ...input, metadata: { projectId } };
  const outputWithProjectId: ParsedOpossumOutputFile = archiveOutput
    ? {
        ...archiveOutput,
        metadata: {
          ...archiveOutput.metadata,
          projectId,
        },
      }
    : {
        metadata: { fileCreationDate: 'today', projectId },
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: [],
      };
  const zip = new AdmZip();
  zip.addFile(
    INPUT_FILE_NAME,
    Buffer.from(inputContent ?? JSON.stringify(archiveInput)),
  );
  if (additionalFile) {
    zip.addFile('additional-data.txt', Buffer.from(additionalFile));
  }
  await writeOpossumFile({
    output: outputWithProjectId,
    path: archivePath,
    readonlyRules,
    zip,
  });
  return archivePath;
}

function getPermutations<T>(values: Array<T>): Array<Array<T>> {
  if (values.length === 0) {
    return [[]];
  }
  return values.flatMap((value, index) =>
    getPermutations(values.filter((_, otherIndex) => otherIndex !== index)).map(
      (permutation) => [value, ...permutation],
    ),
  );
}

async function copyArchiveWithOutput(
  sourcePath: string,
  archiveOutput: ParsedOpossumOutputFile,
): Promise<string> {
  const archivePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  const sourceZip = new AdmZip(sourcePath);
  const zip = new AdmZip();
  for (const entry of sourceZip.getEntries()) {
    zip.addFile(entry.entryName, entry.getData());
  }
  await writeOpossumFile({
    output: archiveOutput,
    path: archivePath,
    zip,
  });
  return archivePath;
}

function output({
  attributions,
  resolved = [],
}: {
  attributions: Record<string, string>;
  resolved?: Array<string>;
}): ParsedOpossumOutputFile {
  return {
    metadata: {
      fileCreationDate: 'today',
      projectId: input.metadata.projectId,
    },
    manualAttributions: Object.fromEntries(
      Object.values(attributions).map((attributionUuid) => [
        attributionUuid,
        { packageName: attributionUuid },
      ]),
    ),
    resourcesToAttributions: Object.fromEntries(
      Object.entries(attributions).map(([directory, attributionUuid]) => [
        `/${directory}/`,
        [attributionUuid],
      ]),
    ),
    resolvedExternalAttributions: resolved,
  };
}

async function parseMergedArchive(filePath: string) {
  const parsed = await parseOpossumFile(filePath);
  if ('type' in parsed) {
    throw new Error(parsed.message);
  }
  return parsed;
}

function getReadonlyRules(filePath: string): Array<ReadonlyRule> {
  return JSON.parse(new AdmZip(filePath).readAsText(SPLIT_INFO_FILE_NAME))
    .readonlyRules as Array<ReadonlyRule>;
}
