// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act } from '@testing-library/react';
import React from 'react';
import { View } from '../../../enums/enums';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { getSelectedView } from '../../../state/selectors/view-selector';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  getProgressBarBackground,
  roundToAtLeastOnePercentAndNormalize,
  useOnProgressBarClick,
} from '../progress-bar-helpers';
import { setExpandedIds } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/audit-view-resource-selectors';
import { ProgressBarData } from '../../../types/types';
import { OpossumColors } from '../../../shared-styles';
import each from 'jest-each';

let useOnProgressBarClickHook: () => void;

function TestComponent(props: { resourceIds: Array<string> }): JSX.Element {
  useOnProgressBarClickHook = useOnProgressBarClick(props.resourceIds);
  return <div>test</div>;
}

describe('ProgressBar helpers', () => {
  it('useOnProgressBarClickHook sets correct resourceId', () => {
    const { store } = renderComponentWithStore(
      <TestComponent resourceIds={['id_1', 'id_2']} />
    );

    expect(getSelectedResourceId(store.getState())).toEqual('');
    expect(getExpandedIds(store.getState())).toEqual(['/']);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toEqual('id_1');
    expect(getExpandedIds(store.getState())).toEqual(['id_1']);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toEqual('id_2');
    expect(getExpandedIds(store.getState())).toEqual(['id_2']);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toEqual('id_1');
    expect(getExpandedIds(store.getState())).toEqual(['id_1']);
  });

  it('useOnProgressBarClickHook selects audit view', () => {
    const { store } = renderComponentWithStore(
      <TestComponent resourceIds={['id_1']} />
    );
    store.dispatch(navigateToView(View.Attribution));

    expect(getSelectedResourceId(store.getState())).toEqual('');
    expect(getExpandedIds(store.getState())).toEqual(['/']);
    expect(getSelectedView(store.getState())).toEqual(View.Attribution);

    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toEqual('id_1');
    expect(getExpandedIds(store.getState())).toEqual(['id_1']);
    expect(getSelectedView(store.getState())).toEqual(View.Audit);
  });

  it('useOnProgressBarClickHook works with empty list', () => {
    const { store } = renderComponentWithStore(
      <TestComponent resourceIds={[]} />
    );
    store.dispatch(setExpandedIds(['test_id']));

    expect(getSelectedResourceId(store.getState())).toEqual('');
    expect(getExpandedIds(store.getState())).toEqual(['test_id']);
    act(() => useOnProgressBarClickHook());
    expect(getSelectedResourceId(store.getState())).toEqual('');
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
    };
    const expectedProgressBarBackground: string =
      'linear-gradient(to right,' +
      ` ${OpossumColors.pastelDarkGreen} 33%,` +
      ` ${OpossumColors.pastelLightGreen} 33%,` +
      ` ${OpossumColors.pastelMiddleGreen} 66%,` +
      ` ${OpossumColors.pastelRed} 66% 99%,` +
      ` ${OpossumColors.lightestBlue} 99%)`;
    const actualProgressBarBackground = getProgressBarBackground(
      testProgressBarData,
      'TopProgressBar'
    );
    expect(actualProgressBarBackground).toEqual(expectedProgressBarBackground);
  });

  each([
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
  ]).it(
    'roundToAtLeastOnePercentAndNormalize rounds and subtracts difference from the maximum',
    (input: Array<number>, expectedOutput: Array<number>) => {
      expect(roundToAtLeastOnePercentAndNormalize(input)).toEqual(
        expectedOutput
      );
    }
  );
});
