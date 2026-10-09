// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { OpossumColors } from '../../../Frontend/shared-styles';
import type { RawPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';

export type PanelTestId =
  'signals-panel' | 'attributions-panel' | 'linked-resources-tree';

export type AttributionRelation =
  'resource' | 'children' | 'parents' | 'unrelated';

const SETTLED_TIMEOUT = { timeout: 10000 } as const;

function cardLabel(packageInfo: RawPackageInfo): string {
  if (packageInfo.firstParty) {
    return text.packageLists.firstParty;
  }
  return packageInfo.packageVersion
    ? `${packageInfo.packageName}, ${packageInfo.packageVersion}`
    : `${packageInfo.packageName}`;
}

function cardLabelText(packageInfo: RawPackageInfo): string {
  return `package card ${cardLabel(packageInfo)}`;
}

function getPanel(panelTestId: PanelTestId): HTMLElement {
  return screen.getByTestId(panelTestId);
}

function getPackageCard(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): HTMLElement {
  return within(getPanel(panelTestId)).getByLabelText(
    cardLabelText(packageInfo),
  );
}

function getPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): HTMLElement {
  return within(getPackageCard(panelTestId, packageInfo)).getByRole('checkbox');
}

export async function expectPackageCards(
  panelTestId: PanelTestId,
  visible: Array<RawPackageInfo>,
  hidden: Array<RawPackageInfo> = [],
): Promise<void> {
  for (const packageInfo of visible) {
    await waitFor(() => {
      expect(getPackageCard(panelTestId, packageInfo)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const packageInfo of hidden) {
    await waitFor(() => {
      expectCardAbsentOrHidden(panelTestId, packageInfo);
    }, SETTLED_TIMEOUT);
  }
}

function expectCardAbsentOrHidden(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): void {
  const card = within(getPanel(panelTestId)).queryByLabelText(
    cardLabelText(packageInfo),
  );
  if (card) {
    expect(card).not.toBeVisible();
  } else {
    expect(card).toBeNull();
  }
}

export async function clickPackageCard(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): Promise<void> {
  const card = getPackageCard(panelTestId, packageInfo);
  await userEvent.click(
    within(card).getByText(cardLabel(packageInfo), { exact: true }),
  );
}

export async function clickPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): Promise<void> {
  await userEvent.click(getPackageCardCheckbox(panelTestId, packageInfo));
}

export async function expectPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
  checked: boolean,
): Promise<void> {
  const assertion = checked ? jestExpectChecked : jestExpectUnchecked;
  await waitFor(() => {
    assertion(getPackageCardCheckbox(panelTestId, packageInfo));
  }, SETTLED_TIMEOUT);
}

function jestExpectChecked(checkbox: HTMLElement): void {
  expect(checkbox).toBeChecked();
}

function jestExpectUnchecked(checkbox: HTMLElement): void {
  expect(checkbox).not.toBeChecked();
}

export async function clickSelectAllCheckbox(
  panelTestId: PanelTestId,
): Promise<void> {
  await userEvent.click(
    within(getPanel(panelTestId)).getByRole('checkbox', {
      name: /select all/i,
    }),
  );
}

function getRelationTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): HTMLElement {
  return within(getPanel(panelTestId)).getByRole('tab', {
    name: new RegExp(`^${text.relations[relation]}`),
  });
}

export async function expectSelectedTabIs(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): Promise<void> {
  await waitFor(() => {
    expect(getRelationTab(panelTestId, relation)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }, SETTLED_TIMEOUT);
}

export async function selectTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): Promise<void> {
  await userEvent.click(getRelationTab(panelTestId, relation));
}

function queryRelationTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): HTMLElement | null {
  return within(getPanel(panelTestId)).queryByRole('tab', {
    name: new RegExp(`^${text.relations[relation]}`),
  });
}

