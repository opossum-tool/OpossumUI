// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Generated } from 'kysely';

/**
 * SQLite has no boolean type, so we represent it with an integer that's 0 (false) or 1 (true)
 * The convention is to use Number(b) for converting booleans to 0/1 and Boolean(i) for converting numbers to true/false
 */
type SqliteBoolean = number;

export interface ResourceTable {
  id: Generated<number>;
  /**
   * Path of the resource, including its name. Doesn't contain a trailing /.
   */
  path: string;
  name: string;
  parent_id: number | null;
  is_attribution_breakpoint: SqliteBoolean;
  is_file: SqliteBoolean;
}

export interface ExternalAttributionSourceTable {
  name: string;
  priority: number;
  is_relevant_for_preferred: SqliteBoolean;
}

export interface AttributionTable {
  uuid: string;
  /**
   * All of the attribution data as JSON.
   */
  data: string;
  is_external: SqliteBoolean;
  is_resolved: SqliteBoolean;
}

export interface SourceForAttributionTable {
  attribution_uuid: string;
  external_attribution_source_name: string;
  document_confidence: number | null;
  additional_name: string | null;
}

export interface ResourceToAttributionTable {
  resource_id: number;
  attribution_uuid: string;
}

export interface FrequentLicenseTable {
  id: Generated<number>;
  short_name: string;
  full_name: string;
  license_text: string | null;
}

export interface Database {
  resource: ResourceTable;
  external_attribution_source: ExternalAttributionSourceTable;
  attribution: AttributionTable;
  source_for_attribution: SourceForAttributionTable;
  resource_to_attribution: ResourceToAttributionTable;
  frequent_license: FrequentLicenseTable;
}
