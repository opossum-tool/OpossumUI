// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import React from 'react';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup';
import { Attributions } from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';

describe('The ProjectStatisticsPopup', () => {
  test('counts sources correctly ', () => {
    const store = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
      },
    };

    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        })
      )
    );

    renderComponentWithStore(<ProjectStatisticsPopup />, { store });
  });
});
