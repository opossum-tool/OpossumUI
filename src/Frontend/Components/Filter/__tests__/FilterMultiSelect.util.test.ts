// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { renderHook } from '../../../test-helpers/render';
import { Filter, useFilteredAttributions } from '../FilterMultiSelect.util';

describe('useFilteredAttributions', () => {
  it('returns filtered attributions without filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      followUp: 'FOLLOW_UP',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
    });
  });

  it('returns filtered attributions with follow-up filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      followUp: 'FOLLOW_UP',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
        setVariable<Array<Filter>>('active-filters', ['Needs Follow-Up']),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with only first party filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
        setVariable<Array<Filter>>('active-filters', ['First Party']),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with hide first party filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
        setVariable<Array<Filter>>('active-filters', ['Third Party']),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId2]: packageInfo2,
    });
  });

  it('returns filtered attributions with only needs review filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      needsReview: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
        setVariable<Array<Filter>>('active-filters', ['Needs Review by QA']),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with only preferred filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      preferred: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
        setVariable<Array<Filter>>('active-filters', ['Currently Preferred']),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with modified preferred filter', () => {
    const originId1 = faker.string.uuid();
    const originId2 = faker.string.uuid();
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      originIds: [originId1],
      wasPreferred: false,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      originIds: [originId2],
      wasPreferred: false,
    });
    const [attributionId3, packageInfo3] = faker.opossum.externalAttribution({
      originIds: [originId1],
      wasPreferred: true,
    });
    const [attributionId4, packageInfo4] = faker.opossum.externalAttribution({
      originIds: [originId2],
      wasPreferred: false,
    });
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          faker.opossum.manualAttributions({
            [attributionId1]: packageInfo1,
            [attributionId2]: packageInfo2,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId1, attributionId2],
          }),
        ),
        setExternalData(
          faker.opossum.externalAttributions({
            [attributionId3]: packageInfo3,
            [attributionId4]: packageInfo4,
          }),
          faker.opossum.resourcesToAttributions({
            [faker.opossum.filePath()]: [attributionId3, attributionId4],
          }),
        ),
        setVariable<Array<Filter>>('active-filters', [
          'Modified Previously Preferred',
        ]),
      ],
    });

    expect(result.current.attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });
});
