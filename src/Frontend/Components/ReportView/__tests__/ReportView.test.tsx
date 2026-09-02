// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  type Attributions,
  Criticality,
  DiscreteConfidence,
} from '../../../../shared/shared-types';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import * as reportAttributionsList from '../../../util/use-report-attributions-list';
import { ReportView } from '../ReportView';

describe('ReportView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders', async () => {
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
        criticality: Criticality.None,
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: [],
        criticality: Criticality.None,
        id: 'uuid2',
      },
    };
    await renderComponent(<ReportView />, {
      data: getParsedInputFileEnrichedWithTestData({
        manualAttributions: attributions,
      }),
    });

    expect(await screen.findByText('Name')).toBeInTheDocument();
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

    expect(screen.getByText('Upstream Address')).toBeInTheDocument();
    expect(screen.getByText('packageWebsite')).toBeInTheDocument();

    expect(screen.getByText('Redux')).toBeInTheDocument();
    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
  });

  it('renders loaded rows when the total count includes unloaded rows', async () => {
    vi.spyOn(
      reportAttributionsList,
      'useReportAttributionsList',
    ).mockReturnValue({
      attributions: {
        uuid1: {
          packageName: 'React',
          resources: [],
          criticality: Criticality.None,
          id: 'uuid1',
        },
      },
      fetchNextPage: vi.fn(() => Promise.resolve()),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      loading: false,
      navigationAttributions: {},
      navigationLoading: false,
      navigationRelation: null,
      navigationResult: undefined,
      nextPageError: null,
      resultSetKey: 'result-set',
      totalCount: 2,
    });

    await renderComponent(<ReportView />);

    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
