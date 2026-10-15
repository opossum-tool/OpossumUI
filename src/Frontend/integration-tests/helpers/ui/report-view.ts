// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import { expect } from 'vitest';

import { SETTLED_TIMEOUT } from './common';

const REPORT_VIEW_LABEL = 'report view';

export function getReportView(): HTMLElement {
  return screen.getByLabelText(REPORT_VIEW_LABEL);
}

export async function expectReportAttributionVisibility(
  visible: Array<string>,
  hidden: Array<string> = [],
): Promise<void> {
  for (const attributionId of visible) {
    await waitFor(() => {
      expect(within(getReportView()).getByTestId(attributionId)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const attributionId of hidden) {
    await waitFor(() => {
      expect(within(getReportView()).queryByTestId(attributionId)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}
