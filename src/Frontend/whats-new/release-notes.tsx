// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Markdown, { type Components } from 'react-markdown';

import releaseNotes from '../../../WHATS_NEW.md?raw';
import { Screenshot } from '../Components/WhatsNew/screenshot';
import { parseReleaseNotesRevision } from './parse-release-notes';

// The revision and authoring instructions are at the top of WHATS_NEW.md.
export const revision = parseReleaseNotesRevision(releaseNotes);

// Image paths in WHATS_NEW.md are relative to the repository root.
const screenshots = import.meta.glob<string>(
  '../../../docs/whats_new_screenshots/*',
  { eager: true, import: 'default' },
);

const components: Components = {
  p: ({ node, children }) =>
    // Remove <p> tags around figure
    node?.children.length === 1 &&
    node.children[0].type === 'element' &&
    node.children[0].tagName === 'img' ? (
      children
    ) : (
      <p>{children}</p>
    ),
  img: ({ src, alt, title }) => (
    <Screenshot
      src={screenshots[`../../../${String(src)}`] ?? src}
      alt={alt ?? ''}
    >
      {title}
    </Screenshot>
  ),
};

export function ReleaseNotes(): React.ReactNode {
  return (
    <Markdown components={components} skipHtml>
      {releaseNotes}
    </Markdown>
  );
}
