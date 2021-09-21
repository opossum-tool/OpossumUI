// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
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
import { useDispatch } from 'react-redux';

interface HelperComponentProps {
  isExternalAttribution: boolean;
}

function HelperComponent(props: HelperComponentProps): ReactElement {
  const dispatch = useDispatch();
  const attributions: Attributions = {
    uuid_1: { packageName: 'Test package' },
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/thirdParty': ['uuid_1'],
  };
  const resourcesToExternalAttributions: ResourcesToAttributions = {
    '/firstParty': ['uuid_1'],
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
  test('renders resources for manual Attributions', () => {
    const { queryByText } = renderComponentWithStore(
      <HelperComponent isExternalAttribution={false} />
    );

    expect(queryByText('Resources for selected attribution')).toBeTruthy();
    expect(queryByText('/thirdParty')).toBeTruthy();
  });

  test('renders resources for external Attributions', () => {
    const { queryByText } = renderComponentWithStore(
      <HelperComponent isExternalAttribution={true} />
    );

    expect(queryByText('Resources for selected signal')).toBeTruthy();
    expect(queryByText('/firstParty')).toBeTruthy();
  });
});
