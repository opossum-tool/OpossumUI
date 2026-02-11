// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { promises as fs } from 'fs';
import { Kysely } from 'kysely';
import { SqliteDialect as CodegenDialect, generate } from 'kysely-codegen';
import { snakeCase } from 'lodash';

import { DB } from './generated/databaseTypes';
import { comments, generatedColumnsFromJsonData } from './initializeDb';

export async function generateTypes(
  db: Kysely<DB>,
  filename: string,
): Promise<void> {
  const db_types = await generate({
    db,
    dialect: new CodegenDialect(),
  });

  let result = db_types;

  result = `// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

${result}`;

  // Add comments as jsdoc to tables and colummns of generated types
  for (const [table, columns] of Object.entries(comments)) {
    // Convert from snake_case to UpperCamelCase
    const tableInterfaceName = table
      .toLowerCase()
      .replaceAll(/(^|_)[a-z]/g, (m) => m.replace('_', '').toUpperCase());

    for (const [columnName, comment] of Object.entries(columns)) {
      if (columnName === '_table_') {
        result = insertTableComment(result, tableInterfaceName, comment);
      } else {
        result = insertColumnComment(
          result,
          tableInterfaceName,
          columnName,
          comment,
        );
      }
    }
  }

  result = insertGeneratedColumnsFromJsonData(result);

  await fs.writeFile(filename, result, 'utf8');
}

function insertTableComment(
  fileContent: string,
  tableName: string,
  comment: string,
) {
  return fileContent.replace(
    new RegExp(String.raw`(export interface ${tableName} {)`),
    `/**\n * ${comment.split('\n').join('\n * ')}\n */\n$1`,
  );
}

function insertColumnComment(
  fileContent: string,
  tableName: string,
  columnName: string,
  comment: string,
) {
  return fileContent.replace(
    new RegExp(
      String.raw`(export interface ${tableName} \{[\s\S]*?)(${columnName}:)`,
    ),
    `$1/**\n   * ${comment.split('\n').join('\n   * ')}\n   */\n  $2`,
  );
}

/**
 * In the attribution table, we automatically generate columns from the data.
 * Kysely-codegen doesn't pick them up yet (https://github.com/kysely-org/kysely/issues/1397)
 */
function insertGeneratedColumnsFromJsonData(fileContent: string) {
  const datatypeToType = {
    integer: 'number',
    text: 'string',
  };
  const toInsert = generatedColumnsFromJsonData
    .map(
      ([jsonName, datatype]) =>
        `${snakeCase(jsonName)}: Generated<${datatype === 'boolean' ? 'number' : `${datatypeToType[datatype]} | null`}>;`,
    )
    .join('\n  ');

  return fileContent.replace(
    /(export interface Attribution {[^}]*)}/,
    `$1  ${toInsert}\n}`,
  );
}
