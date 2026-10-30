// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';

import { getAppVersion } from '../app-version';

vi.mock('electron', () => ({
  app: { isPackaged: true, getVersion: vi.fn() },
}));
vi.mock('../../../commitInfo.json', () => ({
  default: { commitInfo: 'abc1234' },
}));

describe('app version display', () => {
  it.each([
    ['2026.1020.0', 'OpossumUI-2026-10-20'],
    ['2026.1020.12', 'OpossumUI-2026-10-20.12'],
    ['2026.102.1', 'OpossumUI-2026-01-02.1'],
  ])('displays packaged version %s as %s', (version, expected) => {
    vi.mocked(app.getVersion).mockReturnValue(version);

    expect(getAppVersion()).toBe(expected);
  });

  it.each(['0.1.0', '1.2.3', '2026.230.0', '2026.1020.0-dev'])(
    'includes the Git identifier for unrecognized packaged version %s',
    (version) => {
      vi.mocked(app.getVersion).mockReturnValue(version);

      expect(getAppVersion()).toBe(`${version} (abc1234)`);
    },
  );

  it('uses the Git identifier for unpackaged development builds', () => {
    vi.spyOn(app, 'isPackaged', 'get').mockReturnValue(false);
    vi.mocked(app.getVersion).mockReturnValue('2026.1020.0');

    expect(getAppVersion()).toBe('abc1234');
  });
});
