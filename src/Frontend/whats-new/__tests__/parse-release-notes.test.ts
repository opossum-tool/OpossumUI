// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import releaseNotes from '../../../../WHATS_NEW.md?raw';
import { parseReleaseNotesRevision } from '../parse-release-notes';

describe('parseReleaseNotesRevision', () => {
  it('parses the shipped release notes', () => {
    expect(parseReleaseNotesRevision(releaseNotes)).toBeGreaterThan(0);
  });

  it('reads the revision from its own comment', () => {
    expect(
      parseReleaseNotesRevision(
        '<!-- Instructions -->\n<!--whats-new-revision:3-->\n\n## Feature',
      ),
    ).toBe(3);
  });

  it.each([
    '## Feature',
    'whats-new-revision: 2\n\n## Feature',
    '<!--\nInstructions\nwhats-new-revision: 2\n-->',
    '<!-- whats-new-revision: 0 -->',
    '<!-- whats-new-revision: two -->',
    '<!-- whats-new-revision: 1 -->\n<!-- whats-new-revision: 2 -->',
  ])('rejects notes without exactly one valid revision: %j', (markdown) => {
    expect(() => parseReleaseNotesRevision(markdown)).toThrow(
      'whats-new-revision',
    );
  });
});
