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

  it('renders AI status badges for non-deferred unmodified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: false,
    });

    expect(
      screen.getByText(text.auditingOptions.aiGenerated),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.deferred),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.humanModified),
    ).not.toBeInTheDocument();
  });

  it('renders AI status badges for non-deferred human-modified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: false,
      humanModified: true,
    });

    expect(
      screen.getByText(text.auditingOptions.aiGenerated),
    ).toBeInTheDocument();
    expect(
      screen.getByText(text.auditingOptions.humanModified),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.deferred),
    ).not.toBeInTheDocument();
  });

  it('renders AI status badges for deferred unmodified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
    });

    expect(screen.getByText(text.auditingOptions.deferred)).toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.aiGenerated),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.humanModified),
    ).not.toBeInTheDocument();
  });

  it('renders AI status badges for deferred human-modified AI attribution', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
      humanModified: true,
    });

    expect(screen.getByText(text.auditingOptions.deferred)).toBeInTheDocument();
    expect(
      screen.getByText(text.auditingOptions.humanModified),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.aiGenerated),
    ).not.toBeInTheDocument();
  });

  it('renders no AI status badges for attribution without AI metadata', async () => {
    await renderReportTableItemWithAiStatus(undefined);

    expect(
      screen.queryByText(text.auditingOptions.aiGenerated),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.deferred),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.auditingOptions.humanModified),
    ).not.toBeInTheDocument();
  });

  it('shows AI status badge tooltip on hover', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
    });

    fireEvent.mouseOver(screen.getByText(text.auditingOptions.deferred));

    expect(
      await screen.findByText(text.auditingOptions.deferredTooltip),
    ).toBeInTheDocument();
  });

  it('renders AI status badge icons', async () => {
    await renderReportTableItemWithAiStatus({
      deferred: true,
      humanModified: true,
    });

    expect(screen.getByLabelText('Deferred AI icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Human-modified AI icon')).toBeInTheDocument();
  });
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
