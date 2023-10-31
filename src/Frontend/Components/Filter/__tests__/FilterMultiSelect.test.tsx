// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { FilterType } from '../../../enums/enums';
import { createAppStore } from '../../../state/configure-store';
import {
  expectFilterIsShown,
  openDropDown,
} from '../../../test-helpers/general-test-helpers';
import { FilterMultiSelect } from '../FilterMultiSelect';

describe('FilterMultiSelect', () => {
  it('renders the filters in a dropdown', () => {
    const store = createAppStore();
    render(
      <Provider store={store}>
        <FilterMultiSelect />
      </Provider>,
    );
    openDropDown(screen);
    expectFilterIsShown(screen, FilterType.OnlyFirstParty);
    expectFilterIsShown(screen, FilterType.OnlyFollowUp);
    expectFilterIsShown(screen, FilterType.HideFirstParty);
  });
});
