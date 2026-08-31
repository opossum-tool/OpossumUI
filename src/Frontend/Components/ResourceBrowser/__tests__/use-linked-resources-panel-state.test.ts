// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getLinkedResourcesPanelState } from '../use-linked-resources-panel-state';

const treeState = {
  belowSelectedResource: undefined,
  count: 0,
  expandedIds: [],
  setExpandedIds: () => undefined,
  treeNodes: [],
};

describe('getLinkedResourcesPanelState', () => {
  it('hides the panel without a selected attribution', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: false,
        hasSelectedAttribution: false,
        isError: false,
        isLoading: false,
        treeState: undefined,
      }),
    ).toEqual({ isHidden: true, isLoading: false, treeState: undefined });
  });

  it('shows loading while attribution details are unavailable', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: false,
        hasSelectedAttribution: true,
        isError: false,
        isLoading: false,
        treeState: undefined,
      }),
    ).toEqual({ isHidden: false, isLoading: true, treeState: undefined });
  });

  it('returns loading while linked-resource queries are fetching', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: true,
        hasSelectedAttribution: true,
        isError: false,
        isLoading: true,
        treeState: undefined,
      }),
    ).toEqual({ isHidden: false, isLoading: true, treeState: undefined });
  });

  it('hides the panel when linked-resource data is unavailable after a failure', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: true,
        hasSelectedAttribution: true,
        isError: true,
        isLoading: false,
        treeState: undefined,
      }),
    ).toEqual({ isHidden: true, isLoading: false, treeState: undefined });
  });

  it('hides the panel when attribution details fail to load', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: false,
        hasSelectedAttribution: true,
        isError: true,
        isLoading: false,
        treeState: undefined,
      }),
    ).toEqual({ isHidden: true, isLoading: false, treeState: undefined });
  });

  it('keeps ready data available when a background refresh fails', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: true,
        hasSelectedAttribution: true,
        isError: true,
        isLoading: false,
        treeState,
      }),
    ).toEqual({ isHidden: false, isLoading: false, treeState });
  });

  it('returns ready data when linked-resource data is available', () => {
    expect(
      getLinkedResourcesPanelState({
        attributionDetailsReady: true,
        hasSelectedAttribution: true,
        isError: false,
        isLoading: false,
        treeState,
      }),
    ).toEqual({ isHidden: false, isLoading: false, treeState });
  });
});