export async function expectTabVisibility(
  panelTestId: PanelTestId,
  visible: Array<AttributionRelation>,
  hidden: Array<AttributionRelation> = [],
): Promise<void> {
  for (const relation of visible) {
    await waitFor(() => {
      expect(queryRelationTab(panelTestId, relation)).not.toBeNull();
    }, SETTLED_TIMEOUT);
  }
  for (const relation of hidden) {
    await waitFor(() => {
      expect(queryRelationTab(panelTestId, relation)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

const RESOURCES_TREE_TEST_ID = 'resources-tree';

export function resourceTreeItem(name: string): HTMLElement {
  return within(screen.getByTestId(RESOURCES_TREE_TEST_ID)).getByRole(
    'treeitem',
    { name },
  );
}

export async function expectResourceVisibility(
  visible: Array<string>,
  hidden: Array<string> = [],
  treeTestId: string = RESOURCES_TREE_TEST_ID,
): Promise<void> {
  for (const name of visible) {
    await waitFor(() => {
      expect(
        within(screen.getByTestId(treeTestId)).getByRole('treeitem', { name }),
      ).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const name of hidden) {
    await waitFor(() => {
      expect(
        within(screen.getByTestId(treeTestId)).queryByRole('treeitem', {
          name,
        }),
      ).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

export async function gotoResource(...names: Array<string>): Promise<void> {
  for (const name of names) {
    await waitFor(() => {
      expect(resourceTreeItem(name)).toBeVisible();
    }, SETTLED_TIMEOUT);
    await userEvent.click(resourceTreeItem(name));
    await waitFor(() => {
      expect(resourceTreeItem(name)).toHaveAttribute('aria-selected', 'true');
    }, SETTLED_TIMEOUT);
    await expectPanelsSettled();
  }
}

const PANELS_WITH_LOADING_INDICATORS = [
  'signals-panel',
  'attributions-panel',
] as const;
const ATTRIBUTION_DETAILS_LOADING_TEST_ID = 'attribution-details-loading';

async function expectPanelsSettled(): Promise<void> {
  await waitFor(() => {
    for (const panelTestId of PANELS_WITH_LOADING_INDICATORS) {
      const panel = screen.queryByTestId(panelTestId);
      if (panel) {
        expect(within(panel).queryByTestId('loading')).toBeNull();
      }
    }
    expect(
      screen.queryByTestId(ATTRIBUTION_DETAILS_LOADING_TEST_ID),
    ).toBeNull();
  }, SETTLED_TIMEOUT);
}

export type AttributionColumnField =
  | 'name'
  | 'packageType'
  | 'namespace'
  | 'version'
  | 'purl'
  | 'url'
  | 'comment'
  | 'copyright'
  | 'licenseExpression';

const FIELD_LABELS: Record<AttributionColumnField, string> = {
  name: text.attributionColumn.packageName,
  packageType: text.attributionColumn.packageType,
  namespace: text.attributionColumn.packageNamespace,
  version: text.attributionColumn.packageVersion,
  purl: text.attributionColumn.purl,
  url: text.attributionColumn.upstreamAddress,
  comment: text.diffPopup.comment,
  copyright: text.diffPopup.copyright,
  licenseExpression: text.attributionColumn.licenseExpression,
};

function getAttributionColumn(): HTMLElement {
  return screen.getByLabelText('attribution column');
}

function queryFormField(
  field: AttributionColumnField,
): HTMLInputElement | null {
  return within(getAttributionColumn()).queryByLabelText<HTMLInputElement>(
    FIELD_LABELS[field],
    { exact: true },
  );
}

function getFormField(field: AttributionColumnField): HTMLElement {
  return within(getAttributionColumn()).getByLabelText(FIELD_LABELS[field], {
    exact: true,
  });
}

export function fillFormField(
  field: AttributionColumnField,
  value: string,
): void {
  // Playwright's fill() equivalent: the e2e page object set form values
  // directly rather than typing them character by character.
  const formField = getFormField(field) as HTMLInputElement;
  fireEvent.change(formField, { target: { value } });
}

export async function clickFormField(
  field: AttributionColumnField,
): Promise<void> {
  await userEvent.click(getFormField(field));
}

export async function expectFormFieldValues(
  values: Partial<Record<AttributionColumnField, string | null>>,
): Promise<void> {
  for (const [field, value] of Object.entries(values) as Array<
    [AttributionColumnField, string | null]
  >) {
    await waitFor(() => {
      const input = queryFormField(field);
      if (value === null) {
        expect(input === null || !isNodeVisible(input)).toBe(true);
      } else {
        expect(input).not.toBeNull();
        expect(input).toHaveValue(value);
      }
    }, SETTLED_TIMEOUT);
  }
}

function isNodeVisible(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function getAttributionTypeGroup(): HTMLElement {
  return within(getAttributionColumn()).getByRole('group', {
    name: text.diffPopup.attributionType,
  });
}

function getAttributionTypeButton(
  type: 'First Party' | 'Third Party',
): HTMLElement {
  return within(getAttributionTypeGroup()).getByRole('button', {
    name: type,
  });
}

export async function clickAttributionTypeButton(
  type: 'First Party' | 'Third Party',
): Promise<void> {
  await userEvent.click(getAttributionTypeButton(type));
}

export async function expectAttributionTypePressed(
  type: 'First Party' | 'Third Party',
): Promise<void> {
  await waitFor(() => {
    expect(getAttributionTypeButton(type)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }, SETTLED_TIMEOUT);
}

export async function expectAttributionFormIsEmpty(): Promise<void> {
  await expectFormFieldValues({
    name: '',
    version: '',
    purl: '',
    url: '',
    comment: '',
  });
  await expectAttributionTypePressed('Third Party');
}

export async function expectAttributionSaveButtonIsEnabled(
  enabled: boolean = true,
): Promise<void> {
  const button = within(getAttributionColumn()).getByRole('button', {
    name: BUTTON_LABELS.save,
  });
  await waitFor(() => {
    if (enabled) {
      expect(button).toBeEnabled();
    } else {
      expect(button).toBeDisabled();
    }
  }, SETTLED_TIMEOUT);
}

export async function clickLicenseOption(fullName: string): Promise<void> {
  await userEvent.click(await screen.findByText(fullName));
}

const FIXTURE_FIELD_KEYS: Partial<
  Record<AttributionColumnField, keyof RawPackageInfo>
> = {
  name: 'packageName',
  packageType: 'packageType',
  namespace: 'packageNamespace',
  version: 'packageVersion',
  url: 'url',
  comment: 'comment',
  copyright: 'copyright',
  licenseExpression: 'licenseName',
};

export async function expectAttributionFormMatchesPackageInfo(
  packageInfo: RawPackageInfo,
): Promise<void> {
  const checkedFields = Object.keys(
    FIXTURE_FIELD_KEYS,
  ) as Array<AttributionColumnField>;
  for (const field of checkedFields) {
    const fixtureKey = FIXTURE_FIELD_KEYS[field];
    const value = fixtureKey ? packageInfo[fixtureKey] : undefined;
    if (typeof value !== 'string') {
      if (
        packageInfo.firstParty &&
        (field === 'copyright' || field === 'licenseExpression')
      ) {
        await expectFormFieldValues({ [field]: null });
      }
      continue;
    }
    await expectFormFieldValues({
      [field]:
        packageInfo.firstParty &&
        (field === 'copyright' || field === 'licenseExpression')
          ? null
          : value,
    });
  }
  await expectAttributionTypePressed(
    packageInfo.firstParty ? 'First Party' : 'Third Party',
  );
}

export type AttributionColumnButton =
  | 'confirm'
  | 'delete'
  | 'restore'
  | 'save'
  | 'revert'
  | 'link'
  | 'replace'
  | 'cancel'
  | 'compare';

const BUTTON_LABELS: Record<AttributionColumnButton, string> = {
  confirm: text.attributionColumn.confirm,
  delete: text.attributionColumn.delete,
  restore: text.attributionColumn.restore,
  save: text.attributionColumn.save,
  revert: text.attributionColumn.revert,
  link: text.attributionColumn.link,
  replace: text.attributionColumn.replace,
  cancel: text.buttons.cancel,
  compare: text.attributionColumn.compareToOriginal,
};

function queryAttributionColumnButton(
  button: AttributionColumnButton,
): HTMLElement | null {
  return within(getAttributionColumn()).queryByRole('button', {
    name: BUTTON_LABELS[button],
  });
}

export async function clickAttributionColumnButton(
  button: AttributionColumnButton,
): Promise<void> {
  const buttonNode = queryAttributionColumnButton(button);
  expect(buttonNode).not.toBeNull();
  if (buttonNode) {
    await userEvent.click(buttonNode);
  }
}

export async function expectAttributionColumnButtonVisibility(
  button: AttributionColumnButton,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const node = queryAttributionColumnButton(button);
    if (node === null) {
      expect(visible).toBe(false);
    } else {
      expect(node).toBeVisible();
    }
  }, SETTLED_TIMEOUT);
}

async function expectAttributionColumnDirty(dirty: boolean): Promise<void> {
  await waitFor(() => {
    expect(getAttributionColumn()).toHaveAttribute(
      'data-dirty',
      dirty ? 'true' : 'false',
    );
  }, SETTLED_TIMEOUT);
}

export async function saveChangesInAttributionColumn(): Promise<void> {
  await expectAttributionColumnDirty(true);
  await clickAttributionColumnButton('save');
  await expectAttributionColumnDirty(false);
}

async function getPopup(popupLabel: string): Promise<HTMLElement> {
  return screen.findByLabelText(
    popupLabel,
    {},
    { timeout: SETTLED_TIMEOUT.timeout },
  );
}

export async function expectPopupHidden(popupLabel: string): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByLabelText(popupLabel)).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function expectPopupHasText(
  popupLabel: string,
  expectedText: string,
): Promise<void> {
  await waitFor(() => {
    const popup = screen.queryByLabelText(popupLabel);
    expect(popup).not.toBeNull();
    expect(
      within(popup as HTMLElement).getByText(expectedText, { exact: false }),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

function isNodeEnabled(node: HTMLElement): boolean {
  return !(
    node.hasAttribute('disabled') ||
    node.getAttribute('aria-disabled') === 'true'
  );
}

export async function clickPopupButton(
  popupLabel: string,
  buttonName: string,
): Promise<void> {
  const popup = await getPopup(popupLabel);
  await userEvent.click(
    await waitFor(() => {
      const button = within(popup).getByRole('button', {
        name: buttonName,
      });
      if (!isNodeEnabled(button)) {
        throw new Error(`Button '${buttonName}' still disabled`);
      }
      return button;
    }, SETTLED_TIMEOUT),
  );
}

export async function clickPanelButton(
  panelTestId: PanelTestId,
  buttonLabel: string,
): Promise<void> {
  await userEvent.click(
    within(getPanel(panelTestId)).getByRole('button', {
      name: buttonLabel,
    }),
  );
}

function getPanelButtonDisabledState(
  panelTestId: PanelTestId,
  buttonLabel: string,
): boolean {
  const button = within(getPanel(panelTestId)).getByRole('button', {
    name: buttonLabel,
  });
  return !isNodeEnabled(button);
}

export async function expectPanelButtonEnabled(
  panelTestId: PanelTestId,
  buttonLabel: string,
  enabled: boolean,
): Promise<void> {
  await waitFor(() => {
    expect(getPanelButtonDisabledState(panelTestId, buttonLabel)).toBe(
      !enabled,
    );
  }, SETTLED_TIMEOUT);
}

const LINKED_RESOURCES_TREE_TEST_ID = 'linked-resources-tree';

export async function expectLinkedResourcesTreeVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    if (visible) {
      expect(screen.getByTestId(LINKED_RESOURCES_TREE_TEST_ID)).toBeVisible();
    } else {
      expect(screen.queryByTestId(LINKED_RESOURCES_TREE_TEST_ID)).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

const PATH_BAR_LABEL = 'path bar';

function getPathBar(): HTMLElement {
  return screen.getByLabelText(PATH_BAR_LABEL);
}

export async function expectPathBarHistoryButton(
  button: 'go back' | 'go forward',
  enabled: boolean,
): Promise<void> {
  await waitFor(() => {
    // The aria-label sits on the icon svg inside the IconButton (as in the
    // Playwright page object), so walk up to the actual button node.
    const icon = within(getPathBar()).getByLabelText(button);
    const pathBarButton = icon.closest('button') as HTMLElement | null;
    expect(pathBarButton).not.toBeNull();
    expect(isNodeEnabled(pathBarButton!)).toBe(enabled);
  }, SETTLED_TIMEOUT);
}

export async function clickPathBarHistoryButton(
  button: 'go back' | 'go forward',
): Promise<void> {
  const icon = within(getPathBar()).getByLabelText(button);
  await userEvent.click(icon.closest('button') as HTMLElement);
}

export async function expectPathBarCrumbs(
  visible: Array<string>,
  hidden: Array<string> = [],
): Promise<void> {
  for (const crumb of visible) {
    await waitFor(() => {
      expect(within(getPathBar()).getByText(crumb)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const crumb of hidden) {
    await waitFor(() => {
      expect(within(getPathBar()).queryByText(crumb)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

export async function clickPathBarBreadcrumb(crumb: string): Promise<void> {
  await userEvent.click(within(getPathBar()).getByText(crumb));
}

export async function gotoResourceTreeRoot(): Promise<void> {
  await userEvent.click(
    within(getPathBar()).getByText('Home', { exact: true }),
  );
  await waitFor(() => {
    expect(
      within(getPathBar())
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home']);
  }, SETTLED_TIMEOUT);
  await expectPanelsSettled();
}

const TOP_BAR_LABEL = 'top bar';

function getTopBar(): HTMLElement {
  return screen.getByLabelText(TOP_BAR_LABEL);
}

export async function gotoReportView(): Promise<void> {
  await userEvent.click(
    within(getTopBar()).getByRole('button', { name: text.topBar.report }),
  );
  await expectViewIsActive('report');
}

export async function expectViewIsActive(
  view: 'audit' | 'report',
): Promise<void> {
  await waitFor(() => {
    const viewActiveButtonName =
      view === 'audit' ? text.topBar.audit : text.topBar.report;
    const viewInactiveButtonName =
      view === 'audit' ? text.topBar.report : text.topBar.audit;
    expect(
      within(getTopBar()).getByRole('button', { name: viewActiveButtonName }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(getTopBar()).getByRole('button', { name: viewActiveButtonName }),
    ).toBeDisabled();
    expect(
      within(getTopBar()).getByRole('button', {
        name: viewInactiveButtonName,
      }),
    ).toHaveAttribute('aria-pressed', 'false');
  }, SETTLED_TIMEOUT);
}

export async function expectOpenFileButtonVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const button = within(getTopBar()).queryByRole('button', {
      name: 'open file',
    });
    if (button === null) {
      expect(visible).toBe(false);
    } else {
      expect(button).toBeVisible();
    }
  }, SETTLED_TIMEOUT);
}

export async function clickProgressBar(): Promise<void> {
  const progressBar = await waitFor(
    () => screen.getByTestId('progress-bar'),
    SETTLED_TIMEOUT,
  );
  await userEvent.click(progressBar);
}

function getTreeItem(treeTestId: string, name: string): HTMLElement {
  return within(screen.getByTestId(treeTestId)).getByRole('treeitem', {
    name,
  });
}

export async function gotoResourceInOtherTree(
  treeTestId: string,
  name: string,
): Promise<void> {
  await waitFor(() => {
    expect(getTreeItem(treeTestId, name)).toBeVisible();
  }, SETTLED_TIMEOUT);
  await userEvent.click(getTreeItem(treeTestId, name));
  await waitFor(() => {
    expect(getTreeItem(treeTestId, name)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }, SETTLED_TIMEOUT);
  await expectPanelsSettled();
}

export function focusResourceTreeItem(name: string): void {
  getTreeItem(RESOURCES_TREE_TEST_ID, name).focus();
}

function resourceTreeItemAtPath(path: string): HTMLElement | null {
  return screen
    .getByTestId(RESOURCES_TREE_TEST_ID)
    .querySelector<HTMLElement>(`[data-resource-path="${path}"]`);
}

export async function expectResourceAtPathVisibility(
  visible: Array<string>,
  hidden: Array<string> = [],
): Promise<void> {
  for (const path of visible) {
    await waitFor(() => {
      expect(resourceTreeItemAtPath(path)).not.toBeNull();
      expectIsVisible(resourceTreeItemAtPath(path) as HTMLElement);
    }, SETTLED_TIMEOUT);
  }
  for (const path of hidden) {
    await waitFor(() => {
      expect(resourceTreeItemAtPath(path)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

function expectIsVisible(node: HTMLElement): void {
  expect(node).toBeVisible();
}

function getTreeHeader(headerTestId: string): HTMLElement {
  return screen.getByTestId(headerTestId);
}

export async function searchTree(
  value: string,
  headerTestId: string,
): Promise<void> {
  const searchField = within(getTreeHeader(headerTestId)).getByRole(
    'searchbox',
  );
  fillSearchField(searchField, value);
  await waitFor(() => {
    expect(getTreeHeader(headerTestId)).toHaveAttribute(
      'data-applied-search',
      value,
    );
  }, SETTLED_TIMEOUT);
}

function fillSearchField(searchField: HTMLElement, value: string): void {
  const input = searchField as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

export async function clearTreeSearch(headerTestId: string): Promise<void> {
  await userEvent.click(
    within(getTreeHeader(headerTestId)).getByLabelText('clear search'),
  );
  await waitFor(() => {
    expect(getTreeHeader(headerTestId)).toHaveAttribute(
      'data-applied-search',
      '',
    );
  }, SETTLED_TIMEOUT);
}

export async function expectTreeSearchFocused(
  headerTestId: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getTreeHeader(headerTestId)).getByRole('searchbox'),
    ).toHaveFocus();
  }, SETTLED_TIMEOUT);
}

function isApplePlatform(): boolean {
  return /mac|iphone|ipad|ipod/i.test(
    `${navigator.platform} ${navigator.userAgent}`,
  );
}

const MODIFIER = isApplePlatform() ? 'Meta' : 'Control';

export async function pressSearchShortcut(): Promise<void> {
  await userEvent.keyboard(`{${MODIFIER}>}f{/${MODIFIER}}`);
}

export async function pressGoBackShortcut(): Promise<void> {
  await userEvent.keyboard(`{${MODIFIER}>}{ArrowLeft}{/${MODIFIER}}`);
}

export async function pressGoForwardShortcut(): Promise<void> {
  await userEvent.keyboard(`{${MODIFIER}>}{ArrowRight}{/${MODIFIER}}`);
}

export async function expectTreeResourceCountIs(
  count: number,
  headerTestId: string = 'resources-tree-header',
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getTreeHeader(headerTestId)).getByText(
        `Resources (${count} / ${count})`,
        { exact: false },
      ),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

function normalizeColor(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

const HIGHLIGHT_COLOR = normalizeColor(OpossumColors.lightBlue);

export async function expectTreeItemHighlight(
  treeTestId: string,
  name: string,
  highlighted: boolean,
): Promise<void> {
  await waitFor(() => {
    const item = getTreeItem(treeTestId, name);
    const textNode = within(item).getByText(name);
    const labelBox = textNode.parentElement ?? textNode;
    if (highlighted) {
      expect(labelBox).toHaveStyle({ 'background-color': HIGHLIGHT_COLOR });
    } else {
      expect(labelBox).not.toHaveStyle({
        'background-color': HIGHLIGHT_COLOR,
      });
    }
  }, SETTLED_TIMEOUT);
}

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

const FILTER_MENU_LABELS = {
  needsFollowUp: text.filters.needsFollowUp,
  firstParty: text.filters.firstParty,
  thirdParty: text.filters.thirdParty,
  unreviewed: text.filters.unreviewed,
} as const;

type FilterMenuLabel = keyof typeof FILTER_MENU_LABELS;

export async function clickFilterMenuButton(
  container: HTMLElement,
): Promise<void> {
  await userEvent.click(
    within(container).getByRole('button', { name: 'filter button' }),
  );
}

const MENU_URL_OPTION_COUNT_SUFFIX = '( \\(\\d+\\))?$';

function menuNameMatcher(name: string | RegExp): RegExp {
  if (name instanceof RegExp) {
    return name;
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}${MENU_URL_OPTION_COUNT_SUFFIX}`);
}

export async function clickFilterMenuItem(
  name: string | RegExp,
): Promise<void> {
  await userEvent.click(
    screen.getByRole('menuitem', { name: menuNameMatcher(name) }),
  );
}

export async function closeFilterMenu(): Promise<void> {
  // Escape must be dispatched on the menu element itself, like the Playwright
  // page object does: after interacting with an autocomplete inside the menu,
  // document.activeElement may be outside the modal's key-handling subtree.
  const menu = screen.queryByRole('menu');
  if (menu) {
    menu.focus();
    await userEvent.keyboard('{Escape}');
  }
  await waitFor(() => {
    expect(screen.queryByRole('menu')).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function clickClearFiltersMenuItem(): Promise<void> {
  await clickFilterMenuItem(text.packageLists.clearFilters);
}

export async function selectFilterLicenseName(
  licenseName: string,
): Promise<void> {
  const licenseInput = await screen.findByLabelText('license names');
  fireEvent.change(licenseInput, { target: { value: licenseName } });
  await userEvent.click(
    await screen.findByRole('option', { name: licenseName }),
  );
}

export async function applyPanelFilter(
  panelTestId: PanelTestId,
  filter: FilterMenuLabel,
): Promise<void> {
  await clickFilterMenuButton(getPanel(panelTestId));
  await clickFilterMenuItem(FILTER_MENU_LABELS[filter]);
  await closeFilterMenu();
}

function getDiffPopup(): HTMLElement {
  return screen.getByLabelText(text.diffPopup.ariaLabel);
}

export async function expectDiffPopupVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    if (visible) {
      expect(getDiffPopup()).toBeVisible();
    } else {
      expect(screen.queryByLabelText(text.diffPopup.ariaLabel)).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

type DiffPopupSide = 'left' | 'right';

type DiffPopupLegalField = 'copyright' | 'licenseName' | 'licenseText';

async function expectDiffPopupFieldValue(
  side: DiffPopupSide,
  field: string,
  value: string | null,
): Promise<void> {
  await waitFor(() => {
    const fieldNode = within(getDiffPopup()).queryByTestId<HTMLInputElement>(
      `${side}-${field}`,
    );
    if (value === null) {
      expect(fieldNode === null || !isNodeVisibleInPopup(fieldNode)).toBe(true);
    } else {
      expect(fieldNode).not.toBeNull();
      expect(fieldNode).toHaveValue(value);
    }
  }, SETTLED_TIMEOUT);
}

function isNodeVisibleInPopup(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

export async function expectDiffPopupPackageName(
  side: DiffPopupSide,
  value: string,
): Promise<void> {
  await expectDiffPopupFieldValue(side, 'packageName', value);
}

export async function expectDiffPopupLegalField(
  side: DiffPopupSide,
  field: DiffPopupLegalField,
  value: string | null,
): Promise<void> {
  await expectDiffPopupFieldValue(side, field, value);
}

export async function expectDiffPopupLegalFieldsHidden(
  side: DiffPopupSide,
): Promise<void> {
  for (const field of [
    'copyright',
    'licenseName',
    'licenseText',
  ] as Array<DiffPopupLegalField>) {
    await expectDiffPopupFieldValue(side, field, null);
  }
}

export async function expectDiffPopupTitleIs(
  side: DiffPopupSide,
  title: string,
): Promise<void> {
  await waitFor(() => {
    const header = within(getDiffPopup()).getByTestId('comparison-header');
    const children = Array.from(header.children ?? []);
    expect(children.length).toBeGreaterThan(0);
    const content = (
      side === 'left' ? children[0] : children[children.length - 1]
    ).textContent;
    expect(content).toContain(title);
  }, SETTLED_TIMEOUT);
}

export async function expectDiffPopupFieldDirty(
  side: DiffPopupSide,
  field: string,
  dirty: boolean,
): Promise<void> {
  await waitFor(() => {
    const fieldContainer = within(getDiffPopup()).getByTestId(
      `${side}-${field}-field`,
    );
    expect(fieldContainer).toHaveAttribute(
      'data-dirty',
      dirty ? 'true' : 'false',
    );
  }, SETTLED_TIMEOUT);
}

function getDiffPopupTypeGroup(side: DiffPopupSide): HTMLElement {
  return within(getDiffPopup())
    .getByTestId(`${side}-firstParty-field`)
    .querySelector('[role="group"]') as HTMLElement;
}

export async function clickDiffPopupAttributionType(
  side: DiffPopupSide,
  type: 'First Party' | 'Third Party',
): Promise<void> {
  await userEvent.click(
    within(getDiffPopupTypeGroup(side)).getByRole('button', {
      name: type,
    }),
  );
}

export async function expectDiffPopupAttributionType(
  side: DiffPopupSide,
  type: 'First Party' | 'Third Party',
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getDiffPopupTypeGroup(side)).getByRole('button', {
        name: type,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  }, SETTLED_TIMEOUT);
}

export async function clickDiffPopupRestoreAttributionType(
  side: DiffPopupSide,
  originalType: 'First Party' | 'Third Party',
  itemLabel: string,
): Promise<void> {
  const popup = getDiffPopup();
  await userEvent.click(
    await waitFor(() => {
      const field = within(popup).getByTestId(`${side}-firstParty-field`);
      const restoreButton = within(field).getByRole('button', {
        name: text.diffPopup.restoreField(originalType, itemLabel),
      });
      if (!isNodeEnabled(restoreButton)) {
        throw new Error('Restore button still disabled');
      }
      return restoreButton;
    }, SETTLED_TIMEOUT),
  );
}

export async function clickDiffPopupLicenseTextToggle(
  side: DiffPopupSide,
): Promise<void> {
  await userEvent.click(
    within(
      within(getDiffPopup()).getByTestId(`${side}-licenseName-field`),
    ).getByRole('button', { name: 'license-text-toggle-button' }),
  );
}

export function fillDiffPopupField(
  side: DiffPopupSide,
  field: string,
  value: string,
): void {
  fireEvent.change(within(getDiffPopup()).getByTestId(`${side}-${field}`), {
    target: { value },
  });
}

export async function clickDiffPopupButton(
  button: 'cancel' | 'save',
): Promise<void> {
  const buttonName =
    button === 'cancel' ? text.buttons.cancel : text.diffPopup.saveChanges;
  await userEvent.click(
    within(getDiffPopup()).getByRole('button', { name: buttonName }),
  );
}

export async function expectDiffPopupSaveButtonEnabled(
  enabled: boolean,
): Promise<void> {
  await waitFor(() => {
    const saveButton = within(getDiffPopup()).getByRole('button', {
      name: text.diffPopup.saveChanges,
    });
    expect(isNodeEnabled(saveButton)).toBe(enabled);
  }, SETTLED_TIMEOUT);
}

export async function expectAttributionLicenseTextVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const licenseTextField = within(getAttributionColumn()).queryByLabelText(
      text.attributionColumn.licenseText,
    );
    if (licenseTextField === null) {
      expect(visible).toBe(false);
    } else {
      expect(licenseTextField).toBeVisible();
    }
  }, SETTLED_TIMEOUT);
}

export async function clickAttributionLicenseTextToggle(): Promise<void> {
  await userEvent.click(
    within(getAttributionColumn()).getByLabelText('license-text-toggle-button'),
  );
}

export async function expectAttributionFormLicenseText(
  value: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getAttributionColumn()).getByLabelText(
        text.attributionColumn.licenseText,
      ),
    ).toHaveValue(value);
  }, SETTLED_TIMEOUT);
}

export async function fillPanelSearch(
  headerTestId: string,
  value: string,
): Promise<void> {
  const searchField = within(screen.getByTestId(headerTestId)).getByRole(
    'searchbox',
  );
  await userEvent.type(searchField, value);
}

export async function clearPanelSearch(headerTestId: string): Promise<void> {
  await userEvent.click(
    within(screen.getByTestId(headerTestId)).getByLabelText('clear search'),
  );
}

const RESOURCES_TREE_HEADER_TEST_ID = 'resources-tree-header';

export async function clickTreeFilterMenuButton(): Promise<void> {
  const button = await waitFor(
    () =>
      within(screen.getByTestId(RESOURCES_TREE_HEADER_TEST_ID)).getByRole(
        'button',
        { name: 'filter button' },
      ),
    SETTLED_TIMEOUT,
  );
  await userEvent.click(button);
}

export async function expandTreeResourceAtPath(path: string): Promise<void> {
  await waitFor(() => {
    expect(resourceTreeItemAtPath(path)).not.toBeNull();
  }, SETTLED_TIMEOUT);
  const node = resourceTreeItemAtPath(path) as HTMLElement;
  const actualPath = node.getAttribute('data-resource-path');
  expect(actualPath).not.toBeNull();
  const collapsedControl = within(node).queryByLabelText(
    `expand ${actualPath}`,
  );
  if (collapsedControl) {
    await userEvent.click(collapsedControl);
  }
  await waitFor(() => {
    const updatedNode = resourceTreeItemAtPath(path);
    expect(updatedNode).not.toBeNull();
    expect(
      within(updatedNode as HTMLElement).queryByLabelText(
        `collapse ${actualPath}`,
      ),
    ).not.toBeNull();
  }, SETTLED_TIMEOUT);
}
