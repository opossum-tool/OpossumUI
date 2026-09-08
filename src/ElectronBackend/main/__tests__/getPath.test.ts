// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

import { getBasePathOfAssets, getBasePathOfIcons } from '../getPath';

describe('getPath helpers', () => {
  it('uses the app path for development assets and icons when basePath is provided', () => {
    expect(getBasePathOfAssets('/repo')).toBe(
      path.join('/repo', 'public', 'assets'),
    );
    expect(getBasePathOfIcons('/repo')).toBe(
      path.join('/repo', 'public', 'icons'),
    );
  });

  it('resolves the repo root when development starts from build/ElectronBackend with basePath', () => {
    expect(getBasePathOfAssets('/repo')).toBe(
      path.join('/repo', 'public', 'assets'),
    );
    expect(getBasePathOfIcons('/repo')).toBe(
      path.join('/repo', 'public', 'icons'),
    );
  });

  it('uses packaged app path for assets and icons when basePath is provided', () => {
    expect(getBasePathOfAssets('/packaged/app.asar')).toBe(
      path.join('/packaged/app.asar', 'public', 'assets'),
    );
    expect(getBasePathOfIcons('/packaged/app.asar')).toBe(
      path.join('/packaged/app.asar', 'public', 'icons'),
    );
  });
});
