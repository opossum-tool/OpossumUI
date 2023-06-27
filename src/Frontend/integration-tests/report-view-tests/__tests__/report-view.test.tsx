// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  clickOnEditIconForElement,
  clickOnOpenFileIcon,
  closeProjectStatisticsPopup,
  EMPTY_PARSED_FILE_CONTENT,
  goToView,
  mockElectronBackend,
} from '../../../test-helpers/general-test-helpers';
import { ButtonText, View } from '../../../enums/enums';
import {
  DiscreteConfidence,
  ParsedFileContent,
} from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  expectValueInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
} from '../../../test-helpers/resource-browser-test-helpers';

describe('The report view', () => {
  it('opens a EditAttributionPopup by clicking on edit and saves changes', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        directory_manual: { subdirectory_manual: { file_manual: 1 } },
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            attributionConfidence: DiscreteConfidence.High,
            packageName: 'jQuery',
            licenseText: 'MIT',
          },
        },
        resourcesToAttributions: {
          '/directory_manual/subdirectory_manual/': ['uuid_1'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Report);
    expectResourceBrowserIsNotShown(screen);

    screen.getByText('Name');
    screen.getByText('License');
    screen.getByText('License Text');
    screen.getByText('Resources');
    expect(screen.getAllByText('Name').length).toBe(1);

    screen.getByText('jQuery');
    screen.getByText('MIT');
    screen.getByText('/directory_manual/subdirectory_manual/');
    screen.getByText(`${DiscreteConfidence.High}`);

    clickOnEditIconForElement(screen, 'jQuery');
    expect(screen.getByText('Edit Attribution'));
    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'MIT',
    );
    insertValueIntoTextBox(screen, 'Comment', 'Test comment');
    clickOnButton(screen, ButtonText.Save);
    expect(screen.queryByText('Edit Attribution')).not.toBeInTheDocument();
    expect(screen.getByText('Test comment'));
  });

  it('recognizes frequent licenses and shows full license text in report view', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'something.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: '',
          },
        },
        resourcesToAttributions: {
          '/something.js': ['uuid_1'],
        },
      },
      frequentLicenses: {
        nameOrder: [
          { shortName: 'GPL-2.0', fullName: 'General Public License 2.0' },
          {
            shortName: 'Apache',
            fullName: 'Apache license',
          },
        ],
        texts: {
          'GPL-2.0': 'frequent license',
          Apache: 'Apache license text',
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'something.js');

    insertValueIntoTextBox(screen, 'License Name', 'gpl-2.0');
    clickOnButton(screen, ButtonText.Save);

    goToView(screen, View.Report);
    screen.getByText('gpl-2.0');
    expect(screen.queryByText('frequent license')).not.toBeInTheDocument();

    goToView(screen, View.Audit);
    insertValueIntoTextBox(screen, 'License Name', 'GPL-2.0');

    clickOnButton(screen, ButtonText.Save);
    goToView(screen, View.Report);
    screen.getByText('GPL-2.0');
    screen.getByText('frequent license');

    goToView(screen, View.Audit);
    insertValueIntoTextBox(screen, 'License Name', 'Apac');
    fireEvent.click(screen.getByText('Apache - Apache license'));
    clickOnButton(screen, ButtonText.Save);
    goToView(screen, View.Report);
    screen.getByText('Apache');
    screen.getByText('Apache license text');
  });
});
