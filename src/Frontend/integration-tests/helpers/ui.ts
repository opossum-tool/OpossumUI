// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

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

async function expectFormFieldValues(
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
  return within(getAttributionColumn()).getByRole('group');
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

async function expectAttributionTypePressed(
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

export async function expectAttributionSaveButtonIsEnabled(): Promise<void> {
  const button = within(getAttributionColumn()).getByRole('button', {
    name: BUTTON_LABELS.save,
  });
  await waitFor(() => {
    expect(button).toBeEnabled();
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
  'confirm' | 'delete' | 'restore' | 'save' | 'revert';

const BUTTON_LABELS: Record<AttributionColumnButton, string> = {
  confirm: text.attributionColumn.confirm,
  delete: text.attributionColumn.delete,
  restore: text.attributionColumn.restore,
  save: text.attributionColumn.save,
  revert: text.attributionColumn.revert,
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
