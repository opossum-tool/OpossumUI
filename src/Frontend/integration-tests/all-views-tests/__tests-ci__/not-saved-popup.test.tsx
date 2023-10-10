// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  clickOnOpenFileIcon,
  clickOnTopProgressBar,
  EMPTY_PARSED_FILE_CONTENT,
  goToView,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import { fireEvent, screen } from '@testing-library/react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ButtonText, View } from '../../../enums/enums';
import { ParsedFileContent } from '../../../../shared/shared-types';
import {
  clickAddIconOnCardInAttributionList,
  clickAddNewAttributionButton,
  clickOnTab,
  expectPackageInPackagePanel,
  expectPackageNotInPackagePanel,
  expectPackagePanelShown,
  getCardInAttributionList,
} from '../../../test-helpers/package-panel-helpers';
import {
  clickOnButtonInHamburgerMenu,
  expectValueInTextBox,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
  getElementInResourceBrowser,
} from '../../../test-helpers/resource-browser-test-helpers';
import {
  expectUnsavedChangesPopupIsNotShown,
  expectUnsavedChangesPopupIsShown,
} from '../../../test-helpers/popup-test-helpers';

describe('Not saved popup of the app', () => {
  function loadMockFileContent(): void {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_1: 1, file_2: 1 } },
        file: 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_1': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'Vue',
            packageVersion: '2.6.0',
            comment: 'ExternalPackage',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_2': ['uuid_1'],
        },
      },
    };

    mockElectronBackendOpenFile(mockChannelReturn);
  }

  it('switches between views', () => {
    loadMockFileContent();
    renderComponentWithStore(<App />);
    clickOnOpenFileIcon(screen);
    getElementInResourceBrowser(screen, 'root');

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    goToView(screen, View.Audit);
    getElementInResourceBrowser(screen, 'root');

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    goToView(screen, View.Report);
    expectResourceBrowserIsNotShown(screen);
  });

  it('shows working unsaved popup switching from standard view to attribution view', () => {
    loadMockFileContent();
    renderComponentWithStore(<App />);
    clickOnOpenFileIcon(screen);
    getElementInResourceBrowser(screen, 'root');

    clickOnElementInResourceBrowser(screen, 'root');

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Attribution);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Cancel);
    getElementInResourceBrowser(screen, 'root');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Attribution);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Undo);
    expectResourceBrowserIsNotShown(screen);

    goToView(screen, View.Audit);
    getElementInResourceBrowser(screen, 'root');

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Attribution);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Save);
    expect(screen.getByText('Angular'));
    expectResourceBrowserIsNotShown(screen);
  });

  it('shows working unsaved popup switching from standard view to Report', () => {
    loadMockFileContent();
    renderComponentWithStore(<App />);
    clickOnOpenFileIcon(screen);

    clickOnElementInResourceBrowser(screen, 'root');
    insertValueIntoTextBox(screen, 'Name', 'Angular');
    insertValueIntoTextBox(screen, 'Version', '1.1.1');

    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Report);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Cancel);
    getElementInResourceBrowser(screen, 'root');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Report);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Save);
    expect(screen.getByText('Angular'));
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByLabelText('edit Angular'));
    expectValueInTextBox(screen, 'Version', '1.1.1');
  });

  it('shows unsaved popup switching from attribution view to standard view', () => {
    loadMockFileContent();
    renderComponentWithStore(<App />);
    clickOnOpenFileIcon(screen);
    getElementInResourceBrowser(screen, 'root');

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('React, 16.0.0'));
    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Audit);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Cancel);
    expect(screen.getByText('React, 16.0.0'));
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Audit);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Undo);
    getElementInResourceBrowser(screen, 'root');

    clickOnElementInResourceBrowser(screen, 'root');
    clickOnElementInResourceBrowser(screen, 'src');
    clickOnElementInResourceBrowser(screen, 'file_1');
    expectValueNotInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Attribution);
    expect(screen.getByText('React, 16.0.0'));

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Audit);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Save);
    getElementInResourceBrowser(screen, 'root');

    clickOnElementInResourceBrowser(screen, 'root');
    expect(screen.getByText('Angular, 16.0.0'));

    goToView(screen, View.Attribution);
    fireEvent.click(screen.getByText('Angular, 16.0.0'));
    insertValueIntoTextBox(screen, 'Name', 'Vue');
    expectValueInTextBox(screen, 'Name', 'Vue');

    clickOnTopProgressBar(screen);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Undo);
    getElementInResourceBrowser(screen, 'root');

    goToView(screen, View.Attribution);
    clickOnTopProgressBar(screen);
    expectUnsavedChangesPopupIsNotShown(screen);
    getElementInResourceBrowser(screen, 'root');
  });

  it(
    'shows working unsaved popup when adding attribution or signal' +
      ' while modified attribution exists',
    () => {
      loadMockFileContent();
      renderComponentWithStore(<App />);
      clickOnOpenFileIcon(screen);
      getElementInResourceBrowser(screen, 'root');
      clickOnElementInResourceBrowser(screen, 'root');
      clickOnElementInResourceBrowser(screen, 'src');
      clickOnElementInResourceBrowser(screen, 'file_2');

      insertValueIntoTextBox(screen, 'Name', 'Angular');
      expectValueInTextBox(screen, 'Name', 'Angular');

      clickAddIconOnCardInAttributionList(screen, 'Vue, 2.6.0');
      expectUnsavedChangesPopupIsShown(screen);

      clickOnButton(screen, ButtonText.Cancel);
      clickOnTab(screen, 'Global Tab');
      clickAddIconOnCardInAttributionList(screen, 'React, 16.0.0');
      expectUnsavedChangesPopupIsShown(screen);
    },
  );

  it('does not show NotSavedPopup when nothing was modified', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_2: 1 } },
        file: 1,
        directory_manual: { subdirectory_manual: { file_manual: 1 } },
      },
      manualAttributions: {
        attributions: {
          uuid_2: { packageName: 'React' },
        },
        resourcesToAttributions: {
          '/directory_manual/subdirectory_manual/': ['uuid_2'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 99.0,
            },
            packageName: 'JQuery',
          },
        },
        resourcesToAttributions: {
          '/root/src/': ['uuid_1'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'root');
    clickOnElementInResourceBrowser(screen, 'src');

    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals');
    fireEvent.click(getCardInAttributionList(screen, 'JQuery'));

    clickOnElementInResourceBrowser(screen, 'root');

    expectUnsavedChangesPopupIsNotShown(screen);
  });

  it('shows NotSavedPopup if something was modified and buttons work', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_2: 1 } },
        file: 1,
        directory_manual: { subdirectory_manual: { file_manual: 1 } },
      },
      manualAttributions: {
        attributions: {
          uuid_2: { packageName: 'React' },
        },
        resourcesToAttributions: {
          '/directory_manual/subdirectory_manual/': ['uuid_2'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 99.0,
            },
            packageName: 'JQuery',
          },
        },
        resourcesToAttributions: {
          '/root/src/': ['uuid_1'],
        },
      },
    };
    mockElectronBackendOpenFile(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'root');
    clickOnElementInResourceBrowser(screen, 'src');

    clickAddNewAttributionButton(screen);
    insertValueIntoTextBox(screen, 'Name', 'My great manual package');
    expectValueInTextBox(screen, 'Name', 'My great manual package');

    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals');

    fireEvent.click(getCardInAttributionList(screen, 'JQuery'));
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Cancel);
    expectValueInTextBox(screen, 'Name', 'My great manual package');

    fireEvent.click(getCardInAttributionList(screen, 'JQuery'));
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButtonInHamburgerMenu(screen, ButtonText.Undo);

    // This behavior could be changed in the future. One could jump to JQuery.
    expectValueNotInTextBox(screen, 'Name', 'My great manual package');
    expectValueNotInTextBox(screen, 'Name', 'JQuery');
    expectPackageNotInPackagePanel(
      screen,
      'My great manual package',
      'Attributions',
    );
  });
});
