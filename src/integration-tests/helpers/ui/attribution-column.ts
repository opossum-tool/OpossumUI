// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import type { RawPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { isNodeEnabled, isNodeVisible, SETTLED_TIMEOUT } from './common';

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

export function clearFormField(field: AttributionColumnField): void {
  const formField = getFormField(field) as HTMLInputElement;
  fireEvent.change(formField, { target: { value: '' } });
}

export function fillAttributionLicenseText(value: string): void {
  const licenseTextField = within(
    getAttributionColumn(),
  ).getByLabelText<HTMLInputElement>(text.attributionColumn.licenseText);
  fireEvent.change(licenseTextField, { target: { value } });
}

export async function expectAttributionColumnButtonEnabled(
  button: AttributionColumnButton,
  enabled: boolean,
): Promise<void> {
  const buttonNode = queryAttributionColumnButton(button);
  expect(buttonNode).not.toBeNull();
  await waitFor(() => {
    if (enabled) {
      expect(isNodeEnabled(buttonNode!)).toBe(true);
    } else {
      expect(isNodeEnabled(buttonNode!)).toBe(false);
    }
  }, SETTLED_TIMEOUT);
}

async function expectAttributionFormConfidenceIs(
  attributionConfidence: number,
): Promise<void> {
  await waitFor(() => {
    const confidenceChip = within(getAttributionColumn()).getByTestId(
      'auditing-option-confidence',
    );
    expect(
      within(confidenceChip).getByLabelText(
        `confidence of ${Math.round((attributionConfidence / 100) * 5)}`,
      ),
    ).toHaveAttribute('aria-disabled', 'false');
  }, SETTLED_TIMEOUT);
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
  // The option's full-name text can also appear elsewhere in the DOM (e.g. the
  // form value); like the e2e page object, click the first DOM occurrence.
  const matches = await screen.findAllByText(fullName);
  await userEvent.click(matches[0]);
}

export async function selectLicenseExpressionOption(
  fullName: string,
): Promise<void> {
  // happy-dom never fires transitionend, so the Autocomplete popper stays
  // mounted with opacity 0 after an input change closed it; in that state a
  // click would re-close it instead of opening it. Toggle only when hidden.
  const listbox = screen.queryByRole('listbox');
  const isOpen = listbox !== null && parseFloat(listbox.style.opacity) !== 0;
  if (!isOpen) {
    await clickFormField('licenseExpression');
  }
  await clickLicenseOption(fullName);
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
  if (packageInfo.attributionConfidence) {
    await expectAttributionFormConfidenceIs(packageInfo.attributionConfidence);
  }
  if (packageInfo.licenseText) {
    await expectAttributionFormLicenseText(packageInfo.licenseText);
  }
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
  | 'compare'
  | 'compare-with'
  | 'compare-confirm';

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
  'compare-with': text.attributionColumn.compareWith,
  'compare-confirm': text.attributionColumn.compareConfirm,
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
  // The button may transiently unmount while surrounding actions settle;
  // wait for it like the Playwright locator does.
  const buttonNode = await waitFor(() => {
    const node = queryAttributionColumnButton(button);
    expect(node).not.toBeNull();
    return node!;
  }, SETTLED_TIMEOUT);
  await userEvent.click(buttonNode);
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

const VALIDATION_DISPLAY_TEST_ID = 'validation-display';

function getValidationDisplay(parentTestId: string): HTMLElement {
  const display = screen
    .getByTestId(parentTestId)
    .querySelector<HTMLElement>(
      `[data-testid="${VALIDATION_DISPLAY_TEST_ID}"]`,
    );
  expect(display).not.toBeNull();
  return display as HTMLElement;
}

export async function expectValidationMessage(
  parentTestId: string,
  message: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getValidationDisplay(parentTestId)).getByText(message, {
        exact: false,
      }),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectValidationDisplayHasNoMessages(
  parentTestId: string,
): Promise<void> {
  await waitFor(() => {
    const display = getValidationDisplay(parentTestId);
    // The MuiCollapse wrapper keeps aerial content mounted while collapsed, so
    // assert on the rendered text instead of element absence.
    const collapseRoot = display.closest('.MuiCollapse-root') as HTMLElement;
    expect(
      collapseRoot?.style.height === '0px' ||
        ((display.textContent ?? '').replace(/\s+/g, ' ').trim() === '' &&
          collapseRoot?.style.height !== undefined),
    ).toBe(true);
  }, SETTLED_TIMEOUT);
}

export async function clickValidationSuggestion(
  parentTestId: string,
  suggestionText: string,
): Promise<void> {
  await userEvent.click(
    within(getValidationDisplay(parentTestId)).getByText(suggestionText, {
      exact: true,
    }),
  );
}

export async function openAuditingOptionsMenu(): Promise<void> {
  await userEvent.click(
    within(getAttributionColumn()).getByText(text.auditingOptions.add),
  );
}

export async function closeAuditingOptionsMenu(): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('menu')).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function expectAuditingMenuOption(
  label: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const menu = screen.getByRole('menu');
    const option = within(menu).queryByText(label);
    if (visible) {
      expect(option).not.toBeNull();
      expect(option).toBeVisible();
    } else {
      expect(option).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function clickAuditingMenuOption(label: string): Promise<void> {
  const menu = screen.getByRole('menu');
  await userEvent.click(within(menu).getByText(label));
}

export async function expectAuditingOptionChip(
  optionId: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const chip = queryAuditingOptionChip(optionId);
    if (visible) {
      expect(chip).not.toBeNull();
      expect(chip).toBeVisible();
    } else {
      expect(chip).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function removeAuditingOption(optionId: string): Promise<void> {
  await userEvent.click(
    within(getAuditingOptionChip(optionId)).getByTestId('CancelIcon'),
  );
}

function queryAuditingOptionChip(optionId: string): HTMLElement | null {
  return within(getAttributionColumn()).queryByTestId(
    `auditing-option-${optionId}`,
  );
}

function getAuditingOptionChip(optionId: string): HTMLElement {
  const chip = queryAuditingOptionChip(optionId);
  expect(chip).not.toBeNull();
  return chip as HTMLElement;
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
