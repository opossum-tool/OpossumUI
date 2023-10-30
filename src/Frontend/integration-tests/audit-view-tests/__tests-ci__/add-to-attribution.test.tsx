// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { App } from '../../../Components/App/App';
import { ButtonText } from '../../../enums/enums';
import {
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnButton,
  closeProjectStatisticsPopup,
  getParsedInputFileEnrichedWithTestData,
  mockElectronBackendOpenFile,
} from '../../../test-helpers/general-test-helpers';
import {
  clickAddIconOnCardInAttributionList,
  clickOnTab,
  expectPackageInPackagePanel,
  expectValueInAddToAttributionList,
  expectValueNotInAddToAttributionList,
  getCardInAttributionList,
} from '../../../test-helpers/package-panel-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

describe('Add to attribution', () => {
  it(
    'AddToAttribution shows attribution correctly, ' +
      'does not show parent attribution, and adds attribution',
    () => {
      const testResources: Resources = {
        folder1: { 'firstResource.js': 1 },
        'secondResource.js': 1,
        'thirdResource.js': 1,
      };
      const testManualAttributions: Attributions = {
        uuid_1: {
          packageName: 'React',
          packageVersion: '16.5.0',
          licenseText: 'Permission is hereby granted',
        },
        uuid_2: {
          packageName: 'Vue',
          packageVersion: '1.2.0',
          licenseText: 'Permission is not granted',
          attributionConfidence: DiscreteConfidence.Low,
        },
        uuid_3: {
          packageName: 'Angular',
          packageVersion: '10',
          licenseText: 'Permission is maybe granted.',
          attributionConfidence: DiscreteConfidence.High,
          comment: 'Comment for Angular',
        },
      };
      const testResourcesToManualAttributions: ResourcesToAttributions = {
        '/folder1/': ['uuid_1'],
        '/secondResource.js': ['uuid_2'],
        '/thirdResource.js': ['uuid_3'],
      };
      mockElectronBackendOpenFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        }),
      );

      renderComponentWithStore(<App />);
      closeProjectStatisticsPopup(screen);

      clickOnElementInResourceBrowser(screen, 'folder1');
      clickOnElementInResourceBrowser(screen, 'firstResource.js');
      clickOnButton(screen, 'Override parent');
      clickOnTab(screen, 'Global Tab');
      expectValueInAddToAttributionList(screen, 'React, 16.5.0');
      expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
      expectValueInAddToAttributionList(screen, 'Angular, 10');
      expectValueNotInTextBox(
        screen,
        'Confidence',
        `Low (${DiscreteConfidence.Low})`,
      );

      fireEvent.click(getCardInAttributionList(screen, 'Vue, 1.2.0'));
      expectValueInAddToAttributionList(screen, 'React, 16.5.0');
      expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
      expectValueInAddToAttributionList(screen, 'Angular, 10');
      expectValueInTextBox(
        screen,
        'License Text (to appear in attribution document)',
        'Permission is not granted',
      );
      expectValueInTextBox(screen, 'Name', 'Vue');
      expectValueInConfidenceField(screen, `Low (${DiscreteConfidence.Low})`);
      clickAddIconOnCardInAttributionList(screen, 'Angular, 10');

      expectValueInAddToAttributionList(screen, 'React, 16.5.0');
      expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
      expectValueInTextBox(screen, 'Comment', 'Comment for Angular');
      expectValueInTextBox(
        screen,
        'License Text (to appear in attribution document)',
        'Permission is maybe granted.',
      );
      expectValueInTextBox(screen, 'Name', 'Angular');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    },
  );

  it('AddToAttribution removes abandoned attributions', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'React',
        packageVersion: '16.5.0',
        licenseText: 'Permission is hereby granted',
      },
      uuid_2: {
        packageName: 'Vue',
        packageVersion: '1.2.0',
        licenseText: 'Permission is not granted',
      },
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '10',
        licenseText: 'Permission is maybe granted.',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_3'],
    };
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'Global Tab');
    expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');

    clickAddIconOnCardInAttributionList(screen, 'Vue, 1.2.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'Permission is not granted',
    );
    expectValueInTextBox(screen, 'Name', 'Vue');

    expectValueInAddToAttributionList(screen, 'Angular, 10');

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    clickOnTab(screen, 'Global Tab');
    expectValueInAddToAttributionList(screen, 'React, 16.5.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');
  });

  it('AddToAttribution and deletion updates attributed children', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'React',
        packageVersion: '16.5.0',
        licenseText: 'Permission is hereby granted',
      },
      uuid_2: {
        packageName: 'Vue',
        packageVersion: '1.2.0',
        licenseText: 'Permission is not granted',
      },
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '10',
        licenseText: 'Permission is maybe granted.',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_3'],
    };
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'Global Tab');
    expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');

    clickAddIconOnCardInAttributionList(screen, 'Vue, 1.2.0');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'Permission is not granted',
    );
    expectValueInTextBox(screen, 'Name', 'Vue');

    insertValueIntoTextBox(screen, 'Name', '');
    insertValueIntoTextBox(screen, 'Version', '');
    insertValueIntoTextBox(
      screen,
      'License Text (to appear in attribution document)',
      '',
    );

    clickOnButton(screen, ButtonText.Save);

    clickOnElementInResourceBrowser(screen, '/');
    expectPackageInPackagePanel(
      screen,
      'Angular, 10',
      'Attributions in Folder Content',
    );
  });

  it('AddToAttribution not shown for breakpoints', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'React',
        packageVersion: '16.5.0',
        licenseText: 'Permission is hereby granted',
      },
      uuid_2: {
        packageName: 'Vue',
        packageVersion: '1.2.0',
        licenseText: 'Permission is not granted',
      },
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '10',
        licenseText: 'Permission is maybe granted.',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_ext_1'],
    };
    const testExternalAttributions: Attributions = {
      uuid_ext_1: {
        packageName: 'Jquery',
        packageVersion: '16.5.0',
        licenseText: 'Permission is hereby granted',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_3'],
    };
    const attributionBreakpoints = new Set<string>().add('/folder1/');
    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
        attributionBreakpoints,
      }),
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'Global Tab');
    expectValueNotInAddToAttributionList(screen, 'Vue, 1.2.0');
    expectValueNotInAddToAttributionList(screen, 'Angular, 10');

    clickOnTab(screen, 'Local Tab');
    expectValueNotInAddToAttributionList(screen, 'Jquery, 16.5.0');
  });

  it('adds a merged signal correctly', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
    };
    const testExternalAttributions: Attributions = {
      uuid_ext_1: {
        packageName: 'Jquery',
        packageVersion: '16.5.0',
        originIds: ['abc'],
        comment: 'It is a nice package.',
      },
      uuid_ext_2: {
        packageName: 'Jquery',
        packageVersion: '16.5.0',
        originIds: ['def'],
        comment: 'I do not like this package.',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_ext_1', 'uuid_ext_2'],
    };

    mockElectronBackendOpenFile(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'Local Tab');
    expectValueInAddToAttributionList(screen, 'Jquery, 16.5.0');

    fireEvent.click(getCardInAttributionList(screen, 'Jquery, 16.5.0'));
    expectValueInTextBox(screen, 'Comment 1', 'It is a nice package.');
    expectValueInTextBox(screen, 'Comment 2', 'I do not like this package.');

    clickAddIconOnCardInAttributionList(screen, 'Jquery, 16.5.0');
    expectValueInTextBox(screen, 'Name', 'Jquery');
    expectValueInTextBox(screen, 'Comment', '');
  });
});
