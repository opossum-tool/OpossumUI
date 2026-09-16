// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

export function jsonArraySelection<T extends string | number>(
  values: Array<T>,
) {
  return sql<T>`(
    select value from json_each(${JSON.stringify(values)})
  )`;
}
