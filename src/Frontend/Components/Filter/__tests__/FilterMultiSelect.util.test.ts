// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../../shared/Faker';
import { Attributions, FollowUp } from '../../../../shared/shared-types';
import { setManualData } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { renderHook } from '../../../test-helpers/render';
import { Filter, useFilteredAttributions } from '../FilterMultiSelect.util';

describe('useFilteredAttributions', () => {
  const testManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120002';
  const testOtherManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120003';
  const testManualAttributions: Attributions = {};
  testManualAttributions[testManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some comment',
    packageName: 'Test package',
    packageVersion: '1.0',
    copyright: 'Copyright John Doe',
    licenseText: 'Some license text',
    firstParty: true,
  };
  testManualAttributions[testOtherManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some other comment',
    packageName: 'Test other package',
    packageVersion: '2.0',
    copyright: 'other Copyright John Doe',
    licenseText: 'Some other license text',
    followUp: FollowUp,
    needsReview: true,
    preferred: true,
  };

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
});
