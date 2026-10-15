// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import type { UserSettings } from '../../../../shared/shared-types';
import type { RenderAppResult } from '../render-app';

export type PanelTestId =
  'signals-panel' | 'attributions-panel' | 'linked-resources-tree';

export const ATTRIBUTIONS_PANEL: PanelTestId = 'attributions-panel';
export const SIGNALS_PANEL: PanelTestId = 'signals-panel';
export const LINKED_RESOURCES_TREE: PanelTestId = 'linked-resources-tree';

export const SETTLED_TIMEOUT = { timeout: 10000 } as const;

export type SendToChannel = RenderAppResult['sendToChannel'];

export function getPanel(panelTestId: PanelTestId): HTMLElement {
  return screen.getByTestId(panelTestId);
}

export function isNodeVisible(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

export function isNodeEnabled(node: HTMLElement): boolean {
  return !(
    node.hasAttribute('disabled') ||
    node.getAttribute('aria-disabled') === 'true'
  );
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PANELS_WITH_LOADING_INDICATORS = [
  SIGNALS_PANEL,
  ATTRIBUTIONS_PANEL,
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

async function getPopup(popupLabel: string): Promise<HTMLElement> {
  return screen.findByLabelText(
    popupLabel,
    {},
    { timeout: SETTLED_TIMEOUT.timeout },
  );
}

export { expectPanelsSettled, getPopup };

export async function expectPopupHidden(popupLabel: string): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByLabelText(popupLabel)).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function expectPanelReplacementDimmed(
  panelTestId: PanelTestId,
  dimmed: boolean,
): Promise<void> {
  await waitFor(() => {
    const panel = getPanel(panelTestId);
    const opacity = window.getComputedStyle(panel).opacity;
    expect(Number(opacity)).toBe(dimmed ? 0.5 : 1);
  }, SETTLED_TIMEOUT);
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

export async function clickEnabledPanelButton(
  panelTestId: PanelTestId,
  buttonLabel: string,
): Promise<void> {
  // Panel action buttons disable while their selection summary loads (and
  // while a mutation is pending); wait for the enabled state before clicking,
  // like the Playwright click does.
  const button = await waitFor(() => {
    const buttonNode = within(getPanel(panelTestId)).getByRole('button', {
      name: buttonLabel,
    });
    if (!isNodeEnabled(buttonNode)) {
      throw new Error(`Panel button '${buttonLabel}' still disabled`);
    }
    return buttonNode;
  }, SETTLED_TIMEOUT);
  await userEvent.click(button);
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

const READONLY_INDICATOR_TEST_ID = 'readonly-indicator';

export function expectReadonlyIndicator(
  node: HTMLElement,
  readonly: boolean,
): void {
  const indicator = within(node).queryByTestId(READONLY_INDICATOR_TEST_ID);
  if (readonly) {
    expect(indicator).not.toBeNull();
    expect(indicator).toBeVisible();
  } else {
    expect(indicator === null || !isNodeVisible(indicator)).toBe(true);
  }
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

export function sendUserSettingsChange(
  sendToChannel: SendToChannel,
  settings: Partial<UserSettings>,
): void {
  // Menu toggles (QA mode, classifications, criticality) update the user
  // settings in the Electron main process, which broadcasts this exact IPC
  // channel to the renderer; simulate the broadcast instead of the menu.
  sendToChannel(AllowedFrontendChannels.UserSettingsChanged, settings);
}
