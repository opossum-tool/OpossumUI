// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../../shared/text';
import {
  clickAuditingMenuOption,
  closeAuditingOptionsMenu,
} from './attribution-column';
import { isNodeEnabled, isNodeVisible, SETTLED_TIMEOUT } from './common';

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
      expect(fieldNode === null || !isNodeVisible(fieldNode)).toBe(true);
    } else {
      expect(fieldNode).not.toBeNull();
      expect(fieldNode).toHaveValue(value);
    }
  }, SETTLED_TIMEOUT);
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

type EditableDiffPopupAuditingOption =
  'followUp' | 'needsReview' | 'excludedFromNotice';

const DIFF_POPUP_AUDITING_OPTION_IDS: Record<
  EditableDiffPopupAuditingOption,
  string
> = {
  followUp: 'follow-up',
  needsReview: 'needs-review',
  excludedFromNotice: 'excluded-from-notice',
};

export async function addDiffPopupAuditingOption(
  side: DiffPopupSide,
  option: EditableDiffPopupAuditingOption,
): Promise<void> {
  const auditingColumn = within(getDiffPopup()).getByTestId(
    `${side}-auditing-options`,
  );
  await userEvent.click(
    within(auditingColumn).getByText(text.auditingOptions.add),
  );
  await clickAuditingMenuOption(text.auditingOptions[option]);
  await closeAuditingOptionsMenu();
}

export async function expectDiffPopupAuditingOption(
  side: DiffPopupSide,
  option: EditableDiffPopupAuditingOption,
  visible: boolean = true,
): Promise<void> {
  await waitFor(() => {
    const auditingColumn = within(getDiffPopup()).queryByTestId(
      `${side}-auditing-options`,
    );
    const chip = auditingColumn
      ? within(auditingColumn).queryByTestId(
          `auditing-option-${DIFF_POPUP_AUDITING_OPTION_IDS[option]}`,
        )
      : null;
    if (visible) {
      expect(chip).not.toBeNull();
      expect(chip).toBeVisible();
    } else {
      expect(chip).toBeNull();
    }
  }, SETTLED_TIMEOUT);
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
