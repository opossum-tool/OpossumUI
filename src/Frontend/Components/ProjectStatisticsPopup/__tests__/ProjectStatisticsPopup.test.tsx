// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Attributions, Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup';

describe('The ProjectStatisticsPopup', () => {
  it('displays license names and source names', () => {
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
        criticality: Criticality.None,
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        criticality: Criticality.None,
        id: 'uuid_2',
      },
    };

    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });
    expect(screen.getByText('Apache License Version 2.0')).toBeInTheDocument();
    expect(screen.getByText('The MIT License (MIT)')).toBeInTheDocument();
    expect(screen.getByText('Scancode')).toBeInTheDocument();
    expect(screen.getByText('Reuser')).toBeInTheDocument();
  });

  it('renders all pie charts when there are signals and attributions', () => {
    const testManualAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
        criticality: Criticality.None,
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        criticality: Criticality.None,
        id: 'uuid_2',
      },
    };
    const testExternalAttributions: Attributions = {
      uuid_3: {
        source: {
          name: 'scancode',
          documentConfidence: 90,
        },
        licenseName: 'Apache License Version 3.0',
        criticality: Criticality.None,
        id: 'uuid_3',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        criticality: Criticality.None,
        id: 'uuid_2',
      },
    };

    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
            manualAttributions: testManualAttributions,
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });

    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.incompleteAttributionsPieChart.title,
      ),
    ).toBeInTheDocument();
  });

  it('does not render pie charts when there are no signals and no attributions', () => {
    const testExternalAttributions: Attributions = {};
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });
    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        ProjectStatisticsPopupTitle.SignalCountByClassificationPieChart,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.incompleteAttributionsPieChart.title,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders pie charts related to signals even if there are no attributions', () => {
    const testManualAttributions: Attributions = {};
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
        criticality: Criticality.None,
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        criticality: Criticality.None,
        id: 'uuid_2',
      },
    };
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
            manualAttributions: testManualAttributions,
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        ProjectStatisticsPopupTitle.SignalCountByClassificationPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      ),
    ).toBeInTheDocument();
  });

  it('renders attribution bar chart and signals per sources table even when there are no attributions and no signals', async () => {
    const testExternalAttributions: Attributions = {};
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });

    expect(screen.getByText('Attributions Overview')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Details'));

    expect(screen.getByText('Signals per Sources')).toBeInTheDocument();
  });

  it('supports sorting the signals per sources table', async () => {
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
        criticality: Criticality.None,
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        criticality: Criticality.None,
        id: 'uuid_2',
      },
    };
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });

    const getLicenseNames = () =>
      screen
        .getAllByTestId('signalsPerSourceBodyCell0')
        .map((element) => element.textContent);

    // sorted by license name ASC
    expect(getLicenseNames()).toStrictEqual([
      'Apache License Version 2.0',
      'The MIT License (MIT)',
    ]);

    await userEvent.click(screen.getByText('Scancode'));

    // sorted by count on scancode source ASC
    expect(getLicenseNames()).toStrictEqual([
      'The MIT License (MIT)',
      'Apache License Version 2.0',
    ]);

    await userEvent.click(screen.getByText('Scancode'));

    // sorted by count on scancode source DESC
    expect(getLicenseNames()).toStrictEqual([
      'Apache License Version 2.0',
      'The MIT License (MIT)',
    ]);
  });

  it('allows toggling of show-on-startup checkbox', async () => {
    renderComponent(<ProjectStatisticsPopup />);

    expect(
      screen.getByLabelText(text.projectStatisticsPopup.toggleStartupCheckbox),
    ).toBeChecked();

    await userEvent.click(
      screen.getByLabelText(text.projectStatisticsPopup.toggleStartupCheckbox),
    );

    expect(
      screen.getByLabelText(text.projectStatisticsPopup.toggleStartupCheckbox),
    ).not.toBeChecked();
  });
});
