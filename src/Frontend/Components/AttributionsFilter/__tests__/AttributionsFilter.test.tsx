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
import { AttributionsFilterType } from '../../../enums/enums';
import { Provider } from 'react-redux';
import { createAppStore } from '../../../state/configure-store';
import { AttributionsFilter } from '../AttributionsFilter';

describe('AttributionsFilter', () => {
  it('renders the filters in a dropdown', () => {
    const store = createAppStore();
    render(
      <Provider store={store}>
        <AttributionsFilter />
      </Provider>
    );
    openDropDown(screen);
    expectFilterIsShown(screen, AttributionsFilterType.OnlyFirstParty);
    expectFilterIsShown(screen, AttributionsFilterType.OnlyFollowUp);
    expectFilterIsShown(screen, AttributionsFilterType.HideFirstParty);
    expectFilterIsShown(screen, AttributionsFilterType.OnlyNeedsReview);
  });
});
