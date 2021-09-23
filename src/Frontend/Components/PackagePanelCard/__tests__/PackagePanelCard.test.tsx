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

const testCardContent: ListCardContent = { id: '1', name: 'Test' };
const testCardConfig: ListCardConfig = { firstParty: true };
const testCardWithManyIconsConfig: ListCardConfig = {
  firstParty: true,
  followUp: true,
  excludeFromNotice: true,
};
const testCardWithPreSelectedConfig: ListCardConfig = {
  isPreSelected: true,
};

describe('The PackagePanelCard', () => {
  test('renders content', () => {
    const { getByText } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardConfig}
      />
    );

    expect(getByText('Test'));
  });

  test('renders only first party icon and show resources icon', () => {
    const { getByLabelText, queryByLabelText } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardConfig}
      />
    );

    expect(getByLabelText('show resources'));
    expect(getByLabelText('First party icon'));
    expect(queryByLabelText('Exclude from notice icon')).toBeFalsy();
    expect(queryByLabelText('Follow-up icon')).toBeFalsy();
    expect(queryByLabelText('Pre-selected icon')).toBeFalsy();
  });

  test('renders many icons at once', () => {
    const { getByLabelText } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardWithManyIconsConfig}
      />
    );

    expect(getByLabelText('show resources'));
    expect(getByLabelText('First party icon'));
    expect(getByLabelText('Exclude from notice icon'));
    expect(getByLabelText('Follow-up icon'));
  });

  test('renders pre-selected icon', () => {
    const { getByLabelText } = renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardWithPreSelectedConfig}
      />
    );

    expect(getByLabelText('show resources'));
    expect(getByLabelText('Pre-selected icon'));
  });

  test('has working resources icon', () => {
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
        cardConfig={testCardConfig}
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
