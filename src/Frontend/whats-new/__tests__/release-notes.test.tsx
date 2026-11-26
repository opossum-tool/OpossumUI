// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponent } from '../../test-helpers/render';
import { ReleaseNotes, screenshots } from '../release-notes';

const screenshotUrls = Object.values(screenshots);

describe('ReleaseNotes', () => {
  it('resolves every screenshot in the shipped notes to a bundled asset', async () => {
    await renderComponent(<ReleaseNotes />);

    for (const image of screen.queryAllByRole('img')) {
      const src = image.getAttribute('src');
      expect(screenshotUrls, `Unresolved screenshot: ${src}`).toContain(src);
    }
  });
});
