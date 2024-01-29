// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor } from '@testing-library/react';
import { without } from 'lodash';

import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import {
  AttributionFormConfig,
  FORM_ATTRIBUTES,
  FormAttribute,
} from '../../AttributionColumn/AttributionForm';
import { useAttributionFormConfigs } from '../DiffPopup.util';

describe('useAttributionFormConfigs', () => {
  const EMPTY_CONFIG: AttributionFormConfig = {
    copyright: { color: undefined, focused: false },
    licenseName: { color: undefined, focused: false },
    licenseText: { color: undefined, focused: false },
    packageName: { color: undefined, focused: false },
    packageNamespace: { color: undefined, focused: false },
    packageVersion: { color: undefined, focused: false },
    url: { color: undefined, focused: false },
    packageType: { color: undefined, focused: false },
  };

  it.each(
    without(FORM_ATTRIBUTES, 'firstParty') as Array<
      Exclude<FormAttribute, 'firstParty'>
    >,
  )(
    'computes attribution form config correctly when %s changes',
    async (attribute) => {
      const originalPackageInfo = faker.opossum.packageInfo();
      const currentPackageInfo = faker.opossum.packageInfo({
        ...originalPackageInfo,
        [attribute]: faker.internet.domainWord(),
      });

      const { result } = renderHook(() =>
        useAttributionFormConfigs({
          original: originalPackageInfo,
          current: currentPackageInfo,
        }),
      );

      await waitFor(() =>
        expect(result.current).toEqual<
          [AttributionFormConfig, AttributionFormConfig]
        >([
          {
            ...EMPTY_CONFIG,
            [attribute]: { focused: true, color: 'error' },
          },
          {
            ...EMPTY_CONFIG,
            [attribute]: { focused: true, color: 'success' },
          },
        ]),
      );
    },
  );

  const EXPECTED_ORIGINAL_CONFIG: AttributionFormConfig = {
    copyright: { color: 'error', focused: true },
    licenseName: { color: 'error', focused: true },
    licenseText: { color: 'error', focused: true },
    packageName: { color: undefined, focused: false },
    packageNamespace: { color: undefined, focused: false },
    packageVersion: { color: undefined, focused: false },
    url: { color: undefined, focused: false },
    packageType: { color: undefined, focused: false },
  };
  const EXPECTED_CURRENT_CONFIG: AttributionFormConfig = {
    copyright: { color: 'success', focused: true },
    licenseName: { color: 'success', focused: true },
    licenseText: { color: 'success', focused: true },
    packageName: { color: undefined, focused: false },
    packageNamespace: { color: undefined, focused: false },
    packageVersion: { color: undefined, focused: false },
    url: { color: undefined, focused: false },
    packageType: { color: undefined, focused: false },
  };

  it.each<[boolean, boolean, [AttributionFormConfig, AttributionFormConfig]]>([
    [true, true, [EMPTY_CONFIG, EMPTY_CONFIG]],
    [true, false, [EXPECTED_ORIGINAL_CONFIG, EXPECTED_CURRENT_CONFIG]],
    [false, true, [EXPECTED_ORIGINAL_CONFIG, EXPECTED_CURRENT_CONFIG]],
    [false, false, [EMPTY_CONFIG, EMPTY_CONFIG]],
  ])(
    'computes attribution form config correctly if original is first party: %s and current is first party: %s',
    async (originalFirstParty, currentFirstParty, expectedConfigs) => {
      const originalPackageInfo = faker.opossum.packageInfo({
        firstParty: originalFirstParty,
      });
      const currentPackageInfo = faker.opossum.packageInfo({
        ...originalPackageInfo,
        ...{ firstParty: currentFirstParty },
      });

      const { result } = renderHook(() =>
        useAttributionFormConfigs({
          original: originalPackageInfo,
          current: currentPackageInfo,
        }),
      );

      await waitFor(() =>
        expect(result.current).toEqual<
          [AttributionFormConfig, AttributionFormConfig]
        >(expectedConfigs),
      );
    },
  );
});
