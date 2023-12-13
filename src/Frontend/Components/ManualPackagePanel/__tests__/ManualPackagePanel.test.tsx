// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { Attributions, Resources } from '../../../../shared/shared-types';
import { ADD_NEW_ATTRIBUTION_BUTTON_TEXT } from '../../../shared-constants';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ManualPackagePanel } from '../ManualPackagePanel';

describe('The ManualPackagePanel', () => {
  it('shows default and input attributions', () => {
    const mockOnOverride = jest.fn();
    const { store } = renderComponent(
      <ManualPackagePanel
        showParentAttributions={false}
        overrideParentMode={false}
        showAddNewAttributionButton={true}
        onOverrideParentClick={mockOnOverride}
      />,
    );
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: { file: 1 },
            manualAttributions: {
              uuid1: { packageName: 'React' },
              uuid2: { packageName: 'Angular' },
            },
            resourcesToManualAttributions: { '/file': ['uuid1'] },
          }),
        ),
      );
      store.dispatch(setSelectedResourceId('/file'));
    });

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(
      screen.getByText(ADD_NEW_ATTRIBUTION_BUTTON_TEXT),
    ).toBeInTheDocument();
  });

  it('Shows hint and override button for parent attribution', () => {
    const mockOnOverride = jest.fn();
    renderComponent(
      <ManualPackagePanel
        showParentAttributions={true}
        overrideParentMode={false}
        showAddNewAttributionButton={true}
        onOverrideParentClick={mockOnOverride}
      />,
    );
    const overrideButton = screen.queryByText('Override parent');
    expect(overrideButton).toBeInTheDocument();

    fireEvent.click(overrideButton as Element);
    expect(mockOnOverride).toHaveBeenCalled();
  });

  it('sorts displayAttributionsWithCount', () => {
    const testResources: Resources = { file: 1 };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'zz Test package',
      },
      uuid_2: {
        attributionConfidence: 0,
        comment: 'Some comment',
        packageName: 'Test package',
        packageVersion: '1.0',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
      },
      uuid_3: {
        copyright: '(C) Copyright John Doe 2',
      },
    };
    const testResourcesToManualAttributions = {
      '/file': ['uuid_1', 'uuid_2', 'uuid_3'],
    };

    const mockOnOverride = jest.fn();
    const { store } = renderComponent(
      <ManualPackagePanel
        showParentAttributions={false}
        overrideParentMode={false}
        showAddNewAttributionButton={true}
        onOverrideParentClick={mockOnOverride}
      />,
    );
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          }),
        ),
      );
      store.dispatch(setSelectedResourceId('/file'));
    });

    const nodePackage1 = screen.getByText(/zz Test package/);
    const nodePackage2 = screen.getByText(/Test package, 1\.0/);
    const nodePackage3 = screen.getByText(/\(C\) Copyright John Doe 2/);

    expect(nodePackage3.compareDocumentPosition(nodePackage1)).toBe(2);
    expect(nodePackage3.compareDocumentPosition(nodePackage2)).toBe(2);
    expect(nodePackage1.compareDocumentPosition(nodePackage2)).toBe(2);
  });
});
