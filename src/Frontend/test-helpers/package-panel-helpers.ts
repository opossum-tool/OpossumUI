// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  fireEvent,
  getByLabelText,
  getByText,
  queryByText,
  Screen,
} from '@testing-library/react';
import { getPackagePanel } from './general-test-helpers';

export function expectPackageInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  const packagesPanel = getPackagePanel(screen, packagePanelName);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(getByText(packagesPanel, packageName)).toBeInTheDocument();
}

export function clickOnPackageInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  fireEvent.click(
    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByText(getPackagePanel(screen, packagePanelName), packageName)
  );
}

export function expectValueInManualPackagePanel(
  screen: Screen,
  packageName: string
): void {
  // eslint-disable-next-line testing-library/prefer-screen-queries
  getByText(
    screen.getByText('Attributions').parentElement as HTMLElement,
    packageName
  );
}

export function expectValueNotInManualPackagePanel(
  screen: Screen,
  packageName: string
): void {
  expect(
    // eslint-disable-next-line testing-library/prefer-screen-queries
    queryByText(
      // eslint-disable-next-line testing-library/prefer-presence-queries
      screen.getByText('Attributions').parentElement as HTMLElement,
      packageName
    )
  ).not.toBeInTheDocument();
}

export function expectValueInManualPackagePanelForParentAttribution(
  screen: Screen,
  packageName: string
): void {
  getValueInManualPackagePanelForParentAttribution(screen, packageName);
}

export function clickOnValueInManualPackagePanelForParentAttribution(
  screen: Screen,
  packageName: string
): void {
  fireEvent.click(
    getValueInManualPackagePanelForParentAttribution(screen, packageName)
  );
}

function getValueInManualPackagePanelForParentAttribution(
  screen: Screen,
  packageName: string
): HTMLElement {
  // eslint-disable-next-line testing-library/prefer-screen-queries
  return getByText(
    screen.getByText('Attributions (from parents)')
      .parentElement as HTMLElement,
    packageName
  );
}

export function expectPackageNotInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  const packagesPanel = (
    (screen.getByText(packagePanelName).parentElement as HTMLElement)
      .parentElement as HTMLElement
  ).parentElement as HTMLElement;
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(queryByText(packagesPanel, packageName)).not.toBeInTheDocument();
}

export function expectPackagePanelShown(
  screen: Screen,
  packagePanelName: string
): void {
  expect(screen.getByText(packagePanelName)).toBeInTheDocument();
}

export function expectPackagePanelNotShown(
  screen: Screen,
  packagePanelName: string
): void {
  expect(screen.queryByText(packagePanelName)).not.toBeInTheDocument();
}

export function clickOnTab(screen: Screen, tabLabel: string): void {
  fireEvent.click(screen.getByLabelText(tabLabel));
}

export function clickAddIconOnCardInAttributionList(
  screen: Screen,
  value: string
): void {
  fireEvent.click(
    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByLabelText(getCardInAttributionList(screen, value), 'add')
  );
}

export function clickOnCardInAttributionList(
  screen: Screen,
  value: string
): void {
  fireEvent.click(getCardInAttributionList(screen, value));
}

export function expectAddIconInAddToAttributionCardIsHidden(
  screen: Screen,
  value: string
): void {
  expect(
    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByLabelText(getCardInAttributionList(screen, value), 'add').childNodes[0]
  ).toHaveStyle('visibility: hidden');
}

export function expectAddIconInAddToAttributionCardIsNotHidden(
  screen: Screen,
  value: string
): void {
  expect(
    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByLabelText(getCardInAttributionList(screen, value), 'add').childNodes[0]
  ).not.toHaveStyle('visibility: hidden');
}

export function getCardInAttributionList(
  screen: Screen,
  value: string
): HTMLElement {
  const card = (screen.getByText(value).parentElement as HTMLElement)
    .parentElement as HTMLElement;
  expect(card).toBeInTheDocument();

  return card;
}

export function expectValueInAddToAttributionList(
  screen: Screen,
  value: string
): void {
  const addToAttributionList = (
    (
      (
        (
          (
            (
              (screen.getAllByLabelText(/add/)[0].parentElement as HTMLElement)
                .parentElement as HTMLElement
            ).parentElement as HTMLElement
          ).parentElement as HTMLElement
        ).parentElement as HTMLElement
      ).parentElement as HTMLElement
    ).parentElement as HTMLElement
  ).parentElement as HTMLElement;
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(getByText(addToAttributionList, value));
}

export function expectValueNotInAddToAttributionList(
  screen: Screen,
  value: string
): void {
  if (screen.queryAllByLabelText(/add/).length === 0) {
    return;
  }
  const addToAttributionList = (
    (
      (
        (
          (
            (screen.getAllByLabelText(/add/)[0].parentElement as HTMLElement)
              .parentElement as HTMLElement
          ).parentElement as HTMLElement
        ).parentElement as HTMLElement
      ).parentElement as HTMLElement
    ).parentElement as HTMLElement
  ).parentElement as HTMLElement;
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(queryByText(addToAttributionList, value)).not.toBeInTheDocument();
}

export function clickAddNewAttributionButton(screen: Screen): void {
  fireEvent.click(screen.getByText('Add new attribution') as Element);
}
