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
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardConfig}
      />
    );

    expect(screen.getByText('Test'));
  });

  test('renders only first party icon and show resources icon', () => {
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardConfig}
      />
    );

    expect(screen.getByLabelText('show resources'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.queryByLabelText('Exclude from notice icon')).toBeFalsy();
    expect(screen.queryByLabelText('Follow-up icon')).toBeFalsy();
    expect(screen.queryByLabelText('Pre-selected icon')).toBeFalsy();
  });

  test('renders many icons at once', () => {
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardWithManyIconsConfig}
      />
    );

    expect(screen.getByLabelText('show resources'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.getByLabelText('Exclude from notice icon'));
    expect(screen.getByLabelText('Follow-up icon'));
  });

  test('renders pre-selected icon', () => {
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'/'}
        cardConfig={testCardWithPreSelectedConfig}
      />
    );

    expect(screen.getByLabelText('show resources'));
    expect(screen.getByLabelText('Pre-selected icon'));
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
