// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export const PARQUET_FILE_SUFFIX = '.parquet';

export const INPUT_DIR = 'input';
export const OUTPUT_DIR = 'output';

export const INPUT_FILES = {
  metadata: `${INPUT_DIR}/metadata.parquet`,
  resources: `${INPUT_DIR}/resources.parquet`,
  externalAttributions: `${INPUT_DIR}/externalAttributions.parquet`,
  resourcesToExternalAttributions: `${INPUT_DIR}/resourcesToExternalAttributions.parquet`,
  attributionBreakpoints: `${INPUT_DIR}/attributionBreakpoints.parquet`,
  filesWithChildren: `${INPUT_DIR}/filesWithChildren.parquet`,
  externalAttributionSources: `${INPUT_DIR}/externalAttributionSources.parquet`,
  baseUrlsForSources: `${INPUT_DIR}/baseUrlsForSources.parquet`,
  frequentLicenses: `${INPUT_DIR}/frequentLicenses.parquet`,
  config: `${INPUT_DIR}/config.parquet`,
} as const;

export const OUTPUT_FILES = {
  metadata: `${OUTPUT_DIR}/metadata.parquet`,
  manualAttributions: `${OUTPUT_DIR}/manualAttributions.parquet`,
  resourcesToAttributions: `${OUTPUT_DIR}/resourcesToAttributions.parquet`,
  resolvedExternalAttributions: `${OUTPUT_DIR}/resolvedExternalAttributions.parquet`,
} as const;

/**
 * Per-table DuckDB CREATE TABLE column specs. Used for both the save side
 * (CREATE TEMP TABLE ... ; APPEND ; COPY TO parquet) and to document the
 * parquet schemas.
 */
export const TABLE_SCHEMAS = {
  // input
  [INPUT_FILES.metadata]: ['data VARCHAR'],
  [INPUT_FILES.resources]: ['path VARCHAR', 'is_file BOOLEAN'],
  [INPUT_FILES.externalAttributions]: ['uuid VARCHAR', 'data VARCHAR'],
  [INPUT_FILES.resourcesToExternalAttributions]: [
    'path VARCHAR',
    'attribution_uuid VARCHAR',
  ],
  [INPUT_FILES.attributionBreakpoints]: ['path VARCHAR'],
  [INPUT_FILES.filesWithChildren]: ['path VARCHAR'],
  [INPUT_FILES.externalAttributionSources]: [
    'key VARCHAR',
    'name VARCHAR',
    'priority INTEGER',
    'is_relevant_for_preferred BOOLEAN',
  ],
  [INPUT_FILES.baseUrlsForSources]: ['path VARCHAR', 'base_url VARCHAR'],
  [INPUT_FILES.frequentLicenses]: [
    'short_name VARCHAR',
    'full_name VARCHAR',
    'default_text VARCHAR',
  ],
  [INPUT_FILES.config]: ['data VARCHAR'],
  // output
  [OUTPUT_FILES.metadata]: ['data VARCHAR'],
  [OUTPUT_FILES.manualAttributions]: ['uuid VARCHAR', 'data VARCHAR'],
  [OUTPUT_FILES.resourcesToAttributions]: [
    'path VARCHAR',
    'attribution_uuid VARCHAR',
  ],
  [OUTPUT_FILES.resolvedExternalAttributions]: ['uuid VARCHAR'],
} as const satisfies Record<string, ReadonlyArray<string>>;

export function getParquetFilePath(opossumPath: string): string {
  return `${opossumPath}${PARQUET_FILE_SUFFIX}`;
}

export function isParquetFile(path: string): boolean {
  return path.endsWith(PARQUET_FILE_SUFFIX);
}
