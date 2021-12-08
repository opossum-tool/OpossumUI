// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { FilterMultiSelect } from '../FilterMultiSelect';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  expectFilterIsShown,
  openDropDown,
} from '../../../test-helpers/general-test-helpers';
import { FilterType } from '../../../enums/enums';
import { Provider } from 'react-redux';
import { createAppStore } from '../../../state/configure-store';

describe('FilterMultiSelect', () => {
  test('renders the filters in a dropdown', () => {
    const store = createAppStore();
    render(
      <Provider store={store}>
        <FilterMultiSelect />
      </Provider>
    );
    openDropDown(screen);
    expectFilterIsShown(screen, FilterType.OnlyFirstParty);
    expectFilterIsShown(screen, FilterType.OnlyFollowUp);
    expectFilterIsShown(screen, FilterType.HideFirstParty);
  });
});
