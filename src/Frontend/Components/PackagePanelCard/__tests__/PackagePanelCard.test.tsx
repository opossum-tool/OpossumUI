// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
import { PackagePanelCard } from '../PackagePanelCard';
import { setManualData } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { ListCardConfig, ListCardContent } from '../../../types/types';

const testCardContent: ListCardContent = { name: 'Test' };
const testcardConfig: ListCardConfig = { firstParty: true };

describe('The PackagePanelCard', () => {
  test('renders', () => {
    const { getByText } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testcardConfig}
      />
    );

    expect(getByText('Test'));
  });
  test('renders firstParty Icon and show resources Icon', () => {
    const { getByLabelText } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testcardConfig}
      />
    );

    expect(getByLabelText('First party icon'));
    expect(getByLabelText('show resources'));
  });

  test('has working resources Icon', () => {
    const manualAttributions: Attributions = {
      uuid_1: { packageName: 'Test package' },
    };
    const resourcesToAttributions: ResourcesToAttributions = {
      '/thirdParty': ['uuid_1'],
    };

    const { store } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'uuid_1'}
        cardConfig={testcardConfig}
      />
    );
    store.dispatch(setManualData(manualAttributions, resourcesToAttributions));

    expect(screen.getByLabelText('show resources'));
    expect(screen.queryByLabelText('Resources for signal')).toBeNull();

    fireEvent.click(screen.getByLabelText('show resources'));
    expect(screen.getByText('Resources for selected attribution'));

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByLabelText('Resources for selected signal')).toBeNull();
  });
});
