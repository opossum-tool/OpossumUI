// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { criticalityColor, OpossumColors } from '../../../shared-styles';
import { setExpandedIds } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { ProgressBarData } from '../../../types/types';
import {
  getCriticalityBarBackground,
  getProgressBarBackground,
  roundToAtLeastOnePercentAndNormalize,
  useOnProgressBarClick,
} from '../ProgressBar.util';

let useOnProgressBarClickHook: () => void;

function TestComponent(props: { resourceIds: Array<string> }): JSX.Element {
  useOnProgressBarClickHook = useOnProgressBarClick(props.resourceIds);
  return <div>test</div>;
}

describe('ProgressBar helpers', () => {
  it('useOnProgressBarClickHook sets correct resourceId', () => {
    const { store } = renderComponent(
      <TestComponent resourceIds={['id_1', 'id_2']} />,
    );

    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(getExpandedIds(store.getState())).toEqual(['/']);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toBe('id_1');
    expect(getExpandedIds(store.getState())).toEqual(['id_1']);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toBe('id_2');
    expect(getExpandedIds(store.getState())).toEqual(['id_2']);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toBe('id_1');
    expect(getExpandedIds(store.getState())).toEqual(['id_1']);
  });

  it('useOnProgressBarClickHook works with empty list', () => {
    const { store } = renderComponent(<TestComponent resourceIds={[]} />);
    store.dispatch(setExpandedIds(['test_id']));

    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(getExpandedIds(store.getState())).toEqual(['test_id']);
    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(getExpandedIds(store.getState())).toEqual(['test_id']);
  });

  it('getProgressBarBackground returns correct distribution', () => {
    const testProgressBarData: ProgressBarData = {
      fileCount: 9,
      filesWithManualAttributionCount: 3,
      filesWithOnlyPreSelectedAttributionCount: 3,
      filesWithOnlyExternalAttributionCount: 3,
      resourcesWithNonInheritedExternalAttributionOnly: [
        'file1',
        'file2',
        'file3',
      ],
      filesWithHighlyCriticalExternalAttributionsCount: 1,
      filesWithMediumCriticalExternalAttributionsCount: 2,
      resourcesWithHighlyCriticalExternalAttributions: ['file1'],
      resourcesWithMediumCriticalExternalAttributions: ['file2', 'file3'],
    };
    const expectedProgressBarBackground: string =
      'linear-gradient(to right,' +
      ` ${OpossumColors.pastelDarkGreen} 33%,` +
      ` ${OpossumColors.pastelLightGreen} 33%,` +
      ` ${OpossumColors.pastelMiddleGreen} 66%,` +
      ` ${OpossumColors.pastelRed} 66% 99%,` +
      ` ${OpossumColors.lightestBlue} 99%)`;
    const actualProgressBarBackground =
      getProgressBarBackground(testProgressBarData);
    expect(actualProgressBarBackground).toEqual(expectedProgressBarBackground);
  });

  it('getCriticalityBarBackground returns correct distribution', () => {
    const testProgressBarData: ProgressBarData = {
      fileCount: 9,
      filesWithManualAttributionCount: 3,
      filesWithOnlyPreSelectedAttributionCount: 3,
      filesWithOnlyExternalAttributionCount: 3,
      resourcesWithNonInheritedExternalAttributionOnly: [
        'file1',
        'file2',
        'file3',
      ],
      filesWithHighlyCriticalExternalAttributionsCount: 1,
      filesWithMediumCriticalExternalAttributionsCount: 1,
      resourcesWithHighlyCriticalExternalAttributions: ['file1'],
      resourcesWithMediumCriticalExternalAttributions: ['file2'],
    };
    const expectedCriticalityBarBackground: string =
      'linear-gradient(to right,' +
      ` ${criticalityColor.high} 34%,` +
      ` ${criticalityColor.medium} 34% 67%,` +
      ` ${OpossumColors.lightestBlue} 67%)`;
    const actualCriticalityBarBackground =
      getCriticalityBarBackground(testProgressBarData);
    expect(actualCriticalityBarBackground).toEqual(
      expectedCriticalityBarBackground,
    );
  });

  it.each([
    [
      [20.1, 29.9, 0.1, 50.0],
      [20, 30, 1, 49],
    ],
    [
      [0.0, 0.1, 0.9, 99.0],
      [0, 1, 1, 98],
    ],
    [
      [10.0, 0.1, 89.4, 0.1],
      [10, 1, 88, 1],
    ],
    [
      [0, 0, 100.2, 0],
      [0, 0.0, 100, 0],
    ],
    [
      [33, 33, 1, 33],
      [33, 33, 1, 33],
    ],
  ])(
    'roundToAtLeastOnePercentAndNormalize rounds and subtracts difference from the maximum',
    (input: Array<number>, expectedOutput: Array<number>) => {
      expect(roundToAtLeastOnePercentAndNormalize(input)).toEqual(
        expectedOutput,
      );
    },
  );
});
