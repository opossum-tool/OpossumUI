// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as Viz from '@viz-js/viz';
import { promises as fs } from 'fs';
import { type Kysely, sql } from 'kysely';

import type { DB } from './generated/databaseTypes';
import { comments } from './initializeDb';

export async function generateDiagram(
  db: Kysely<DB>,
  filename: string,
): Promise<void> {
  const schema = await sql<{ name: string }>`pragma table_list`.execute(db);
  const tables = schema.rows
    .map((r) => r.name)
    .filter((n) => !n.startsWith('sqlite_'))
    .sort((left, right) => left.localeCompare(right));

  const graphvizTables: Array<string> = [];
  const graphvizForeignKeys: Array<string> = [];

  for (const table of tables) {
    const rows = (
      await sql
        .raw<{
          name: string;
          type: string;
          pk: number; // primary key? 0 or 1
          notnull: number; // 0 or 1
          hidden: number; // 0 if normal, 2 if virtual generated, 3 if stored generated,
        }>(`pragma table_xinfo(${table})`)
        .execute(db)
    ).rows;

    const graphvizRows = rows.map((r) => {
      const rowComment =
        table in comments ? comments[table][r.name] : undefined;
      const icon = r.pk ? '🔑 ' : r.hidden !== 0 ? '🔧 ' : '';
      const titleAttr = rowComment ? `TITLE="${rowComment}"` : '';
      const rowCommentIcon = rowComment ? ' 📝' : '';
      const nullable = r.notnull ? '' : '?';

      return (
        '<TR>' +
        `<TD PORT="${r.name}_in">${icon}</TD>` +
        `<TD ALIGN="LEFT" ${titleAttr}>${r.name}${rowCommentIcon}</TD>` +
        `<TD PORT="${r.name}_out" ALIGN="LEFT">${r.type}${nullable}</TD>` +
        '</TR>'
      );
    });

    const tableComment =
      table in comments ? comments[table]['_table_'] : undefined;

    const tableTitleAttr = tableComment ? ` TITLE="${tableComment}"` : '';
    const tableCommentIcon = tableComment ? ' 📝' : '';

    graphvizTables.push(
      `${table} [label=<` +
        '<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">' +
        `<TR><TD COLSPAN="3" ${tableTitleAttr}><B>${table}${tableCommentIcon}</B></TD></TR>${graphvizRows.join(
          '',
        )}</TABLE>` +
        '>];',
    );

    const foreignKeys = (
      await sql
        .raw<{
          table: string;
          from: string;
          to: string;
        }>(`pragma foreign_key_list(${table})`)
        .execute(db)
    ).rows.sort(
      (left, right) =>
        left.table.localeCompare(right.table) ||
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to),
    );

    for (const fk of foreignKeys) {
      graphvizForeignKeys.push(
        `${table}:${fk.from}_out:e -> ${fk.table}:${fk.to}_in:w;`,
      );
    }
  }

  // Not a foreign key, because in some exceptions, external_attribution_source_key contains undefined source names
  // But we still want a nice arrow in the diagram
  graphvizForeignKeys.push(
    'source_for_attribution:external_attribution_source_key_out:e -> external_attribution_source:key_in:w [style=dashed];',
  );
  graphvizForeignKeys.sort((left, right) => left.localeCompare(right));

  const graphvizSource = `digraph g {
  graph[label="Open the SVG in a browser to see tooltips on comments 📝\n🔑: Primary key\n🔧: Generated column", fontsize=10];
  rankdir="LR";
  node [shape=plaintext];

  ${graphvizTables.join('\n  ')}

  ${graphvizForeignKeys.join('\n  ')}
}`;

  const viz = await Viz.instance();
  // This is not a test, and that is not the test render function
  // eslint-disable-next-line testing-library/render-result-naming-convention
  const renderResult = viz.render(graphvizSource, { format: 'svg' });

  if (renderResult.status !== 'success') {
    throw Error(
      `Error rendering svg diagram: ${JSON.stringify(renderResult.errors)}`,
    );
  }

  await fs.writeFile(filename, renderResult.output, 'utf8');
}
