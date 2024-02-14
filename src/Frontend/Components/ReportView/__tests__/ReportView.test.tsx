// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import {
  FILTERED_ATTRIBUTIONS_REPORT,
  FilteredData,
} from '../../../state/variables/use-filtered-data';
import { renderComponent } from '../../../test-helpers/render';
import { ReportView } from '../ReportView';

describe('ReportView', () => {
  it('renders', () => {
    const attributions: Attributions = {
      uuid1: {
        packageName: 'React',
        packageVersion: '1.0',
        copyright: 'test copyright',
        licenseName: 'licenseName',
        licenseText: 'licenseText',
        attributionConfidence: DiscreteConfidence.Low,
        comment: 'test comment',
        url: 'packageWebsite',
        firstParty: true,
        resources: ['/'],
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: [],
        id: 'uuid2',
      },
    };
    renderComponent(<ReportView />, {
      actions: [
        setVariable<FilteredData>(FILTERED_ATTRIBUTIONS_REPORT, {
          attributions,
          counts: {},
          filters: [],
          loading: false,
          search: '',
          selectedLicense: '',
          sorting: text.sortings.name,
        }),
      ],
    });

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();

    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();

    expect(screen.getAllByText('Name')).toHaveLength(1);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('licenseName')).toBeInTheDocument();

    expect(screen.getByText('Copyright')).toBeInTheDocument();
    expect(screen.getByText('test copyright')).toBeInTheDocument();

    expect(screen.getByText('License Text')).toBeInTheDocument();
    expect(screen.getByText('licenseText')).toBeInTheDocument();

    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('Comment')).toBeInTheDocument();
    expect(screen.getByText('test comment')).toBeInTheDocument();

    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('packageWebsite')).toBeInTheDocument();

    expect(screen.getByText('Redux')).toBeInTheDocument();
    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
  });
});
