// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import isEmpty from 'lodash/isEmpty';

import {
  Attributions,
  AttributionsToResources,
  ExternalAttributionSources,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import {
  EMPTY_FREQUENT_LICENSES,
  EMPTY_PROJECT_METADATA,
} from '../shared-constants';
import { canResourceHaveChildren } from '../util/can-resource-have-children';

const EMPTY_PARSED_FILE_CONTENT: ParsedFileContent = {
  metadata: EMPTY_PROJECT_METADATA,
  resources: {},
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
  },
  externalAttributions: {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
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
      attributionsToResources: getAttributionsToResources(
        testResourcesToManualAttributions,
      ),
    },
    externalAttributions: {
      attributions: testData.externalAttributions || {},
      resourcesToAttributions: testResourcesToExternalAttributions,
      attributionsToResources: getAttributionsToResources(
        testResourcesToExternalAttributions,
      ),
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

export function getAttributionsToResources(
  resourcesToAttributions: ResourcesToAttributions | undefined,
): AttributionsToResources {
  if (!resourcesToAttributions) {
    return {};
  }

  return Object.entries(
    resourcesToAttributions,
  ).reduce<AttributionsToResources>((acc, [resource, attributionIds]) => {
    attributionIds.forEach((attributionId) => {
      if (acc[attributionId]) {
        acc[attributionId].push(resource);
      } else {
        acc[attributionId] = [resource];
      }
    });
    return acc;
  }, {});
}
