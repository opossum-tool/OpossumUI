// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, Screen } from '@testing-library/react';

export function clickOnTab(screen: Screen, tabLabel: string): void {
  fireEvent.click(screen.getByLabelText(tabLabel));
}
