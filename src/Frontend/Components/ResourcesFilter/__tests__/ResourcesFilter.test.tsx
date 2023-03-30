// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  expectFilterIsShown,
  openDropDown,
} from '../../../test-helpers/general-test-helpers';
import { ResourcesFilterType } from '../../../enums/enums';
import { Provider } from 'react-redux';
import { createAppStore } from '../../../state/configure-store';
import { ResourcesFilter } from '../ResourcesFilter';
import { doNothing } from '../../../util/do-nothing';

describe('ResourcesFilter', () => {
  it('renders the filters in a dropdown', () => {
    const store = createAppStore();
    render(
      <Provider store={store}>
        <ResourcesFilter activeFilters={[]} updateFilters={doNothing} />
      </Provider>
    );
    openDropDown(screen);
    expectFilterIsShown(screen, ResourcesFilterType.HideAttributed);
  });
});
