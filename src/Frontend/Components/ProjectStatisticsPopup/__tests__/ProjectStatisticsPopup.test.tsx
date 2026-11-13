// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  type Attributions,
  Criticality,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import {
  clickProjectStatisticsTab,
  expectStatisticsCharts,
  expectTextVisible,
} from '../../../../testing/ui';
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
  uuid_4: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    licenseName: 'The MIT License (MIT)',
    criticality: Criticality.None,
    id: 'uuid_4',
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

    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData({
        config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
        externalAttributions: testExternalAttributions,
      }),
    });

    await userEvent.click(await screen.findByText('Licenses'));

    await expectTextVisible('Apache License Version 2.0', true);
    await expectTextVisible('The MIT License (MIT)', true);
    await expectTextVisible('Scancode', true);
    await expectTextVisible('Reuser', true);
  });

  it('renders expected pie charts when there are signals and attributions', async () => {
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData(fileSetup),
    });

    await expectStatisticsCharts([
      'mostFrequentLicenseCountPieChart',
      'criticalSignalsCountPieChart',
      'signalCountByClassificationPieChart',
      'incompleteAttributionsPieChart',
    ]);
  });

  it('does not render pie charts when there are no signals and no attributions', async () => {
    const testExternalAttributions: Attributions = {};
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData({
        config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
        externalAttributions: testExternalAttributions,
      }),
    });
    await expectTextVisible(
      text.projectStatisticsPopup.charts.attributionProperties.title,
      true,
    );
    await expectStatisticsCharts(
      [],
      [
        'mostFrequentLicenseCountPieChart',
        'criticalSignalsCountPieChart',
        'signalCountByClassificationPieChart',
        'incompleteAttributionsPieChart',
      ],
    );
  });

  it('renders expected pie charts related to signals even if there are no attributions', async () => {
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
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData({
        config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
        manualAttributions: testManualAttributions,
        externalAttributions: testExternalAttributions,
      }),
    });
    await expectStatisticsCharts([
      'mostFrequentLicenseCountPieChart',
      'criticalSignalsCountPieChart',
      'signalCountByClassificationPieChart',
    ]);
  });

  it('renders attribution bar chart and signals per sources table even when there are no attributions and no signals', async () => {
    const testExternalAttributions: Attributions = {};
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData({
        externalAttributions: testExternalAttributions,
      }),
    });

    await expectTextVisible(
      text.projectStatisticsPopup.charts.attributionProperties.title,
      true,
    );

    await clickProjectStatisticsTab('details');

    await expectTextVisible(
      text.attributionCountPerSourcePerLicenseTable.columns.licenseInfo,
      true,
    );
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
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData({
        config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
        externalAttributions: testExternalAttributions,
      }),
    });

    await userEvent.click(await screen.findByText('Licenses'));

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

  it('does not show the classification statistics if it has been disabled', async () => {
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData(fileSetup),
      actions: [setUserSetting({ showClassifications: false })],
    });

    await expectTextVisible(
      text.projectStatisticsPopup.charts.attributionProperties.title,
      true,
    );
    await expectStatisticsCharts([], ['signalCountByClassificationPieChart']);
  });

  it('does not show the criticality statistics if it has been disabled', async () => {
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData(fileSetup),
      actions: [setUserSetting({ showCriticality: false })],
    });

    await expectTextVisible(
      text.projectStatisticsPopup.charts.attributionProperties.title,
      true,
    );
    await expectStatisticsCharts([], ['criticalSignalsCountPieChart']);
  });

  it('allows toggling of show-on-startup checkbox', async () => {
    await renderComponent(<ProjectStatisticsPopup />, {
      data: getParsedInputFileEnrichedWithTestData({}),
      actions: [setUserSetting({ showProjectStatistics: true })],
    });

    expect(
      await screen.findByLabelText(
        text.projectStatisticsPopup.toggleStartupCheckbox,
      ),
    ).toBeChecked();

    await userEvent.click(
      screen.getByLabelText(text.projectStatisticsPopup.toggleStartupCheckbox),
    );

    expect(
      screen.getByLabelText(text.projectStatisticsPopup.toggleStartupCheckbox),
    ).not.toBeChecked();
  });
});
