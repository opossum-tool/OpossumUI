// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { ReactElement } from 'react';

import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../../state/hooks';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
import { ResourcePathPopup } from '../ResourcePathPopup';

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
      closePopup={doNothing}
      attributionIds={['uuid_1']}
      isExternalAttribution={props.isExternalAttribution}
    />
  );
}

describe('ResourcePathPopup', () => {
  it('renders resources for manual Attributions', () => {
    renderComponentWithStore(<HelperComponent isExternalAttribution={false} />);

    expect(
      screen.getByText('Resources for selected attribution'),
    ).toBeInTheDocument();
    expect(screen.getByText('thirdParty')).toBeInTheDocument();
  });

  it('renders resources for external Attributions', () => {
    renderComponentWithStore(<HelperComponent isExternalAttribution={true} />);

    expect(
      screen.getByText('Resources for selected signal'),
    ).toBeInTheDocument();
    expect(screen.getByText('firstParty')).toBeInTheDocument();
  });
});
