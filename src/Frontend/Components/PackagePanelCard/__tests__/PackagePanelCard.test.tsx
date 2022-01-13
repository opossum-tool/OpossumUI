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
import {
  getButton,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
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

    expect(screen.getAllByLabelText('show resources'));
    expect(screen.getByLabelText('First party icon'));
    expect(
      screen.queryByLabelText('Exclude from notice icon')
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Follow-up icon')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Pre-selected icon')
    ).not.toBeInTheDocument();
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

    expect(screen.getAllByLabelText('show resources'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.getByLabelText('Exclude from notice icon'));
    expect(screen.getByLabelText('Follow-up icon'));
  });

  test('renders pre-selected icon and show resources icon', () => {
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

    expect(screen.getByLabelText('Pre-selected icon'));
    expect(screen.getAllByLabelText('show resources'));
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

    expect(screen.getAllByLabelText('show resources'));
    expect(
      screen.queryByLabelText('Resources for signal')
    ).not.toBeInTheDocument();

    fireEvent.click(getButton(screen, 'show resources'));
    expect(screen.getByText('Resources for selected attribution'));

    fireEvent.click(screen.getByText(ButtonText.Close));
    expect(
      screen.queryByLabelText('Resources for selected signal')
    ).not.toBeInTheDocument();
  });
});
