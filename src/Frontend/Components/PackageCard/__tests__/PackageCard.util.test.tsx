// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../../shared/shared-types';
import { HighlightingColor } from '../../../enums/enums';
import { getPackageCardHighlighting } from '../PackageCard.util';

describe('The PackageCardHelper', () => {
  it.each([
    [{ id: 'abc' }, HighlightingColor.DarkOrange],
    [{ firstParty: true, id: 'abc' }, undefined],
    [
      {
        excludeFromNotice: true,
        id: 'abc',
      },
      undefined,
    ],
    [
      {
        packageName: 'some package name',
        id: 'abc',
      },
      HighlightingColor.LightOrange,
    ],
    [
      {
        licenseName: 'some license name',
        packageVersion: 'some package version',
        id: 'abc',
      },
      HighlightingColor.DarkOrange,
    ],
    [
      {
        licenseName: 'some license name',
        packageName: 'some package name',
        packageNamespace: 'some package namespace',
        packageType: 'github',
        packageVersion: 'some package version',
        url: 'some url',
        copyright: 'some copyright',
        id: 'abc',
      },
      undefined,
    ],
    [
      {
        licenseName: 'some license name',
        packageName: 'some package name',
        packageType: 'some type',
        packageVersion: 'some package version',
        url: 'some url',
        copyright: 'some copyright',
        id: 'abc',
      },
      undefined,
    ],
  ])(
    'for %s packageInfo gives %s highlighting',
    (
      displayPackageInfo: PackageInfo,
      expectedHighlighting: HighlightingColor | undefined,
    ) => {
      const actualHighlighting = getPackageCardHighlighting(displayPackageInfo);
      expect(actualHighlighting).toEqual(expectedHighlighting);
    },
  );
});
