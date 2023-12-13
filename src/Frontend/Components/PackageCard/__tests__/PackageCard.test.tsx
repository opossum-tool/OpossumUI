// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../shared/shared-types';
import { ButtonText, PopupType } from '../../../enums/enums';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setLocatePopupFilters } from '../../../state/actions/resource-actions/locate-popup-actions';
import { getMultiSelectSelectedAttributionIds } from '../../../state/selectors/attribution-view-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { clickOnButtonInPackageContextMenu } from '../../../test-helpers/context-menu-test-helpers';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { doNothing } from '../../../util/do-nothing';
import {
  CANNOT_ADD_PREFERRED_ATTRIBUTION_TOOLTIP,
  PackageCard,
} from '../PackageCard';

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

    const { store } = renderComponent(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
        }}
        onClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
    );
    expect(screen.getByText('packageName'));

    expect(
      store.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual(testAttributions[testAttributionId]);
    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.Confirm,
    );
    expect(
      store.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual({
      ...testAttributions[testAttributionId],
      preSelected: undefined,
    });
  });

  it('has working confirm globally button', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
      'package_2.tr.gz': [testAttributionId],
    };

    const { store } = renderComponent(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
        }}
        onClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText('packageName'));

    expect(
      store.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual(testAttributions[testAttributionId]);
    clickOnButtonInPackageContextMenu(
      screen,
      'packageName',
      ButtonText.ConfirmGlobally,
    );
    expect(
      store.getState().resourceState.allViews.manualData.attributions[
        testAttributionId
      ],
    ).toEqual({
      ...testAttributions[testAttributionId],
      preSelected: undefined,
    });
  });

  it('has working multi-select box in multi-select mode', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
      'package_2.tr.gz': [testAttributionId],
      'jQuery.js': [anotherAttributionId],
    };

    const { store } = renderComponent(
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
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
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

    const { store } = renderComponent(
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
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText('packageName'));

    (screen.getAllByRole('checkbox') as Array<Element>).forEach((checkbox) =>
      fireEvent.click(checkbox),
    );
    const attributions =
      store.getState().resourceState.allViews.manualData.attributions;
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
      store.getState().resourceState.allViews.manualData.attributions;
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

    const { store } = renderComponent(
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
      {
        actions: [
          setSelectedResourceId(selectedResourceId),
          setExternalData(
            testExternalAttributions,
            testExternalResourcesToAttributions,
          ),
          setManualData(
            testManualAttributions,
            testManualResourcesToAttributions,
          ),
        ],
      },
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'testPackage',
      ButtonText.OpenAttributionWizardPopup,
    );

    expect(getOpenPopup(store.getState())).toBe(
      PopupType.AttributionWizardPopup,
    );
  });

  it('add button for preferred attribution is disabled', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
    };

    renderComponent(
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
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
    );

    const addButton = screen.getByLabelText(
      CANNOT_ADD_PREFERRED_ATTRIBUTION_TOOLTIP,
    );
    expect(addButton.attributes.getNamedItem('disabled')).toBeTruthy();
  });

  it('highlights preferred attribution correctly', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
    };

    renderComponent(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
          preferred: true,
          wasPreferred: true,
        }}
        onClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
    );
    expect(screen.getByTestId('preferred-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('was-preferred-icon')).not.toBeInTheDocument();
  });

  it('highlights previously preferred attribution correctly', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
    };

    renderComponent(
      <PackageCard
        cardConfig={{ isExternalAttribution: false, isPreSelected: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          packageName: 'packageName',
          attributionIds: [testAttributionId],
          wasPreferred: true,
        }}
        onClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testAttributions,
              resourcesToManualAttributions: testResourcesToManualAttributions,
            }),
          ),
        ],
      },
    );
    expect(screen.getByTestId('was-preferred-icon')).toBeInTheDocument();
  });

  it('highlights located attributions correctly', () => {
    const locatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set(['MIT']),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };

    renderComponent(
      <PackageCard
        cardConfig={{ isExternalAttribution: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          attributionIds: [testAttributionId],
          licenseName: 'MIT',
        }}
        onClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              externalAttributions: testAttributions,
            }),
          ),
          setLocatePopupFilters(locatePopupFilters),
        ],
      },
    );
    expect(screen.getByLabelText('locate signals icon')).toBeInTheDocument();
  });
  it("doesn't highlight an attribution if filter doesn't match", () => {
    const locatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set(['MIT']),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };

    renderComponent(
      <PackageCard
        cardConfig={{ isExternalAttribution: true }}
        cardId={'some_id'}
        displayPackageInfo={{
          attributionIds: [testAttributionId],
          licenseName: 'Apache',
        }}
        onClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              externalAttributions: testAttributions,
            }),
          ),
          setLocatePopupFilters(locatePopupFilters),
        ],
      },
    );
    expect(
      screen.queryByLabelText('locate signals icon'),
    ).not.toBeInTheDocument();
  });
});
