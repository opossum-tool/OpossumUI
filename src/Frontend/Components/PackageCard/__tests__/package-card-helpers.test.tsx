// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getPackageCardHighlighting } from '../package-card-helpers';
import { DisplayPackageInfo } from '../../../../shared/shared-types';
import each from 'jest-each';
import { HighlightingColor } from '../../../enums/enums';

describe('The PackageCardHelper', () => {
  each([
    [{ attributionIds: ['abc'] }, HighlightingColor.DarkOrange],
    [{ firstParty: true, attributionIds: ['abc'] }, undefined],
    [
      {
        excludeFromNotice: true,
        attributionIds: ['abc'],
      },
      undefined,
    ],
    [
      {
        packageName: 'some package name',
        attributionIds: ['abc'],
      },
      HighlightingColor.LightOrange,
    ],
    [
      {
        licenseName: 'some license name',
        packageVersion: 'some package version',
        attributionIds: ['abc'],
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
        attributionIds: ['abc'],
      },
      undefined,
    ],
  ]).it(
    'for %s packageInfo gives %s highlighting',
    (
      displayPackageInfo: DisplayPackageInfo,
      expected_highlighting: HighlightingColor | undefined,
    ) => {
      const actualHighlighting = getPackageCardHighlighting(displayPackageInfo);
      expect(actualHighlighting).toEqual(expected_highlighting);
    },
  );
});
