// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import {
  PackageCard,
  CANNOT_ADD_PREFERRED_ATTRIBUTION_TOOLTIP,
} from '../PackageCard';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  Attributions,
  DiscreteConfidence,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { ButtonText, PopupType } from '../../../enums/enums';
import { clickOnButtonInPackageContextMenu } from '../../../test-helpers/context-menu-test-helpers';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { getMultiSelectSelectedAttributionIds } from '../../../state/selectors/attribution-view-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';

let testResources: Resources;
let testAttributionId: string;
let anotherAttributionId: string;
let testAttributions: Attributions;

describe('The PackageCard', () => {
  beforeEach(() => {
    testResources = {
      thirdParty: {
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
        'jQuery.js': 1,
      },
    };
    testAttributionId = 'attributionId';
    anotherAttributionId = 'another_id';
    testAttributions = {
      [testAttributionId]: { packageName: 'pkg', preSelected: true },
      [anotherAttributionId]: { packageName: 'pkg2', preSelected: true },
    };
  });

  it('has working confirm button', () => {
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
        }),
      ),
    );
    renderComponentWithStore(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
        }}
        onClick={doNothing}
      />,
      { store: testStore },
    );
    expect(screen.getByText('packageName'));

    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual(testAttributions[testAttributionId]);
    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.Confirm,
    );
    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual({
      ...testAttributions[testAttributionId],
      attributionConfidence: DiscreteConfidence.High,
      preSelected: undefined,
    });
  });

  it('has working confirm globally button', () => {
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
        }),
      ),
    );
    renderComponentWithStore(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
        }}
        onClick={doNothing}
      />,
      { store: testStore },
    );

    expect(screen.getByText('packageName'));

    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual(testAttributions[testAttributionId]);
    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.ConfirmGlobally,
    );
    expect(
      testStore.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual({
      ...testAttributions[testAttributionId],
      attributionConfidence: DiscreteConfidence.High,
      preSelected: undefined,
    });
  });

  it('has working multi-select box in multi-select mode', () => {
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
        }),
      ),
    );
    const { store } = renderComponentWithStore(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
        }}
        onClick={doNothing}
        showCheckBox={true}
      />,
      { store: testStore },
    );

    expect(screen.getByText('packageName'));
    expect(screen.queryByText('checkbox')).not.toBeInTheDocument();
    act(() => {
      store.dispatch(
        setMultiSelectSelectedAttributionIds([anotherAttributionId]),
      );
    });
    fireEvent.click(screen.getByRole('checkbox') as Element);
    expect(
      getMultiSelectSelectedAttributionIds(store.getState()),
    ).toStrictEqual([anotherAttributionId, testAttributionId]);

    fireEvent.click(screen.getByRole('checkbox') as Element);

    expect(
      getMultiSelectSelectedAttributionIds(store.getState()),
    ).toStrictEqual([anotherAttributionId]);
  });

  it('has working confirm selected globally button', () => {
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
        }),
      ),
    );
    renderComponentWithStore(
      <div>
        <PackageCard
          cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
          cardId={'some_id'}
          displayPackageInfo={{
            packageName: 'packageName',
            attributionIds: [testAttributionId],
          }}
          onClick={doNothing}
          showCheckBox={true}
        />
        ,
        <PackageCard
          cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
          cardId={'some_id_2'}
          displayPackageInfo={{
            packageName: 'packageName2',
            attributionIds: [anotherAttributionId],
          }}
          onClick={doNothing}
          showCheckBox={true}
        />
      </div>,
      { store: testStore },
    );

    expect(screen.getByText('packageName'));

    (screen.getAllByRole('checkbox') as Element[]).forEach((checkbox) =>
      fireEvent.click(checkbox),
    );
    const attributions =
      testStore.getState().resourceState.allViews.manualData.attributions;
    expect(attributions[testAttributionId]).toEqual(
      testAttributions[testAttributionId],
    );
    expect(attributions[anotherAttributionId]).toEqual(
      testAttributions[anotherAttributionId],
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.ConfirmSelectedGlobally,
    );
    const updatedAttributions =
      testStore.getState().resourceState.allViews.manualData.attributions;
    expect(updatedAttributions[testAttributionId].preSelected).toBeFalsy();
    expect(updatedAttributions[anotherAttributionId].preSelected).toBeFalsy();
  });

  it('opens AttributionWizardPopup via context menu', () => {
    const selectedResourceId = '/samplepath/';
    const testManualAttributions: Attributions = {
      uuid_0: {
        packageType: 'generic',
        packageName: 'react',
        packageNamespace: 'npm',
        packageVersion: '18.2.0',
      },
    };
    const testManualResourcesToAttributions: ResourcesToAttributions = {
      [selectedResourceId]: ['uuid_0'],
    };
    const testExternalAttributions: Attributions = {
      uuid_1: {
        packageType: 'generic',
        packageName: 'numpy',
        packageNamespace: 'pip',
        packageVersion: '1.24.1',
      },
    };
    const testExternalResourcesToAttributions: ResourcesToAttributions = {
      '/samplepath/file': ['uuid_1'],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions,
      ),
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions),
    );

    renderComponentWithStore(
      <PackageCard
        cardId={'testCardId'}
        displayPackageInfo={{
          packageName: 'testPackage',
          attributionIds: ['uuid_0'],
        }}
        cardConfig={{ isExternalAttribution: false, isSelected: true }}
        onClick={doNothing}
        hideContextMenuAndMultiSelect={false}
        showCheckBox={false}
      />,
      { store: testStore },
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'testPackage',
      ButtonText.OpenAttributionWizardPopup,
    );

    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.AttributionWizardPopup,
    );
  });

  it('add button for preferred attribution is disabled', () => {
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
        }),
      ),
    );
    renderComponentWithStore(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
          preferred: true,
        }}
        onClick={doNothing}
        onIconClick={doNothing}
        showCheckBox={true}
      />,
      { store: testStore },
    );

    const addButton = screen.getByLabelText(
      CANNOT_ADD_PREFERRED_ATTRIBUTION_TOOLTIP,
    );
    expect(addButton.attributes.getNamedItem('disabled')).toBeTruthy();
  });
});
