// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { Resources } from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { FileSearchPopup } from '../FileSearchPopup';

describe('FileSearch popup', () => {
  const testResources: Resources = {
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
      'test.js': 1,
    },
    eagleBlu: {
      src: {
        'test.js': 1,
      },
      'readme.md': 1,
    },
  };

  const debounceWaitTimeInMs = 200;

  jest.useFakeTimers();

  it('renders', () => {
    renderComponent(<FileSearchPopup />);
    expect(
      screen.getByText('Search for Files and Directories', { exact: false }),
    ).toBeInTheDocument();
  });

  it.each([
    ['eagleBlu', 4],
    ['test.js', 2],
    ['non-existing-file', 0],
    ['eagleblu', 4],
  ])(
    'search for %s results in %s results',
    (search: string, expected_results: number) => {
      renderComponent(<FileSearchPopup />, {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
            }),
          ),
        ],
      });

      act(() => {
        jest.advanceTimersByTime(debounceWaitTimeInMs);
      });

      expect(screen.queryAllByText('/', { exact: false })).toHaveLength(9);

      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: search },
      });

      act(() => {
        jest.advanceTimersByTime(debounceWaitTimeInMs);
      });

      expect(screen.queryAllByText(search, { exact: false })).toHaveLength(
        expected_results,
      );
      expect(screen.queryAllByText('/', { exact: false })).toHaveLength(
        expected_results,
      );
    },
  );

  it('has debounced search', () => {
    const smallWaitTimeInMs = 50;

    renderComponent(<FileSearchPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({ resources: testResources }),
        ),
      ],
    });

    act(() => {
      jest.advanceTimersByTime(debounceWaitTimeInMs);
    });

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '31231' },
    });

    jest.advanceTimersByTime(smallWaitTimeInMs);

    expect(screen.queryAllByText('/', { exact: false })).toHaveLength(9);

    act(() => {
      jest.advanceTimersByTime(debounceWaitTimeInMs - smallWaitTimeInMs);
    });

    expect(screen.queryByText('/', { exact: false })).not.toBeInTheDocument();
  });
});
