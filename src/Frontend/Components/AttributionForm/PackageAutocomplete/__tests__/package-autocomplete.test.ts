// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Criticality,
  type PackageInfo,
} from '../../../../../shared/shared-types';
import { toPackagePatch } from '../PackageAutocomplete';

test('keeps complete enrichment data while excluding attribution metadata', () => {
  const packageInfo: PackageInfo = {
    id: 'attribution-id',
    packageName: 'name',
    packageNamespace: 'namespace',
    packageVersion: '1.0.0',
    packageType: 'npm',
    url: 'https://example.com',
    copyright: 'Copyright',
    licenseName: 'MIT',
    licenseText: 'MIT text',
    comment: 'comment',
    criticality: Criticality.None,
    source: { name: 'source' },
  };

  expect(toPackagePatch(packageInfo)).toEqual({
    packageName: 'name',
    packageNamespace: 'namespace',
    packageVersion: '1.0.0',
    packageType: 'npm',
    url: 'https://example.com',
    copyright: 'Copyright',
    licenseName: 'MIT',
    licenseText: 'MIT text',
    comment: 'comment',
  });
});
