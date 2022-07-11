// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  EMPTY_PARSED_FILE_CONTENT,
  mockElectronBackend,
} from '../../../test-helpers/general-test-helpers';
import { ParsedFileContent } from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import {
  clickGoToLinkIcon,
  expectGoToLinkIconIsNotVisible,
  expectGoToLinkIconIsVisible,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

describe('The go to link button', () => {
  test('is visible and opens link in external browser', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        parent_with_breakpoint: { 'something.js': 1 },
        parent: { 'something_else.js': 1 },
      },
      attributionBreakpoints: new Set<string>().add('/parent_with_breakpoint/'),
      baseUrlsForSources: {
        '/': 'https://www.testurl.com/code/{path}?base=123456789',
      },
    };
    const expectedLinkForParent =
      'https://www.testurl.com/code/parent?base=123456789';
    const expectedLinkForFile =
      'https://www.testurl.com/code/parent/something_else.js?base=123456789';

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'parent_with_breakpoint');
    expectGoToLinkIconIsNotVisible(screen);
    clickOnElementInResourceBrowser(screen, 'something.js');
    expectGoToLinkIconIsNotVisible(screen);

    clickOnElementInResourceBrowser(screen, 'parent');
    expectGoToLinkIconIsVisible(screen);
    clickGoToLinkIcon(screen, 'link to open');
    expect(window.electronAPI.openLink).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(
      expectedLinkForParent
    );

    clickOnElementInResourceBrowser(screen, 'something_else.js');
    expectGoToLinkIconIsVisible(screen);
    clickGoToLinkIcon(screen, 'link to open');
    expect(window.electronAPI.openLink).toHaveBeenCalledTimes(2);
    expect(window.electronAPI.openLink).toHaveBeenCalledWith(
      expectedLinkForFile
    );
  });
});
