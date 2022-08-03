// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  clickOnCheckbox,
  clickOnFilter,
  EMPTY_PARSED_FILE_CONTENT,
  goToView,
  mockElectronBackend,
  openDropDown,
} from '../../../test-helpers/general-test-helpers';
import { screen } from '@testing-library/react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  ButtonText,
  CheckboxLabel,
  FilterType,
  View,
} from '../../../enums/enums';
import { ParsedFileContent } from '../../../../shared/shared-types';
import React from 'react';
import { clickOnCardInAttributionList } from '../../../test-helpers/package-panel-helpers';

describe('The App integration', () => {
  it('app persists filters when changing views', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { folder2: { file1: 1 } },
        file2: 1,
      },

      manualAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 50.0,
            },
            packageName: 'JQuery',
            followUp: 'FOLLOW_UP',
          },
          uuid_2: {
            source: {
              name: 'SC',
              documentConfidence: 9.0,
            },
            packageName: 'Angular',
          },
          uuid_3: {
            source: {
              name: 'REUSE:SC',
              documentConfidence: 90.0,
            },
            packageName: 'Vue',
            firstParty: true,
          },
        },
        resourcesToAttributions: {
          '/folder1/folder2/file1': ['uuid_1'],
          '/file2': ['uuid_2'],
          '/folder1/folder2': ['uuid_3'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);

    renderComponentWithStore(<App />);

    goToView(screen, View.Attribution);
    screen.getByText('JQuery');
    screen.getByText('Angular');
    screen.getByText('Vue');

    clickOnCardInAttributionList(screen, 'Vue');
    clickOnCheckbox(screen, CheckboxLabel.FollowUp);
    clickOnButton(screen, ButtonText.Save);

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFollowUp);
    screen.getByText('JQuery');
    expect(screen.queryByText('Angular')).not.toBeInTheDocument();
    screen.getAllByText('Vue');

    goToView(screen, View.Report);
    screen.getByText('JQuery');
    expect(screen.queryByText('Angular')).not.toBeInTheDocument();
    screen.getByText('Vue');

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFollowUp);
    screen.getByText('JQuery');
    screen.getByText('Angular');
    screen.getByText('Vue');

    clickOnFilter(screen, FilterType.OnlyFirstParty);
    expect(screen.queryByText('JQuery')).not.toBeInTheDocument();
    expect(screen.queryByText('Angular')).not.toBeInTheDocument();
    screen.getByText('Vue');

    goToView(screen, View.Attribution);
    expect(screen.queryByText('JQuery')).not.toBeInTheDocument();
    expect(screen.queryByText('Angular')).not.toBeInTheDocument();
    screen.getByText('Vue');
  });
});
