// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as Viz from '@viz-js/viz';
import { promises as fs } from 'fs';
import { Kysely, sql } from 'kysely';

import { DB } from './generated/databaseTypes';
import { comments } from './initializeDb';

export async function generateDiagram(
  db: Kysely<DB>,
  filename: string,
): Promise<void> {
  const schema = await sql<{ name: string }>`pragma table_list`.execute(db);
  const tables = schema.rows
    .map((r) => r.name)
    .filter((n) => !n.startsWith('sqlite_'));

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
        }>(`pragma table_info(${table})`)
        .execute(db)
    ).rows;

    const graphvizRows = rows.map((r) => {
      const rowComment =
        table in comments ? comments[table][r.name] : undefined;
      const keyIcon = r.pk ? '🔑 ' : '';
      const titleAttr = rowComment ? `TITLE="${rowComment}"` : '';
      const rowCommentIcon = rowComment ? ' 📝' : '';
      const nullable = r.notnull ? '' : '?';

      return (
        '<TR>' +
        `<TD PORT="${r.name}_in">${keyIcon}</TD>` +
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
    ).rows;

    for (const fk of foreignKeys) {
      graphvizForeignKeys.push(
        `${table}:${fk.from}_out:e -> ${fk.table}:${fk.to}_in:w;`,
      );
    }
  }

  // Not a foreign key, because in some exceptions, external_attribution_source_name contains undefined source names
  // But we still want a nice arrow in the diagram
  graphvizForeignKeys.push(
    'source_for_attribution:external_attribution_source_name_out:e -> external_attribution_source:name_in:w [style=dashed];',
  );

  const graphvizSource = `digraph g {
  graph[label="Open the SVG in a browser to see tooltips on comments 📝", fontsize=10];
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
      `Error rendering svg diagram: ${renderResult.errors.join('; ')}`,
    );
  }

  await fs.writeFile(filename, renderResult.output, 'utf8');
}
