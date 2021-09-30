// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  getByLabelText,
  getByText,
  getByTitle,
  queryByLabelText,
  queryByText,
  within,
} from '@testing-library/dom';
import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, Screen } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { doNothing } from '../util/do-nothing';
import {
  EMPTY_FREQUENT_LICENSES,
  EMPTY_PROJECT_METADATA,
} from '../shared-constants';

export const TEST_TIMEOUT = 15000;

export function mockElectronIpcRendererOn(
  mockChannel: string,
  mockChannelReturn: unknown
): unknown {
  return (channel: unknown, listenerCallback: unknown): unknown =>
    // @ts-ignore
    listenerCallback(
      null,
      channel === mockChannel ? mockChannelReturn : undefined
    );
}

export function getDoNothingStateSetter(): Dispatch<SetStateAction<unknown>> {
  return doNothing as unknown as Dispatch<SetStateAction<unknown>>;
}

export function getEmptyParsedInputFile(): ParsedFileContent {
  return getParsedInputFile();
}

export const EMPTY_PARSED_FILE_CONTENT: ParsedFileContent = {
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

export function getParsedInputFile(
  resources?: Resources,
  manualAttributions?: Attributions,
  resourcesToManualAttributions?: ResourcesToAttributions,
  externalAttributions?: Attributions,
  resourcesToExternalAttributions?: ResourcesToAttributions,
  attributionBreakpoints?: Set<string>,
  filesWithChildren?: Set<string>
): ParsedFileContent {
  return {
    ...EMPTY_PARSED_FILE_CONTENT,
    resources: resources ? resources : {},
    manualAttributions: {
      attributions: manualAttributions ? manualAttributions : {},
      resourcesToAttributions: resourcesToManualAttributions
        ? resourcesToManualAttributions
        : {},
    },
    externalAttributions: {
      attributions: externalAttributions ? externalAttributions : {},
      resourcesToAttributions: resourcesToExternalAttributions
        ? resourcesToExternalAttributions
        : {},
    },

    attributionBreakpoints: attributionBreakpoints
      ? attributionBreakpoints
      : new Set(),
    filesWithChildren: filesWithChildren ? filesWithChildren : new Set(),
  };
}

export function expectPackageInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  const packagesPanel = getPackagePanel(screen, packagePanelName);
  expect(queryByText(packagesPanel, packageName)).toBeTruthy();
}

export function clickOnPackageInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  fireEvent.click(
    getByText(getPackagePanel(screen, packagePanelName), packageName)
  );
}

export function clickOnPathInPopupWithResources(
  screen: Screen,
  path: string
): void {
  const popupWithResources = getPopupWithResources(screen);
  fireEvent.click(getByText(popupWithResources, path));
}

export function getPopupWithResources(screen: Screen): HTMLElement {
  return (screen.getByText(/Resources for /).parentElement as HTMLElement)
    .parentElement as HTMLElement;
}

export function getOpenResourcesIconForPackagePanel(
  screen: Screen,
  packageName: string
): HTMLElement {
  return getByLabelText(
    getPackagePanel(screen, packageName),
    'show resources'
  ) as HTMLElement;
}

function getPackagePanel(
  screen: Screen,
  packagePanelName: string
): HTMLElement {
  return (
    (screen.getByText(packagePanelName).parentElement as HTMLElement)
      .parentElement as HTMLElement
  ).parentElement as HTMLElement;
}

export function expectValueInManualPackagePanel(
  screen: Screen,
  packageName: string
): void {
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
    queryByText(
      screen.getByText('Attributions').parentElement as HTMLElement,
      packageName
    )
  ).toBeNull();
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
  expect(queryByText(packagesPanel, packageName)).not.toBeTruthy();
}

export function expectPackagePanelShown(
  screen: Screen,
  packagePanelName: string
): void {
  expect(screen.queryByText(packagePanelName)).toBeTruthy();
}

export function expectPackagePanelNotShown(
  screen: Screen,
  packagePanelName: string
): void {
  expect(screen.queryByText(packagePanelName)).not.toBeTruthy();
}

export function getButton(screen: Screen, buttonLabel: string): HTMLElement {
  return screen.getByRole('button', { name: buttonLabel });
}

export function clickOnButton(screen: Screen, buttonLabel: string): void {
  fireEvent.click(getButton(screen, buttonLabel));
}

export function expectButton(
  screen: Screen,
  buttonLabel: string,
  disabled?: boolean
): void {
  const button = getButton(screen, buttonLabel);
  const buttonDisabledAttribute = button.attributes.getNamedItem('disabled');

  if (disabled) {
    expect(buttonDisabledAttribute).toBeTruthy();
  } else {
    expect(buttonDisabledAttribute).toBeFalsy();
  }
}

