// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { renderHook, waitFor } from '@testing-library/react';

import {
  getLinkedResourcesPanelState,
  useLinkedResourcesPanelState,
} from '../use-linked-resources-panel-state';

const mocks = vi.hoisted(() => ({
  attribution: {
    isError: false,
    isPending: false,
    packageInfo: undefined as { id: string } | undefined,
  },
  query: {
    data: undefined as typeof treeState | undefined,
    isError: false,
    isLoading: true,
  },
  selectedAttributionId: 'A',
}));

vi.mock('../../../state/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      resourceState: {
        selectedAttributionId: mocks.selectedAttributionId,
        selectedResourceId: '',
        attributionSelectionPendingResourceId: null,
      },
    }),
}));
vi.mock('../../../util/use-selected-attribution', () => ({
  useSelectedAttribution: () => mocks.attribution,
}));
vi.mock('../LinkedResourcesTree/useLinkedResourcesTreeState', () => ({
  useLinkedResourcesTree: () => mocks.query,
}));

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
    ).toEqual({
      isHidden: true,
      isIndicatorVisible: false,
      isLoading: false,
      isSearchApplied: false,
      treeState: undefined,
    });
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
    ).toEqual({
      isHidden: false,
      isIndicatorVisible: false,
      isLoading: true,
      isSearchApplied: false,
      treeState: undefined,
    });
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
    ).toEqual({
      isHidden: false,
      isIndicatorVisible: false,
      isLoading: true,
      isSearchApplied: false,
      treeState: undefined,
    });
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
    ).toEqual({
      isHidden: true,
      isIndicatorVisible: false,
      isLoading: false,
      isSearchApplied: false,
      treeState: undefined,
    });
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
    ).toEqual({
      isHidden: true,
      isIndicatorVisible: false,
      isLoading: false,
      isSearchApplied: false,
      treeState: undefined,
    });
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
    ).toEqual({
      isHidden: false,
      isIndicatorVisible: false,
      isLoading: false,
      isSearchApplied: false,
      treeState,
    });
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
    ).toEqual({
      isHidden: false,
      isIndicatorVisible: false,
      isLoading: false,
      isSearchApplied: true,
      treeState,
    });
  });
});

describe('useLinkedResourcesPanelState', () => {
  beforeEach(() => {
    mocks.attribution = {
      isError: false,
      isPending: false,
      packageInfo: { id: 'A' },
    };
    mocks.query = { data: treeState, isError: false, isLoading: false };
    mocks.selectedAttributionId = 'A';
    vi.useRealTimers();
  });

  it('retains A through B loading and commits B tree and counts together', async () => {
    const { result, rerender } = renderHook(() =>
      useLinkedResourcesPanelState(),
    );
    await waitFor(() => expect(result.current.treeState).toBe(treeState));

    const bTree = { ...treeState, count: 7 };
    mocks.selectedAttributionId = 'B';
    mocks.attribution = {
      isError: false,
      isPending: true,
      packageInfo: undefined,
    };
    mocks.query = { data: undefined, isError: false, isLoading: true };
    rerender();
    expect(result.current.treeState).toBe(treeState);
    expect(result.current.isLoading).toBe(true);

    mocks.attribution = {
      isError: false,
      isPending: false,
      packageInfo: { id: 'B' },
    };
    mocks.query = { data: bTree, isError: false, isLoading: false };
    rerender();
    await waitFor(() => expect(result.current.treeState).toBe(bTree));
    expect(result.current.treeState?.count).toBe(7);
  });

  it('does not publish a late B response while C is pending', async () => {
    const { result, rerender } = renderHook(() =>
      useLinkedResourcesPanelState(),
    );
    await waitFor(() => expect(result.current.treeState).toBe(treeState));

    mocks.selectedAttributionId = 'B';
    mocks.attribution = {
      isError: false,
      isPending: true,
      packageInfo: undefined,
    };
    mocks.query = { data: undefined, isError: false, isLoading: true };
    rerender();
    const lateB = { ...treeState, count: 2 };
    mocks.selectedAttributionId = 'C';
    mocks.attribution = {
      isError: false,
      isPending: true,
      packageInfo: undefined,
    };
    mocks.query = { data: lateB, isError: false, isLoading: true };
    rerender();
    expect(result.current.treeState).toBe(treeState);

    const cTree = { ...treeState, count: 3 };
    mocks.attribution = {
      isError: false,
      isPending: false,
      packageInfo: { id: 'C' },
    };
    mocks.query = { data: cTree, isError: false, isLoading: false };
    rerender();
    await waitFor(() => expect(result.current.treeState).toBe(cTree));
  });

  it('commits an empty result as a completed tree state', async () => {
    const { result, rerender } = renderHook(() =>
      useLinkedResourcesPanelState(),
    );
    await waitFor(() => expect(result.current.treeState).toBe(treeState));
    const emptyTree = { ...treeState, count: 0, treeNodes: [] };
    mocks.selectedAttributionId = 'B';
    mocks.attribution = {
      isError: false,
      isPending: false,
      packageInfo: { id: 'B' },
    };
    mocks.query = { data: emptyTree, isError: false, isLoading: false };
    rerender();
    await waitFor(() => expect(result.current.treeState).toBe(emptyTree));
    expect(result.current.isHidden).toBe(false);
    expect(result.current.treeState?.count).toBe(0);
  });
});
