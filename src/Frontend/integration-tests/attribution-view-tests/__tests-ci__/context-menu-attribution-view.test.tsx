// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import { fireEvent, screen } from '@testing-library/react';
import {
  Attributions,
  DiscreteConfidence,
  Resources,
  ResourcesToAttributions,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import {
  clickOnButtonInPackageContextMenu,
  expectButtonInPackageContextMenu,
  expectContextMenuForNotPreSelectedAttributionMultipleResources,
  expectGlobalOnlyContextMenuForNotPreselectedAttribution,
  expectGlobalOnlyContextMenuForPreselectedAttribution,
  expectNoConfirmationButtonsShown,
  handleReplaceMarkedAttributionViaContextMenu,
} from '../../../test-helpers/context-menu-test-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ButtonText, View } from '../../../enums/enums';
import {
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
} from '../../../test-helpers/resource-browser-test-helpers';
import { clickOnCardInAttributionList } from '../../../test-helpers/package-panel-helpers';
import {
  clickOnButton,
  clickOnMultiSelectCheckboxInPackageCard,
  closeProjectStatisticsPopup,
  expectSelectCheckboxInPackageCardIsChecked,
  getParsedInputFileEnrichedWithTestData,
  goToView,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import {
  expectConfirmMultiSelectDeletionPopupNotVisible,
  expectConfirmMultiSelectDeletionPopupVisible,
} from '../../../test-helpers/popup-test-helpers';

const testResources: Resources = {
  'firstResource.js': 1,
  'secondResource.js': 1,
  'thirdResource.js': 1,
  'fourthResource.js': 1,
};

const testManualAttributions: Attributions = {
  uuid_1: {
    packageName: 'React',
    packageVersion: '16.5.0',
    licenseText: 'Permission is hereby granteds',
    comment: 'Attribution of multiple resources',
    attributionConfidence: 10,
    preSelected: true,
  },
  uuid_2: {
    packageName: 'Vue',
    packageVersion: '1.2.0',
    licenseText: 'Permission is not granted',
    comment: 'Attribution of one resources',
    attributionConfidence: 90,
    preSelected: true,
  },
};

const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/firstResource.js': ['uuid_1'],
  '/secondResource.js': ['uuid_1'],
  '/thirdResource.js': ['uuid_1'],
  '/fourthResource.js': ['uuid_2'],
};

describe('In Attribution View the ContextMenu', () => {
  it('confirmation buttons work correctly', () => {
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    renderComponentWithStore(<App />);

    goToView(screen, View.Attribution);
    expectGlobalOnlyContextMenuForPreselectedAttribution(
      screen,
      'React, 16.5.0',
    );
    clickOnButtonInPackageContextMenu(
      screen,
      'React, 16.5.0',
      ButtonText.ConfirmGlobally,
    );
    expectGlobalOnlyContextMenuForNotPreselectedAttribution(
      screen,
      'React, 16.5.0',
    );
    clickOnCardInAttributionList(screen, 'React, 16.5.0');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

    goToView(screen, View.Audit);
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectContextMenuForNotPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.5.0',
    );
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
  });

  it('replaces attributions correctly', () => {
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_2: {
          comment: 'ManualPackage',
          packageName: 'React',
          packageVersion: '16.0.0',
          attributionConfidence: DiscreteConfidence.High,
        },
        uuid_3: {
          packageName: 'Vue',
          packageVersion: '16.0.0',
          comment: 'ManualPackage',
          preSelected: true,
          attributionConfidence: DiscreteConfidence.Low,
        },
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        '/root/src/file_1': ['uuid_2'],
        '/root/src/file_2': ['uuid_2', 'uuid_3'],
      },
    };
    const testResources: Resources = {
      root: { src: { file_1: 1, file_2: 1 } },
      file: 1,
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
      },
      uuid_2: {
        packageName: 'React',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        attributionConfidence: DiscreteConfidence.High,
      },
      uuid_3: {
        packageName: 'Vue',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        preSelected: true,
        attributionConfidence: DiscreteConfidence.Low,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/file_1': ['uuid_1'],
      '/root/src/file_2': ['uuid_2', 'uuid_3'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    renderComponentWithStore(<App />);

    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('jQuery, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'jQuery');
    screen.getByText('file_1');

    clickOnButtonInPackageContextMenu(
      screen,
      'jQuery, 16.0.0',
      ButtonText.MarkForReplacement,
    );

    fireEvent.click(screen.getByText('React, 16.0.0') as Element);

    handleReplaceMarkedAttributionViaContextMenu(
      screen,
      'React, 16.0.0',
      ButtonText.Cancel,
    );

    expect(screen.getByText('jQuery, 16.0.0')).toBeInTheDocument();

    handleReplaceMarkedAttributionViaContextMenu(
      screen,
      'React, 16.0.0',
      ButtonText.Replace,
    );
    expectValueInTextBox(screen, 'Name', 'React');
    expectGlobalOnlyContextMenuForNotPreselectedAttribution(
      screen,
      'React, 16.0.0',
    );

    expect(screen.queryByText('jQuery, 16.0.0')).not.toBeInTheDocument();
    screen.getByText('file_1');
    screen.getByText('file_2');

    // make sure resources are now linked to React attribution
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs,
    );
  });

  it('deletes multi-selected attributions correctly', () => {
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    goToView(screen, View.Attribution);
    expectGlobalOnlyContextMenuForPreselectedAttribution(
      screen,
      'React, 16.5.0',
    );

    clickOnMultiSelectCheckboxInPackageCard(screen, 'React, 16.5.0');
    clickOnMultiSelectCheckboxInPackageCard(screen, 'Vue, 1.2.0');

    expectSelectCheckboxInPackageCardIsChecked(screen, 'React, 16.5.0');
    expectButtonInPackageContextMenu(
      screen,
      'React, 16.5.0',
      ButtonText.DeleteSelectedGlobally,
    );
    expectButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.DeleteSelectedGlobally,
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'Vue, 1.2.0',
      ButtonText.DeleteSelectedGlobally,
    );
    expectConfirmMultiSelectDeletionPopupVisible(screen, 2);
    clickOnButton(screen, ButtonText.Confirm);
    expectConfirmMultiSelectDeletionPopupNotVisible(screen);
    expect(screen.queryByText('React, 16.5.0')).not.toBeInTheDocument();
    expect(screen.queryByText('Vue, 1.2.0')).not.toBeInTheDocument();
  });
});