export function expectButtonIsNotShown(
  screen: Screen,
  buttonLabel: string
): void {
  expect(screen.queryByRole('button', { name: buttonLabel })).not.toBeTruthy();
}

export function getButtonInContextMenu(
  screen: Screen,
  buttonLabel: string
): HTMLElement {
  fireEvent.click(screen.getByLabelText('button-context-menu'));
  const button = getButton(screen, buttonLabel);
  fireEvent.click(screen.getByRole('presentation').firstChild as Element);

  return button;
}

export function clickOnButtonInContextMenu(
  screen: Screen,
  buttonLabel: string
): void {
  fireEvent.click(getButtonInContextMenu(screen, buttonLabel));
}

export function expectButtonInContextMenu(
  screen: Screen,
  buttonLabel: string,
  disabled?: boolean
): void {
  const button = getButtonInContextMenu(screen, buttonLabel);
  const buttonAttribute = button.attributes.getNamedItem('aria-disabled');

  if (disabled) {
    expect(buttonAttribute && buttonAttribute.value).toBe('true');
  } else {
    expect(buttonAttribute && buttonAttribute.value).toBe('false');
  }
}

export function expectButtonInContextMenuIsNotShown(
  screen: Screen,
  buttonLabel: string
): void {
  fireEvent.click(screen.getByLabelText('button-context-menu'));
  expect(screen.queryByRole('button', { name: buttonLabel })).not.toBeTruthy();

  if (screen.queryByRole('presentation')) {
    fireEvent.click(screen.getByRole('presentation').firstChild as Element);
  }
}

export function clickOnTab(screen: Screen, tabLabel: string): void {
  fireEvent.click(screen.getByLabelText(tabLabel));
}

export function collapseFolderByClickingOnIcon(
  screen: Screen,
  resourceId: string
): void {
  fireEvent.click(
    screen.getByLabelText(`open folder ${resourceId}`) as Element
  );
}

export function expectIconToExist(
  screen: Screen,
  iconLabel: string,
  resourceName: string,
  expectedToExist: boolean
): void {
  const treeItem = screen.getByText(resourceName);
  expectedToExist
    ? expect(
        queryByLabelText(treeItem.parentElement as HTMLElement, iconLabel)
      ).not.toBeNull()
    : expect(
        queryByLabelText(treeItem.parentElement as HTMLElement, iconLabel)
      ).toBeNull();
}

export function expectResourceIconLabelToBe(
  screen: Screen,
  resourceName: string,
  iconLabel: string
): void {
  const treeItem = screen.getByText(resourceName);
  expect(
    queryByLabelText(treeItem.parentElement as HTMLElement, iconLabel)
  ).not.toBeNull();
}

export function insertValueIntoTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  fireEvent.change(textBox, {
    target: { value },
  });
}

export function expectValueInTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  getByText(textBox, value);
}

export function expectValueNotInTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  expect(queryByText(textBox, value)).not.toBeTruthy();
}

export function getElementInResourceBrowser(
  screen: Screen,
  resourceId: string
): HTMLElement {
  const resourceBrowser = screen.getByLabelText('resource browser');

  return getByText(resourceBrowser, resourceId);
}

export function clickOnElementInResourceBrowser(
  screen: Screen,
  resourceId: string
): void {
  fireEvent.click(getElementInResourceBrowser(screen, resourceId));
}

export function expectResourceBrowserIsNotShown(screen: Screen): void {
  expect(screen.queryByText('/')).toBeNull();
}

export function clickAddIconOnCardInAttributionList(
  screen: Screen,
  value: string
): void {
  fireEvent.click(getByTitle(getCardInAttributionList(screen, value), 'add'));
}

export function clickOnCardInAddToAttributionList(
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
    getByTitle(getCardInAttributionList(screen, value), 'add')
  ).toHaveStyle('visibility: hidden');
}

export function expectAddIconInAddToAttributionCardIsNotHidden(
  screen: Screen,
  value: string
): void {
  expect(
    getByTitle(getCardInAttributionList(screen, value), 'add')
  ).not.toHaveStyle('visibility: hidden');
}

export function getCardInAttributionList(
  screen: Screen,
  value: string
): HTMLElement {
  const card = (screen.getByText(value).parentElement as HTMLElement)
    .parentElement as HTMLElement;
  expect(card).not.toBeFalsy();

  return card as HTMLElement;
}

export function goToView(screen: Screen, view: string): void {
  fireEvent.click(screen.getByText(view) as Element);
}

export function clickOnOpenFileIcon(screen: Screen): void {
  fireEvent.click(getOpenFileIcon(screen));
}

