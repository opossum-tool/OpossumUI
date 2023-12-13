// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo } from '../../../../shared/shared-types';
import { HighlightingColor } from '../../../enums/enums';
import { getPackageCardHighlighting } from '../package-card-helpers';

describe('The PackageCardHelper', () => {
  it.each([
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
        packageNamespace: 'some package namespace',
        packageType: 'github',
        packageVersion: 'some package version',
        url: 'some url',
        copyright: 'some copyright',
        attributionIds: ['abc'],
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
        attributionIds: ['abc'],
      },
      undefined,
    ],
  ])(
    'for %s packageInfo gives %s highlighting',
    (
      displayPackageInfo: DisplayPackageInfo,
      expectedHighlighting: HighlightingColor | undefined,
    ) => {
      const actualHighlighting = getPackageCardHighlighting(displayPackageInfo);
      expect(actualHighlighting).toEqual(expectedHighlighting);
    },
  );
});
