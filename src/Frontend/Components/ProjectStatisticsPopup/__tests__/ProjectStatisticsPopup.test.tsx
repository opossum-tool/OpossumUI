// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Attributions, Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ProjectStatisticsPopup } from '../ProjectStatisticsPopup';

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

const fileSetup = {
  config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
  manualAttributions: testManualAttributions,
  externalAttributions: testExternalAttributions,
};

describe('The ProjectStatisticsPopup', () => {
  it('displays license names and source names', async () => {
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

    await userEvent.click(screen.getByText('Licenses'));

    expect(screen.getByText('Apache License Version 2.0')).toBeVisible();
    expect(screen.getByText('The MIT License (MIT)')).toBeVisible();
    expect(screen.getByText('Scancode')).toBeVisible();
    expect(screen.getByText('Reuser')).toBeVisible();
  });

  it('renders expected pie charts when there are signals and attributions', () => {
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(getParsedInputFileEnrichedWithTestData(fileSetup)),
      ],
    });

    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.incompleteAttributionsPieChart.title,
      ),
    ).toBeVisible();
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

  it('renders expected pie charts related to signals even if there are no attributions', () => {
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
    ).toBeVisible();
    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      ),
    ).not.toBeInTheDocument();
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

    expect(
      screen.getByText(
        text.projectStatisticsPopup.charts.attributionProperties.title,
      ),
    ).toBeVisible();

    await userEvent.click(
      screen.getByText(text.projectStatisticsPopup.tabs.details),
    );

    expect(
      screen.getByText(
        text.attributionCountPerSourcePerLicenseTable.columns.licenseInfo,
      ),
    ).toBeVisible();
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

    await userEvent.click(screen.getByText('Licenses'));

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

    // sorted by count on scancode source DESC
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
  });

  it('does not show the classification statistics if it has been disabled', () => {
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        setUserSetting({ showClassifications: false }),
        loadFromFile(getParsedInputFileEnrichedWithTestData(fileSetup)),
      ],
    });

    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      ),
    ).not.toBeInTheDocument();
  });

  it('does not show the criticality statistics if it has been disabled', () => {
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        setUserSetting({ showCriticality: false }),
        loadFromFile(getParsedInputFileEnrichedWithTestData(fileSetup)),
      ],
    });

    expect(
      screen.queryByText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      ),
    ).not.toBeInTheDocument();
  });

  it('allows toggling of show-on-startup checkbox', async () => {
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [setUserSetting({ showProjectStatistics: true })],
    });

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
