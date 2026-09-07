// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Attributions } from '../../../../../../shared/shared-types';
import { faker } from '../../../../../../testing/Faker';
import { getSignalGroups } from '../SignalsList.util';

describe('getSignalGroups', () => {
  const attribution = faker.opossum.packageInfo({
    id: 'attribution-id',
    source: { name: 'scanner' },
  });
  const attributions: Attributions = { [attribution.id]: attribution };
  const sourceGroups = [
    { name: 'ScanCode', visibleCount: 1, editableCount: 1 },
  ];

  it('waits for source mappings before grouping loaded cards', () => {
    expect(
      getSignalGroups({
        activeAttributionIds: [attribution.id],
        attributions,
        sourceGroups,
        sources: undefined,
      }),
    ).toEqual({
      groupedIds: null,
    });
  });

  it('returns an empty list when there are no loaded signals', () => {
    expect(
      getSignalGroups({
        activeAttributionIds: [],
        attributions: {},
        sourceGroups: undefined,
        sources: undefined,
      }),
    ).toEqual({ groupedIds: {} });
  });

  it('uses configured source groups once source mappings are available', () => {
    expect(
      getSignalGroups({
        activeAttributionIds: [attribution.id],
        attributions,
        sourceGroups,
        sources: { scanner: { name: 'ScanCode', priority: 1 } },
      }),
    ).toEqual({
      groupedIds: { ScanCode: [attribution.id] },
    });
  });
});
