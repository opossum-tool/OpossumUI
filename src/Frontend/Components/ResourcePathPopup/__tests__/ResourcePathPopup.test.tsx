// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
import { ResourcePathPopup } from '../ResourcePathPopup';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { screen } from '@testing-library/react';
import { useAppDispatch } from '../../../state/hooks';
import '@testing-library/jest-dom/extend-expect';

interface HelperComponentProps {
  isExternalAttribution: boolean;
}

function HelperComponent(props: HelperComponentProps): ReactElement {
  const dispatch = useAppDispatch();
  const attributions: Attributions = {
    uuid_1: { packageName: 'Test package' },
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/thirdParty': ['uuid_1'],
  };
  const resourcesToExternalAttributions: ResourcesToAttributions = {
    '/firstParty': ['uuid_1'],
    '/folder/anotherFirstParty': ['uuid_1'],
  };

  dispatch(setExternalData(attributions, resourcesToExternalAttributions));
  dispatch(setManualData(attributions, resourcesToManualAttributions));
  return (
    <ResourcePathPopup
      isOpen={true}
      closePopup={doNothing}
      attributionId={'uuid_1'}
      isExternalAttribution={props.isExternalAttribution}
      displayedAttributionName={'test name'}
    />
  );
}

describe('ResourcePathPopup', () => {
  const resourcesInOtherFoldersHeader = 'Resources in Other Folders';

  test('renders resources for manual Attributions', () => {
    renderComponentWithStore(<HelperComponent isExternalAttribution={false} />);

    expect(
      screen.getByText('Resources for selected attribution')
    ).toBeInTheDocument();
    expect(screen.getByText('/thirdParty')).toBeInTheDocument();
  });

  test('renders resources for external Attributions', () => {
    renderComponentWithStore(<HelperComponent isExternalAttribution={true} />);

    expect(
      screen.getByText('Resources for selected signal')
    ).toBeInTheDocument();
    expect(screen.getByText('/firstParty')).toBeInTheDocument();
  });

  test('renders subheader, if resources in other folders exist', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('/folder/anotherFirstParty'));
    renderComponentWithStore(<HelperComponent isExternalAttribution={true} />, {
      store: testStore,
    });

    expect(screen.getByText(resourcesInOtherFoldersHeader)).toBeInTheDocument();
    expect(screen.getByText('/firstParty')).toBeInTheDocument();
    expect(screen.getByText('/folder/anotherFirstParty')).toBeInTheDocument();
  });

  test('renders no subheader, if no resources in other folders exist', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('/thirdParty'));
    renderComponentWithStore(
      <HelperComponent isExternalAttribution={false} />,
      { store: testStore }
    );
    expect(
      screen.queryByText(resourcesInOtherFoldersHeader)
    ).not.toBeInTheDocument();
    expect(screen.getByText('/thirdParty')).toBeInTheDocument();
  });
});
