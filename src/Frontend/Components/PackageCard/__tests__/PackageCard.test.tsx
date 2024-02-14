// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { noop } from 'lodash';

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { PackageCard } from '../PackageCard';

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
      [testAttributionId]: {
        packageName: 'pkg',
        preSelected: true,
        id: testAttributionId,
      },
      [anotherAttributionId]: {
        packageName: 'pkg2',
        preSelected: true,
        id: anotherAttributionId,
      },
    };
  });

  it('highlights preferred attribution correctly', () => {
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      'package_1.tr.gz': [testAttributionId],
    };

    renderComponent(
      <PackageCard
        packageInfo={{
          packageName: 'packageName',
          id: testAttributionId,
          preferred: true,
          wasPreferred: true,
        }}
        onClick={noop}
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
        packageInfo={{
          packageName: 'packageName',
          id: testAttributionId,
          wasPreferred: true,
        }}
        onClick={noop}
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
});
