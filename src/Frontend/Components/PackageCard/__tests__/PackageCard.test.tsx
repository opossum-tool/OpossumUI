// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { PackageCard } from '../PackageCard';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { ButtonText, DiscreteConfidence } from '../../../enums/enums';
import { clickOnButtonInPackageContextMenu } from '../../../test-helpers/context-menu-test-helpers';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { getMultiSelectSelectedAttributionIds } from '../../../state/selectors/attribution-view-resource-selectors';

const testResources: Resources = {
  thirdParty: {
    'package_1.tr.gz': 1,
    'package_2.tr.gz': 1,
    'jQuery.js': 1,
  },
};
const testAttributionId = 'attributionId';
const anotherAttributionId = 'another_id';
const testAttributions: Attributions = {
  [testAttributionId]: { packageName: 'pkg', preSelected: true },
  [anotherAttributionId]: { packageName: 'pkg2', preSelected: true },
};

describe('The PackageCard', () => {
  test('has working confirm button', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackageCard
        attributionId={testAttributionId}
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardContent={{
          id: 'some_id',
          name: 'packageName',
        }}
        onClick={doNothing}
      />,
      { store: testStore }
    );

    expect(screen.getByText('packageName'));

    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ]
    ).toEqual(testAttributions[testAttributionId]);
    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.Confirm
    );
    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ]
    ).toEqual({
      ...testAttributions[testAttributionId],
      attributionConfidence: DiscreteConfidence.High,
      preSelected: undefined,
    });
  });

  test('has working confirm globally button', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
      'package_2.tr.gz': [testAttributionId],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackageCard
        attributionId={testAttributionId}
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardContent={{
          id: 'some_id',
          name: 'packageName',
        }}
        onClick={doNothing}
      />,
      { store: testStore }
    );

    expect(screen.getByText('packageName'));

    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ]
    ).toEqual(testAttributions[testAttributionId]);
    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.ConfirmGlobally
    );
    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ]
    ).toEqual({
      ...testAttributions[testAttributionId],
      attributionConfidence: DiscreteConfidence.High,
      preSelected: undefined,
    });
  });

  test('has working multi-select box in multi-select mode', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
      'package_2.tr.gz': [testAttributionId],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    const { store } = renderComponentWithStore(
      <PackageCard
        attributionId={testAttributionId}
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardContent={{
          id: 'some_id',
          name: 'packageName',
        }}
        onClick={doNothing}
        showCheckBox={true}
      />,
      { store: testStore }
    );

    expect(screen.getByText('packageName'));
    expect(screen.queryByText('checkbox')).not.toBeInTheDocument();
    act(() => {
      store.dispatch(
        setMultiSelectSelectedAttributionIds([anotherAttributionId])
      );
    });
    fireEvent.click(screen.getByRole('checkbox') as Element);
    expect(
      getMultiSelectSelectedAttributionIds(store.getState())
    ).toStrictEqual([anotherAttributionId, testAttributionId]);

    fireEvent.click(screen.getByRole('checkbox') as Element);

    expect(
      getMultiSelectSelectedAttributionIds(store.getState())
    ).toStrictEqual([anotherAttributionId]);
  });

  test('has working confirm selected globally button', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
      'package_2.tr.gz': [testAttributionId],
      'jQuery.js': [anotherAttributionId],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <div>
        <PackageCard
          attributionId={testAttributionId}
          cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
          cardContent={{
            id: 'some_id',
            name: 'packageName',
          }}
          onClick={doNothing}
          showCheckBox={true}
        />
        ,
        <PackageCard
          attributionId={anotherAttributionId}
          cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
          cardContent={{
            id: 'some_id_2',
            name: 'packageName2',
          }}
          onClick={doNothing}
          showCheckBox={true}
        />
      </div>,
      { store: testStore }
    );

    expect(screen.getByText('packageName'));

    (screen.getAllByRole('checkbox') as Element[]).forEach((checkbox) =>
      fireEvent.click(checkbox)
    );
    const attributions =
      testStore.getState().resourceState.allViews.manualData.attributions;
    expect(attributions[testAttributionId]).toEqual(
      testAttributions[testAttributionId]
    );
    expect(attributions[anotherAttributionId]).toEqual(
      testAttributions[anotherAttributionId]
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.ConfirmSelectedGlobally
    );
    const updatedAttributions =
      testStore.getState().resourceState.allViews.manualData.attributions;
    expect(updatedAttributions[testAttributionId].preSelected).toBeFalsy();
    expect(updatedAttributions[anotherAttributionId].preSelected).toBeFalsy();
  });
});
