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
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setLocatePopupFilters } from '../../../state/actions/resource-actions/locate-popup-actions';
import { getMultiSelectSelectedAttributionIds } from '../../../state/selectors/attribution-view-resource-selectors';
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

    expect(screen.getByText('packageName')).toBeInTheDocument();
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
