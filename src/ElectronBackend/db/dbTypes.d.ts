// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Generated } from 'kysely';

type SqliteBoolean = number;

export interface ResourceTable {
  id: Generated<number>;
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
  id: Generated<number>;
  uuid: string;
  data: string;
  is_external: SqliteBoolean;
  is_resolved: SqliteBoolean;
  external_attribution_source_id: string | null;
}

export interface ResourceToAttributionTable {
  resource_id: number;
  attribution_id: number;
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
  resource_to_attribution: ResourceToAttributionTable;
  frequent_license: FrequentLicenseTable;
}