export function getOpenFileIcon(screen: Screen): HTMLElement {
  return screen.getByLabelText('open file');
}

export function expectUnsavedChangesPopupIsShown(screen: Screen): void {
  expect(screen.getByText('Warning'));
  expect(screen.getByText('There are unsaved changes.'));
}

export function expectUnsavedChangesPopupIsNotShown(screen: Screen): void {
  expect(screen.queryByText('Warning')).toBeNull();
}

export function expectReplaceAttributionPopupIsShown(screen: Screen): void {
  expect(screen.getByText('This removes the following attribution'));
}

export function expectReplaceAttributionPopupIsNotShown(screen: Screen): void {
  expect(
    screen.queryByText('This removes the following attribution')
  ).toBeFalsy();
}

export function expectValueInAddToAttributionList(
  screen: Screen,
  value: string
): void {
  const addToAttributionList = (
    (
      (
        (screen.getAllByLabelText(/add/)[0].parentElement as HTMLElement)
          .parentElement as HTMLElement
      ).parentElement as HTMLElement
    ).parentElement as HTMLElement
  ).parentElement as HTMLElement;
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
    (screen.getAllByLabelText(/add/)[0].parentElement as HTMLElement)
      .parentElement as HTMLElement
  ).parentElement as HTMLElement;
  expect(queryByText(addToAttributionList, value)).toBeNull();
}

export function selectConfidenceInDropdown(
  screen: Screen,
  value: string
): void {
  expect(screen.queryByText(value)).toBeFalsy();
  fireEvent.mouseDown(screen.getByLabelText('Confidence'));
  const listbox = within(screen.getByRole('listbox'));
  fireEvent.click(listbox.getByText(value));
}

export function clickAddNewAttributionButton(screen: Screen): void {
  fireEvent.click(screen.getByText('Add new attribution') as Element);
}

export function clickOnEditIconForElement(
  screen: Screen,
  element: string
): void {
  fireEvent.click(screen.getByLabelText(`edit ${element}`) as Element);
}

export function clickOnProgressBar(screen: Screen): void {
  fireEvent.click(screen.getByLabelText('ProgressBar') as Element);
}

export function clickOnCheckbox(screen: Screen, label: string): void {
  fireEvent.click(
    screen.getByRole('checkbox', { name: `checkbox ${label}` }) as Element
  );
}

export function expectErrorPopupIsShown(screen: Screen): void {
  expect(screen.getByText('Unable to save.'));
}

export function expectErrorPopupIsNotShown(screen: Screen): void {
  expect(screen.queryByText('Unable to save.')).toBeFalsy();
}

export function expectElementsInAutoCompleteAndSelectFirst(
  screen: Screen,
  elements: Array<string>
): void {
  const autoComplete = screen.getByRole('combobox');
  autoComplete.focus();
  fireEvent.keyDown(autoComplete, { key: 'ArrowDown' });

  elements.forEach((element) => expect(screen.getByText(element)));

  fireEvent.click(screen.getByText(elements[0]) as Element);
}

export function expectValuesInProgressbarTooltip(
  screen: Screen,
  numberOfFiles: number,
  filesWithAttribution: number,
  filesWithOnlyPreSelectedAttributions: number,
  filesWithOnlySignals: number
): void {
  (global as typeof globalThis).document.createRange = (): Range =>
    ({
      setStart: (): void => {},
      setEnd: (): void => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
    } as unknown as Range);
  jest.useFakeTimers();
  const progressBar = screen.getByLabelText('ProgressBar');
  fireEvent.mouseOver(progressBar);
  act(() => {
    jest.runAllTimers();
  });
  expect(
    screen.getByText(new RegExp(`Number of files: ${numberOfFiles}`))
  ).toBeDefined();
  expect(
    screen.getByText(
      new RegExp(`Files with attributions: ${filesWithAttribution}`)
    ) &&
      screen.getByText(
        new RegExp(
          `Files with only pre-selected attributions: ${filesWithOnlyPreSelectedAttributions}`
        )
      ) &&
      screen.getByText(
        new RegExp(`Files with only signals: ${filesWithOnlySignals}`)
      )
  ).toBeDefined();
}

export function getGoToLinkButton(screen: Screen): HTMLElement {
  return screen.getByLabelText('open link in browser');
}

export function expectGoToLinkButtonIsVisible(screen: Screen): void {
  expect(getGoToLinkButton(screen)).toBeVisible();
}

export function expectGoToLinkButtonIsNotVisible(screen: Screen): void {
  expect(getGoToLinkButton(screen)).not.toBeVisible();
}

export function clickGoToLinkButton(screen: Screen): void {
  fireEvent.click(getGoToLinkButton(screen));
}
