// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, Screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import isEmpty from 'lodash/isEmpty';

import {
  Attributions,
  ExternalAttributionSources,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import {
  EMPTY_FREQUENT_LICENSES,
  EMPTY_PROJECT_METADATA,
  Filter,
} from '../shared-constants';
import { canResourceHaveChildren } from '../util/can-resource-have-children';

const EMPTY_PARSED_FILE_CONTENT: ParsedFileContent = {
  metadata: EMPTY_PROJECT_METADATA,
  resources: {},
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
  },
  externalAttributions: {
    attributions: {},
    resourcesToAttributions: {},
  },
  frequentLicenses: EMPTY_FREQUENT_LICENSES,
  resolvedExternalAttributions: new Set(),
  attributionBreakpoints: new Set(),
  filesWithChildren: new Set(),
  baseUrlsForSources: {},
  externalAttributionSources: {},
};

export function getParsedInputFileEnrichedWithTestData(testData: {
  resources?: Resources;
  manualAttributions?: Attributions;
  resourcesToManualAttributions?: ResourcesToAttributions;
  externalAttributions?: Attributions;
  resourcesToExternalAttributions?: ResourcesToAttributions;
  attributionBreakpoints?: Set<string>;
  filesWithChildren?: Set<string>;
  externalAttributionSources?: ExternalAttributionSources;
}): ParsedFileContent {
  const defaultTestResources: Resources = {
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
      'jQuery.js': 1,
    },
  };
  const resources = testData.resources || defaultTestResources;
  const resourceIdOfRoot = getResourceIdOfRoot(resources);

  const testResourcesToManualAttributions = getResourcesToAttributions(
    testData.manualAttributions,
    testData.resourcesToManualAttributions,
    resourceIdOfRoot,
  );
  const testResourcesToExternalAttributions = getResourcesToAttributions(
    testData.externalAttributions,
    testData.resourcesToExternalAttributions,
    resourceIdOfRoot,
  );

  return {
    ...EMPTY_PARSED_FILE_CONTENT,
    resources,
    manualAttributions: {
      attributions: testData.manualAttributions || {},
      resourcesToAttributions: testResourcesToManualAttributions,
    },
    externalAttributions: {
      attributions: testData.externalAttributions || {},
      resourcesToAttributions: testResourcesToExternalAttributions,
    },
    attributionBreakpoints: testData.attributionBreakpoints || new Set(),
    filesWithChildren: testData.filesWithChildren || new Set(),
    externalAttributionSources: testData.externalAttributionSources || {},
  };
}

function getResourceIdOfRoot(resources: Resources): string {
  return `/${Object.keys(resources)[0]}${
    canResourceHaveChildren(resources[Object.keys(resources)[0]]) ? '' : '/'
  }`;
}

function getResourcesToAttributions(
  attributions: Attributions | undefined,
  resourcesToAttributions: ResourcesToAttributions | undefined,
  resourceIdOfRoot: string,
): ResourcesToAttributions {
  let testResourcesToExternalAttributions: ResourcesToAttributions =
    resourcesToAttributions || {};
  if (attributions && isEmpty(testResourcesToExternalAttributions)) {
    testResourcesToExternalAttributions = {
      [resourceIdOfRoot]: Object.keys(attributions),
    };
  }

  return testResourcesToExternalAttributions;
}

export function clickOnButton(screen: Screen, buttonLabel: string): void {
  fireEvent.click(screen.getByRole('button', { name: buttonLabel }));
}

export function clickOnCheckbox(screen: Screen, label: string): void {
  fireEvent.click(
    screen.getByRole('checkbox', { name: `checkbox ${label}` }) as Element,
  );
}

export async function selectFilter(screen: Screen, filter: Filter) {
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.paste(filter);
  await userEvent.click(screen.getByText(filter));
}

export function expectElementsInAutoCompleteAndSelectFirst(
  screen: Screen,
  elements: Array<string>,
): void {
  const autoComplete = screen.getByLabelText('license names');
  autoComplete.focus();
  fireEvent.keyDown(autoComplete, { key: 'ArrowDown' });

  elements.forEach((element) =>
    expect(screen.getByText(element)).toBeInTheDocument(),
  );

  fireEvent.click(screen.getByText(elements[0]) as Element);
}

export function getPackagePanel(
  screen: Screen,
  packagePanelName: string,
): HTMLElement {
  return (
    (screen.getByText(packagePanelName).parentElement as HTMLElement)
      .parentElement as HTMLElement
  ).parentElement as HTMLElement;
}
