// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import {
  type Attributions,
  Criticality,
  DiscreteConfidence,
  type PackageInfo,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { ReportTableItem } from '../ReportTableItem';

describe('The ReportTableItem', () => {
  it('renders', async () => {
    const testAttributionsWithResources: Attributions = {
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
    };
    await renderComponent(
      <table>
        <tbody>
          <tr>
            <ReportTableItem
              packageInfo={testAttributionsWithResources['uuid1']}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('licenseName')).toBeInTheDocument();
    expect(screen.getByText('test copyright')).toBeInTheDocument();
    expect(screen.getByText('licenseText')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('test comment')).toBeInTheDocument();
    expect(screen.getByText('packageWebsite')).toBeInTheDocument();
  });

  it('renders icons correctly', async () => {
    const testAttributionsWithResources: Attributions = {
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
        needsReview: true,
        preferred: true,
        criticality: Criticality.None,
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: [],
        followUp: true,
        excludeFromNotice: true,
        criticality: Criticality.None,
        id: 'uuid2',
      },
    };
    await renderComponent(
      <table>
        <tbody>
          <tr>
            <ReportTableItem
              packageInfo={testAttributionsWithResources['uuid1']}
            />
            <ReportTableItem
              packageInfo={testAttributionsWithResources['uuid2']}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Exclude from notice icon'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Needs-review icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred icon')).toBeInTheDocument();
  });

  it('renders AI generated icon for non-deferred unmodified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: false,
    });

    expect(screen.getByLabelText('AI generated icon')).toBeInTheDocument();
    expect(screen.queryByLabelText('Deferred AI icon')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Human-modified AI icon'),
    ).not.toBeInTheDocument();
  });

  it('renders AI generated and human-modified icons for non-deferred human-modified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: false,
      humanModified: true,
    });

    expect(screen.getByLabelText('AI generated icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Human-modified AI icon')).toBeInTheDocument();
    expect(screen.queryByLabelText('Deferred AI icon')).not.toBeInTheDocument();
  });

  it('renders deferred icon for deferred unmodified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
    });

    expect(screen.getByLabelText('Deferred AI icon')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('AI generated icon'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Human-modified AI icon'),
    ).not.toBeInTheDocument();
  });

  it('renders deferred and human-modified icons for deferred human-modified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
      humanModified: true,
    });

    expect(screen.getByLabelText('Deferred AI icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Human-modified AI icon')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('AI generated icon'),
    ).not.toBeInTheDocument();
  });

  it('renders AI icons after the flag icons', async () => {
    const testAttribution: PackageInfo = {
      packageName: 'React',
      resources: ['/'],
      criticality: Criticality.None,
      id: 'uuid1',
      firstParty: true,
      aiStatus: { deferred: false },
    };
    await renderComponent(
      <table>
        <tbody>
          <tr>
            <ReportTableItem packageInfo={testAttribution} />
          </tr>
        </tbody>
      </table>,
    );

    const aiIcon = screen.getByLabelText('AI generated icon');
    const flagIcon = screen.getByLabelText('First party icon');

    expect(
      flagIcon.compareDocumentPosition(aiIcon) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders no AI icons for attribution without AI metadata', async () => {
    await renderReportTableItemWithAiStatus(undefined);

    expect(
      screen.queryByLabelText('AI generated icon'),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Deferred AI icon')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Human-modified AI icon'),
    ).not.toBeInTheDocument();
  });

  it('shows deferred icon tooltip on hover', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
    });

    fireEvent.mouseOver(screen.getByLabelText('Deferred AI icon'));

    expect(
      await screen.findByText(text.auditingOptions.deferredTooltip),
    ).toBeInTheDocument();
  });

  it.each([
    {
      name: 'needs-review',
      iconLabel: 'Needs-review icon',
      flags: { needsReview: true },
      tooltip: text.auditingOptions.needsReview,
    },
    {
      name: 'deferred AI',
      iconLabel: 'Deferred AI icon',
      flags: { aiStatus: { deferred: true } },
      tooltip: text.auditingOptions.deferredTooltip,
    },
  ])(
    'shows the $name tooltip when hovering the framed icon',
    async ({ flags, tooltip, iconLabel }) => {
      await renderComponent(
        <table>
          <tbody>
            <tr>
              <ReportTableItem
                packageInfo={{
                  id: 'uuid1',
                  criticality: Criticality.None,
                  ...flags,
                }}
              />
            </tr>
          </tbody>
        </table>,
      );

      // Padding and border belong to the SVG, so its tooltip covers the frame too.
      fireEvent.mouseOver(screen.getByLabelText(iconLabel));

      expect(await screen.findByRole('tooltip')).toHaveTextContent(tooltip);
      expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    },
  );
});

async function renderReportTableItemWithAiStatus(
  aiStatus: PackageInfo['aiStatus'],
) {
  const testAttribution: PackageInfo = {
    packageName: 'React',
    resources: ['/'],
    criticality: Criticality.None,
    id: 'uuid1',
    aiStatus,
  };
  await renderComponent(
    <table>
      <tbody>
        <tr>
          <ReportTableItem packageInfo={testAttribution} />
        </tr>
      </tbody>
    </table>,
  );
}
