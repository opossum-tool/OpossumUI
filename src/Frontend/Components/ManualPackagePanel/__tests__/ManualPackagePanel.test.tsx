// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ManualPackagePanel } from '../ManualPackagePanel';
import { getParsedInputFile } from '../../../test-helpers/test-helpers';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';

describe('The ManualPackagePanel', () => {
  test('shows default and input attributions', () => {
    const mockOnOverride = jest.fn();
    const { store } = renderComponentWithStore(
      <ManualPackagePanel
        showParentAttributions={false}
        overrideParentMode={false}
        showAddNewAttributionButton={true}
        onOverrideParentClick={mockOnOverride}
      />
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFile(
          { file: 1 },
          {
            uuid1: { packageName: 'React' },
            uuid2: { packageName: 'Angular' },
          },
          { '/file': ['uuid1'] }
        )
      )
    );
    store.dispatch(setSelectedResourceId('/file'));

    expect(screen.getByText('React'));
    expect(screen.getByText('Add new attribution'));
  });

  test('Shows hint and override button for parent attribution', () => {
    const mockOnOverride = jest.fn();
    renderComponentWithStore(
      <ManualPackagePanel
        showParentAttributions={true}
        overrideParentMode={false}
        showAddNewAttributionButton={true}
        onOverrideParentClick={mockOnOverride}
      />
    );
    const overrideButtonQuery = screen.queryAllByText('Override parent');
    expect(overrideButtonQuery).toHaveLength(1);

    const overrideButton = overrideButtonQuery[0];
    fireEvent.click(overrideButton);
    expect(mockOnOverride).toBeCalled();
  });
});
