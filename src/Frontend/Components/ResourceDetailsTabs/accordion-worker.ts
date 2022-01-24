// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getPanelData } from './resource-details-tabs-helpers';

self.onmessage = ({
  data: {
    selectedResourceId,
    manualData,
    externalData,
    resolvedExternalAttributions,
  },
}): void => {
  const output = getPanelData(
    selectedResourceId,
    manualData,
    externalData,
    resolvedExternalAttributions
  );

  self.postMessage({
    output,
  });
};
