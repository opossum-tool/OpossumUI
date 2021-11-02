// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
import { PackagePanelCard } from '../PackagePanelCard';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { ListCardConfig, ListCardContent } from '../../../types/types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/test-helpers';
import { ButtonText } from '../../../enums/enums';

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
  const testManualAttributions: Attributions = {
    uuid1: {
      packageName: 'React',
      packageVersion: '16.5.0',
    },
  };

  test('renders content', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'uuid1'}
        cardConfig={testCardConfig}
      />,
      { store: testStore }
    );

    expect(screen.getByText('Test'));
  });

  test('renders only first party icon and show resources icon', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'uuid1'}
        cardConfig={testCardConfig}
      />,
      { store: testStore }
    );

    expect(screen.getByLabelText('show resources'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.queryByLabelText('Exclude from notice icon')).toBeFalsy();
    expect(screen.queryByLabelText('Follow-up icon')).toBeFalsy();
    expect(screen.queryByLabelText('Pre-selected icon')).toBeFalsy();
  });

  test('renders many icons at once', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'uuid1'}
        cardConfig={testCardWithManyIconsConfig}
      />,
      { store: testStore }
    );

    expect(screen.getByLabelText('show resources'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.getByLabelText('Exclude from notice icon'));
    expect(screen.getByLabelText('Follow-up icon'));
  });

  test('renders pre-selected icon', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'uuid1'}
        cardConfig={testCardWithPreSelectedConfig}
      />,
      { store: testStore }
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
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions,
          resourcesToManualAttributions: resourcesToAttributions,
        })
      )
    );
    renderComponentWithStore(
      <PackagePanelCard
        onClick={doNothing}
        cardContent={testCardContent}
        attributionId={'uuid_1'}
        cardConfig={testCardConfig}
      />,
      { store: testStore }
    );

    expect(screen.getByLabelText('show resources'));
    expect(screen.queryByLabelText('Resources for signal')).toBeNull();

    fireEvent.click(screen.getByLabelText('show resources'));
    expect(screen.getByText('Resources for selected attribution'));

    fireEvent.click(screen.getByText(ButtonText.Close));
    expect(screen.queryByLabelText('Resources for selected signal')).toBeNull();
  });
});
