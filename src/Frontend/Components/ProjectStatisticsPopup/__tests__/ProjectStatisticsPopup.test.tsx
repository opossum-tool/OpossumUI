// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Attributions } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { ProjectStatisticsPopupTitle } from '../../../enums/enums';
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
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
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

  it('renders pie charts when there are attributions', () => {
    const testManualAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
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
        id: 'uuid_3',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        id: 'uuid_2',
      },
    };

    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: testManualAttributions,
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });

    expect(
      screen.getByText(
        ProjectStatisticsPopupTitle.MostFrequentLicenseCountPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        ProjectStatisticsPopupTitle.IncompleteLicensesPieChart,
      ),
    ).toHaveLength(2);
  });

  it('does not render pie charts when there are no attributions', () => {
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
      screen.queryByText(
        ProjectStatisticsPopupTitle.MostFrequentLicenseCountPieChart,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(ProjectStatisticsPopupTitle.IncompleteLicensesPieChart),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        ProjectStatisticsPopupTitle.IncompleteLicensesPieChart,
      ),
    ).not.toHaveLength(2);
  });

  it('renders pie charts pie charts related to signals even if there are no attributions', () => {
    const testManualAttributions: Attributions = {};
    const testExternalAttributions: Attributions = {
      uuid_1: {
        source: {
          name: 'scancode',
          documentConfidence: 10,
        },
        licenseName: 'Apache License Version 2.0',
        id: 'uuid_1',
      },
      uuid_2: {
        source: {
          name: 'reuser',
          documentConfidence: 90,
        },
        licenseName: 'The MIT License (MIT)',
        id: 'uuid_2',
      },
    };
    renderComponent(<ProjectStatisticsPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: testManualAttributions,
            externalAttributions: testExternalAttributions,
          }),
        ),
      ],
    });
    expect(
      screen.getByText(
        ProjectStatisticsPopupTitle.MostFrequentLicenseCountPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(ProjectStatisticsPopupTitle.IncompleteLicensesPieChart),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        ProjectStatisticsPopupTitle.IncompleteLicensesPieChart,
      ),
    ).not.toHaveLength(2);
  });

  it('renders tables when there are no attributions', () => {
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
    expect(screen.getAllByText('License name')).toHaveLength(2);
    expect(screen.getAllByText('Total')).toHaveLength(3);
    expect(screen.getByText('Follow up')).toBeInTheDocument();
    expect(screen.getByText('First party')).toBeInTheDocument();
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
