// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor } from '@testing-library/react';
import { without } from 'lodash';

import {
  COMPARABLE_ATTRIBUTES,
  ComparableAttribute,
} from '../../../../shared/get-comparable-attributes';
import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import { AttributionFormConfig } from '../../AttributionForm/AttributionForm';
import { useAttributionFormConfigs } from '../DiffPopup.util';

describe('useAttributionFormConfigs', () => {
  const EMPTY_ORIGINAL_CONFIG =
    COMPARABLE_ATTRIBUTES.reduce<AttributionFormConfig>((acc, attribute) => {
      return attribute !== 'firstParty'
        ? { ...acc, [attribute]: { color: undefined, focused: false } }
        : { ...acc, [attribute]: { color: undefined } };
    }, {});

  const EMPTY_BUFFER_CONFIG =
    COMPARABLE_ATTRIBUTES.reduce<AttributionFormConfig>((acc, attribute) => {
      return attribute !== 'firstParty'
        ? {
            ...acc,
            [attribute]: {
              color: undefined,
              focused: false,
              endIcon: undefined,
            },
          }
        : {
            ...acc,
            [attribute]: { color: undefined, endIcon: undefined },
          };
    }, {});

  it.each(
    without(COMPARABLE_ATTRIBUTES, 'firstParty') as Array<
      Exclude<ComparableAttribute, 'firstParty'>
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

      await waitFor(() => {
        expect(
          result.current.originalFormConfig,
        ).toEqual<AttributionFormConfig>({
          ...EMPTY_ORIGINAL_CONFIG,
          [attribute]: { focused: true, color: 'error' },
        });
      });
      await waitFor(() =>
        expect(result.current.bufferFormConfig).toEqual<AttributionFormConfig>({
          ...EMPTY_BUFFER_CONFIG,
          [attribute]: {
            focused: true,
            color: 'success',
            endIcon: expect.anything(),
          },
        }),
      );
    },
  );

  const EXPECTED_ORIGINAL_CONFIG =
    COMPARABLE_ATTRIBUTES.reduce<AttributionFormConfig>((acc, attribute) => {
      return attribute !== 'firstParty'
        ? { ...acc, [attribute]: { color: undefined, focused: false } }
        : { ...acc, [attribute]: { color: 'error' } };
    }, {});

  const EXPECTED_BUFFER_CONFIG =
    COMPARABLE_ATTRIBUTES.reduce<AttributionFormConfig>((acc, attribute) => {
      return attribute !== 'firstParty'
        ? {
            ...acc,
            [attribute]: {
              color: undefined,
              focused: false,
              endIcon: undefined,
            },
          }
        : {
            ...acc,
            [attribute]: { color: 'success', endIcon: expect.anything() },
          };
    }, {});

  it.each<[boolean, boolean, [AttributionFormConfig, AttributionFormConfig]]>([
    [true, true, [EMPTY_ORIGINAL_CONFIG, EMPTY_BUFFER_CONFIG]],
    [true, false, [EXPECTED_ORIGINAL_CONFIG, EXPECTED_BUFFER_CONFIG]],
    [false, true, [EXPECTED_ORIGINAL_CONFIG, EXPECTED_BUFFER_CONFIG]],
    [false, false, [EMPTY_ORIGINAL_CONFIG, EMPTY_BUFFER_CONFIG]],
  ])(
    'computes attribution form config correctly if original is first party: %s and current is first party: %s',
    async (originalFirstParty, currentFirstParty, expectedConfigs) => {
      const originalPackageInfo = faker.opossum.packageInfo({
        firstParty: originalFirstParty,
      });
      const bufferPackageInfo = faker.opossum.packageInfo({
        ...originalPackageInfo,
        ...{ firstParty: currentFirstParty },
      });

      const { result } = renderHook(() =>
        useAttributionFormConfigs({
          original: originalPackageInfo,
          current: bufferPackageInfo,
        }),
      );

      await waitFor(() =>
        expect([
          result.current.originalFormConfig,
          result.current.bufferFormConfig,
        ]).toEqual<[AttributionFormConfig, AttributionFormConfig]>(
          expectedConfigs,
        ),
      );
    },
  );
});
