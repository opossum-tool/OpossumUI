// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
const REVISION = /<!--\s*whats-new-revision:\s*(\d+)\s*-->/g;

export function parseReleaseNotesRevision(markdown: string): number {
  const revisions = Array.from(markdown.matchAll(REVISION), ([, revision]) =>
    Number(revision),
  );
  const [revision] = revisions;
  if (revisions.length !== 1 || revision < 1) {
    throw new Error(
      'Release notes must contain exactly one "<!-- whats-new-revision: <positive integer> -->" comment',
    );
  }
  return revision;
}
