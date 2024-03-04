// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../testing/Faker';
import { getModifiedPreferredState } from '../get-modified-preferred-state';

describe('getModifiedPreferredState', () => {
  it('identifies modified attribution with original signal that was preferred as modified preferred', () => {
    const originId = faker.string.uuid();
    const attribution = faker.opossum.packageInfo({
      id: faker.string.uuid(),
      packageName: faker.word.noun(),
      wasPreferred: undefined,
      originIds: [originId, faker.string.uuid(), faker.string.uuid()],
    });
    const externalAttributionsList = [
      {
        id: faker.string.uuid(),
        packageName: faker.word.noun(),
        wasPreferred: true,
        originIds: [originId, faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
    ];
    expect(
      getModifiedPreferredState({ attribution, externalAttributionsList }),
    ).toEqual({ modifiedPreferred: true, wasPreferred: undefined });
  });

  it('identifies an attribution that became identical to original was preferred signal as was preferred', () => {
    const originId = faker.string.uuid();
    const attribution = faker.opossum.packageInfo({
      id: faker.string.uuid(),
      packageName: faker.word.noun(),
      wasPreferred: undefined,
      originIds: [originId, faker.string.uuid(), faker.string.uuid()],
    });
    const externalAttributionsList = [
      {
        ...attribution,
        wasPreferred: true,
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
    ];

    expect(
      getModifiedPreferredState({ attribution, externalAttributionsList }),
    ).toEqual({ modifiedPreferred: undefined, wasPreferred: true });
  });

  it('returns undefined if there is no original', () => {
    const packageName = faker.word.noun();
    const attribution = faker.opossum.packageInfo({
      id: faker.string.uuid(),
      packageName,
      wasPreferred: undefined,
      originIds: [faker.string.uuid(), faker.string.uuid()],
    });
    const externalAttributionsList = [
      {
        id: faker.string.uuid(),
        packageName,
        wasPreferred: true,
        originIds: [faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
    ];
    expect(
      getModifiedPreferredState({ attribution, externalAttributionsList }),
    ).toBeUndefined();
  });

  it('returns undefined if the attribution is wasPreferred', () => {
    const originId = faker.string.uuid();
    const packageName = faker.word.noun();
    const attribution = faker.opossum.packageInfo({
      id: faker.string.uuid(),
      packageName,
      wasPreferred: true,
      originIds: [originId, faker.string.uuid(), faker.string.uuid()],
    });
    const externalAttributionsList = [
      {
        id: faker.string.uuid(),
        packageName,
        wasPreferred: true,
        originIds: [originId, faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
    ];
    expect(
      getModifiedPreferredState({ attribution, externalAttributionsList }),
    ).toBeUndefined();
  });

  it('returns undefined if the original is not wasPreferred', () => {
    const originId = faker.string.uuid();
    const packageName = faker.word.noun();
    const attribution = faker.opossum.packageInfo({
      id: faker.string.uuid(),
      packageName,
      wasPreferred: true,
      originIds: [originId, faker.string.uuid(), faker.string.uuid()],
    });
    const externalAttributionsList = [
      {
        id: faker.string.uuid(),
        packageName,
        wasPreferred: undefined,
        originIds: [originId, faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
      {
        id: faker.string.uuid(),
        wasPreferred: true,
        originIds: [faker.string.uuid(), faker.string.uuid()],
      },
    ];
    expect(
      getModifiedPreferredState({ attribution, externalAttributionsList }),
    ).toBeUndefined();
  });
});
