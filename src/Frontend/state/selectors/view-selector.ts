// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { FilterType, PopupType, View } from '../../enums/enums';
import { State } from '../../types/types';

export function isAttributionViewSelected(state: State): boolean {
  return state.viewState.view === View.Attribution;
}

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
  return state.viewState.popupInfo?.popup || null;
}

export function getActiveFilters(state: State): Set<FilterType> {
  return state.viewState.activeFilters;
}

export function getPopupAttributionId(state: State): string | null {
  return state.viewState.popupInfo?.attributionId || null;
}
