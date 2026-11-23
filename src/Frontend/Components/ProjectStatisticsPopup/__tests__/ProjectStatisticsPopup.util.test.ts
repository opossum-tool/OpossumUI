// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { orderAiAttributionStates } from '../ProjectStatisticsPopup.util';

describe('orderAiAttributionStates', () => {
  it('puts unexpected non-AI and review states first and bulk states last', () => {
    expect(
      orderAiAttributionStates([
        { name: 'nonAi', count: 9000 },
        { name: 'nonDeferredUnmodified', count: 99000 },
        { name: 'nonDeferredModified', count: 200 },
        { name: 'deferredUnmodified', count: 5 },
        { name: 'deferredModified', count: 120 },
      ]),
    ).toEqual([
      { name: 'nonAi', count: 9000 },
      { name: 'deferredModified', count: 120 },
      { name: 'deferredUnmodified', count: 5 },
      { name: 'nonDeferredModified', count: 200 },
      { name: 'nonDeferredUnmodified', count: 99000 },
    ]);
  });

  it('keeps an already ordered input unchanged', () => {
    expect(
      orderAiAttributionStates([
        { name: 'nonAi', count: 2 },
        { name: 'nonDeferredUnmodified', count: 1 },
      ]),
    ).toEqual([
      { name: 'nonAi', count: 2 },
      { name: 'nonDeferredUnmodified', count: 1 },
    ]);
  });

  it('does not modify the input array', () => {
    const states: Array<{
      name: 'nonAi' | 'deferredUnmodified';
      count: number;
    }> = [
      { name: 'nonAi', count: 1 },
      { name: 'deferredUnmodified', count: 2 },
    ];
    expect(orderAiAttributionStates(states)).not.toBe(states);
    expect(states[0].name).toBe('nonAi');
  });
});
