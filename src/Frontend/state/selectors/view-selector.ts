// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PopupType, View } from '../../enums/enums';
import { State } from '../../types/types';

export function isAuditViewSelected(state: State): boolean {
  return state.viewState.view === View.Audit;
}

export function isReportViewSelected(state: State): boolean {
  return state.viewState.view === View.Report;
}

export function getSelectedView(state: State): View {
  return state.viewState.view;
}

export function getTargetView(state: State): View | null {
  return state.viewState.targetView;
}

export function getOpenPopup(state: State): null | PopupType {
  const popup = state.viewState.popupInfo.slice(-1);

  return popup.length === 1 ? popup[0].popup : null;
}

export function getPopupAttributionId(state: State): string | null {
  const popup = state.viewState.popupInfo.slice(-1);

  return (popup.length === 1 && popup[0].attributionId) || null;
}

export function getOpenFileRequest(state: State): boolean {
  return state.viewState.openFileRequest;
}
