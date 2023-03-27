// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getPackageCardHighlighting } from '../package-card-helpers';
import { PackageInfo } from '../../../../shared/shared-types';
import each from 'jest-each';
import { HighlightingColor } from '../../../enums/enums';

describe('The PackageCardHelper', () => {
  each([
    [{}, HighlightingColor.DarkOrange],
    [{ firstParty: true }, undefined],
    [{ excludeFromNotice: true }, undefined],
    [
      {
        packageName: 'some package name',
      },
      HighlightingColor.LightOrange,
    ],
    [
      {
        licenseName: 'some license name',
        packageVersion: 'some package version',
      },
      HighlightingColor.DarkOrange,
    ],
    [
      {
        licenseName: 'some license name',
        packageName: 'some package name',
        packageVersion: 'some package version',
        url: 'some url',
        copyright: 'some copyright',
      },
      undefined,
    ],
  ]).it(
    'for %s packageInfo gives %s highlighting',
    (
      packageInfo: PackageInfo,
      expected_highlighting: HighlightingColor | undefined
    ) => {
      const actualHighlighting = getPackageCardHighlighting(packageInfo);
      expect(actualHighlighting).toEqual(expected_highlighting);
    }
  );
});
