// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { openUrl } from '../open-url';

describe('openUrl', () => {
  it('checks protocol is getting added if originally missing', () => {
    const urlString = 'www.google.com';
    openUrl(urlString);
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(
      'https://' + urlString,
    );
  });

  it('does not add protocol if originally present', () => {
    const urlString = 'https://www.google.com';
    openUrl(urlString);
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(urlString);
  });
});
