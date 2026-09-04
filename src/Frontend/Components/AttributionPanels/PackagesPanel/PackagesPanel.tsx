// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import { intersection, isEqual } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AttributionResultSetCriteria } from '../../../../shared/attribution-result-set';
import type {
  AttributionSelection,
  AttributionSelectionQuery,
} from '../../../../shared/attribution-selection';
import type { Attributions, Relation } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import {
  OpossumColors,
  PICKER_MODE_DISABLED_OPACITY,
} from '../../../shared-styles';
import { changeAttributionFiltersOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import {
  completeAttributionSelection,
  setPendingAttributionNavigation,
  setSelectedAttributionId,
  setTargetAttributionRelation,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { openResourceInResourceBrowser } from '../../../state/actions/resource-actions/navigation-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getPendingAttributionNavigation,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTargetAttributionRelation,
} from '../../../state/selectors/resource-selectors';
import type {
  AttributionFilters,
  UseAttributionFilters,
} from '../../../state/variables/use-filters';
import {
  type PickerMode,
  usePickerMode,
} from '../../../state/variables/use-picker-mode';
import { useUserSettings } from '../../../state/variables/use-user-setting';
import { backend, useDatabaseInitialized } from '../../../util/backendClient';
import { useAuditAttributionsList } from '../../../util/use-audit-attributions-list';
import { useFilterProperties } from '../../../util/use-filter-properties';
import { usePrevious } from '../../../util/use-previous';
import { useSelectedAttributionIsExternal } from '../../../util/use-selected-attribution';
import { useIsSelectedResourceReadonly } from '../../../util/use-selected-resource';
import { Checkbox } from '../../Checkbox/Checkbox';
import { FilterButton } from '../../FilterButton/FilterButton';
import { useAttributionFilterOptions } from '../../FilterButton/use-attribution-filter-options';
import { SortButton } from '../../SortButton/SortButton';
import type { AttributionFilterOption } from '../attribution-filter-options';
import {
  ActionBar,
  ActionBarContainer,
  ALERT_CONTAINER_HEIGHT,
  AlertContainer,
  ButtonGroup,
  Panel,
  Tab,
  Tabs,
  TABS_CONTAINER_HEIGHT,
} from './PackagesPanel.style';

export interface PackagesPanelChildrenProps {
  activeAttributionIds: Array<string> | null;
  activeRelation: Relation;
  attributionIds: Array<string> | null;
  attributions: Attributions | null;
  contentHeight: string;
  loading: boolean;
  loadingMore: boolean;
  loadMoreError: unknown;
  fetchNextPage: (requiredEndIndex?: number) => Promise<void>;
  selection: AttributionSelection;
  selectionSummary?: Awaited<
    ReturnType<typeof backend.getAttributionSelectionSummary.query>
  >;
  selectionSummaryLoading: boolean;
  toggleAttributionSelection: (id: string, selected: boolean) => void;
  isAttributionSelected: (id: string) => boolean;
  clearSelection: () => void;
  pickerMode: PickerMode;
  resultSetKey: string;
  selectedAttributionId: string;
  selectedAttributionIds: Array<string>;
  totalAttributionCount?: number;
}

export interface Alert {
  text: string;
  color: string;
  textColor?: string;
}

interface Props {
  external: boolean;
  alert?: Alert;
  filterOptions: Array<AttributionFilterOption>;
  children: (props: PackagesPanelChildrenProps) => React.ReactNode;
  useAttributionFilters: UseAttributionFilters;
  renderActions: (props: PackagesPanelChildrenProps) => React.ReactNode;
  testId?: string;
}

export const PackagesPanel = ({
  external,
  alert,
  filterOptions,
  children,
  renderActions,
  useAttributionFilters: useFilteredData,
  testId,
}: Props) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const pendingAttributionNavigation = useAppSelector(
    getPendingAttributionNavigation,
  );
  const selectedAttributionIsExternal = useSelectedAttributionIsExternal();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const targetAttributionRelation = useAppSelector(
    getTargetAttributionRelation,
  );
  const lastResourceIdWithAutoSelectionRef = useRef(selectedResourceId);
  const previousSelectedResourceId = usePrevious(selectedResourceId);

  const [bulkSelection, setBulkSelection] =
    useState<AttributionSelection | null>(null);
  const [activeRelation, setActiveRelation] = useState<Relation>('resource');
  const relationTransitionRef = useRef(false);
  const preserveSelectedAttributionRef = useRef(false);
  const requestedRelationRef = useRef<Relation | null>(null);
  const relationForCurrentResource =
    selectedResourceId !== previousSelectedResourceId
      ? 'resource'
      : activeRelation;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filterProps } = useFilterProperties({
    mode: external ? 'external' : 'manual',
    enabled: isFilterOpen,
  });
  const [filters, setFilteredAttributions] = useFilteredData();
  const { filters: attributionFilters, valueFilters } = filters;
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const databaseInitialized = useDatabaseInitialized();
  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;
  const navigationTargetUuid =
    !preserveSelectedAttributionRef.current &&
    selectedAttributionId &&
    selectedAttributionIsExternal === external
      ? selectedAttributionId
      : undefined;
  const pendingNavigationMatches =
    pendingAttributionNavigation?.attributionUuid === selectedAttributionId;
  const resultSetCriteria = useMemo<AttributionResultSetCriteria>(
    () => ({
      external,
      filters: attributionFilters,
      search: filters.search,
      valueFilters,
      resourcePathForRelationships: selectedResourceId,
      showResolved: areHiddenSignalsVisible && external,
      excludeUnrelated: external || isSelectedResourceReadonly,
    }),
    [
      areHiddenSignalsVisible,
      attributionFilters,
      external,
      filters.search,
      isSelectedResourceReadonly,
      selectedResourceId,
      valueFilters,
    ],
  );
  const {
    attributions,
    loading,
    isFetchingNextPage: loadingMore,
    nextPageError: loadMoreError,
    fetchNextPage,
    isFetching,
    relationCounts,
    navigationLoading,
    navigationAttributions,
    navigationRelation,
    navigationResult,
    resultSetKey,
  } = useAuditAttributionsList({
    criteria: resultSetCriteria,
    sort: filters.sorting,
    includeReadonly: true,
    relation: relationForCurrentResource,
    targetAttributionUuid: navigationTargetUuid,
  });
  useEffect(() => {
    if (!pendingAttributionNavigation || !pendingNavigationMatches) {
      return;
    }

    const targetIsLoaded = !!attributions?.[selectedAttributionId];
    if (targetIsLoaded) {
      dispatch(setPendingAttributionNavigation(null));
      return;
    }

    if (
      navigationAttributions[selectedAttributionId] &&
      navigationRelation !== null &&
      activeRelation !== navigationRelation
    ) {
      return;
    }

    if (navigationLoading || !navigationResult) {
      return;
    }

    if (
      navigationRelation === null &&
      selectedResourceId !== pendingAttributionNavigation.fallbackResourcePath
    ) {
      lastResourceIdWithAutoSelectionRef.current =
        pendingAttributionNavigation.fallbackResourcePath;
      dispatch(
        openResourceInResourceBrowser(
          pendingAttributionNavigation.fallbackResourcePath,
        ),
      );
      return;
    }

    dispatch(setPendingAttributionNavigation(null));
  }, [
    attributions,
    activeRelation,
    dispatch,
    navigationLoading,
    navigationAttributions,
    navigationRelation,
    pendingAttributionNavigation,
    pendingNavigationMatches,
    navigationResult,
    selectedAttributionId,
    selectedResourceId,
  ]);
  const selectedAttributionFromPage = attributions?.[selectedAttributionId];
  const selectedAttribution =
    selectedAttributionFromPage ??
    navigationAttributions[selectedAttributionId];
  const setFiltersWithUnsavedCheck = useCallback(
    (nextFilters: AttributionFilters) => {
      preserveSelectedAttributionRef.current = false;
      if (selectedAttribution) {
        dispatch(
          changeAttributionFiltersOrOpenUnsavedPopup({
            discardedPackageInfo: selectedAttribution,
            external,
            filters: nextFilters,
          }),
        );
        return;
      }

      setFilteredAttributions(nextFilters);
    },
    [dispatch, external, selectedAttribution, setFilteredAttributions],
  );
  const menuFilterOptions = useAttributionFilterOptions({
    filterOptions,
    filterProps,
    filters,
    setFilters: setFiltersWithUnsavedCheck,
  });
  const isFilterActive =
    !!attributionFilters.length || Object.values(valueFilters).some(Boolean);
  const pickerMode = usePickerMode();

  useEffect(() => {
    relationTransitionRef.current = true;
  }, [activeRelation]);

  const attributionIds = attributions ? Object.keys(attributions) : null;

  const availableRelations = relationCounts
    ? (['resource', 'parents', 'children', 'unrelated'] as const).filter(
        (relation) => relationCounts[relation] !== undefined,
      )
    : null;
  const activeRelationCount = relationCounts?.[activeRelation];
  const totalAttributionCount = activeRelationCount?.visibleCount ?? 0;

  // Automatic attribution selection. The first resource page is requested
  // immediately; only an empty resource page waits for relation counts before
  // falling back to the closest available relation.
  useEffect(() => {
    if (!external && targetAttributionRelation !== null) {
      preserveSelectedAttributionRef.current = true;
      requestedRelationRef.current = targetAttributionRelation;
      setActiveRelation(targetAttributionRelation);
      dispatch(setTargetAttributionRelation(null));
    }
  }, [dispatch, external, targetAttributionRelation]);

  useEffect(() => {
    const isPendingRootFallback =
      pendingAttributionNavigation &&
      pendingNavigationMatches &&
      !navigationLoading &&
      navigationRelation === null &&
      selectedResourceId !== pendingAttributionNavigation.fallbackResourcePath;
    if (isPendingRootFallback) {
      return;
    }

    const isAutoSelectionPending =
      !external &&
      lastResourceIdWithAutoSelectionRef.current !== selectedResourceId;

    if (isAutoSelectionPending) {
      dispatch(setSelectedAttributionId(''));

      if (loading || !attributions) {
        return;
      }

      const visibleAttributionIds = Object.keys(attributions);
      if (visibleAttributionIds.length > 0) {
        lastResourceIdWithAutoSelectionRef.current = selectedResourceId;
        dispatch(setSelectedAttributionId(visibleAttributionIds[0]));
        dispatch(completeAttributionSelection(selectedResourceId));
        return;
      }

      const closestSelectableRelation = availableRelations?.find(
        (relation) => relation === 'resource' || relation === 'parents',
      );
      if (closestSelectableRelation === undefined) {
        if (relationCounts !== undefined && !isFetching) {
          lastResourceIdWithAutoSelectionRef.current = selectedResourceId;
          dispatch(completeAttributionSelection(selectedResourceId));
        }
        return;
      }

      if (relationForCurrentResource !== closestSelectableRelation) {
        setActiveRelation(closestSelectableRelation);
        return;
      }

      if (!isFetching) {
        lastResourceIdWithAutoSelectionRef.current = selectedResourceId;
        dispatch(completeAttributionSelection(selectedResourceId));
      }
      return;
    }

    const replacementAttribution = attributions
      ? Object.values(attributions)[0]
      : undefined;
    const relationIsSettled = relationForCurrentResource === activeRelation;

    if (
      selectedAttributionId &&
      selectedAttributionIsExternal === external &&
      !attributions?.[selectedAttributionId] &&
      !navigationAttributions[selectedAttributionId] &&
      (!navigationLoading || !databaseInitialized) &&
      replacementAttribution &&
      relationIsSettled &&
      !pendingNavigationMatches &&
      !preserveSelectedAttributionRef.current
    ) {
      dispatch(setSelectedAttributionId(replacementAttribution.id));
    }

    if (
      preserveSelectedAttributionRef.current &&
      attributions?.[selectedAttributionId]
    ) {
      preserveSelectedAttributionRef.current = false;
    }
  }, [
    activeRelation,
    attributions,
    availableRelations,
    dispatch,
    external,
    isFetching,
    loading,
    relationCounts,
    relationForCurrentResource,
    selectedAttributionId,
    selectedAttributionIsExternal,
    navigationLoading,
    navigationAttributions,
    navigationRelation,
    pendingAttributionNavigation,
    pendingNavigationMatches,
    selectedResourceId,
    databaseInitialized,
  ]);

  const selectedAttributionRelation = selectedAttribution?.relation;
  const activeAttributionIds =
    relationForCurrentResource === activeRelation ? attributionIds : null;

  const activeSelectableAttributionIds = useMemo(
    () =>
      activeAttributionIds?.filter(
        (id) => attributions?.[id]?.resourceAccess !== 'readonly',
      ),
    [activeAttributionIds, attributions],
  );

  const selection = useMemo<AttributionSelection>(
    () =>
      bulkSelection ?? {
        mode: 'explicit',
        attributionUuids: selectedAttributionId ? [selectedAttributionId] : [],
      },
    [bulkSelection, selectedAttributionId],
  );

  const selectedAttributionIds = useMemo(() => {
    const selectedIds =
      selection.mode === 'allMatching'
        ? (activeSelectableAttributionIds?.filter(
            (id) => !selection.excludedAttributionUuids.includes(id),
          ) ?? [])
        : selection.attributionUuids;

    return intersection(selectedIds, attributionIds ?? []).filter(
      (id) => attributions?.[id]?.resourceAccess !== 'readonly',
    );
  }, [activeSelectableAttributionIds, attributionIds, attributions, selection]);

  const areAllAttributionsSelected = useMemo(() => {
    return (
      !!activeRelationCount?.editableCount &&
      (bulkSelection?.mode === 'allMatching'
        ? bulkSelection.excludedAttributionUuids.length === 0
        : intersection(
            activeSelectableAttributionIds ?? [],
            bulkSelection?.mode === 'explicit'
              ? bulkSelection.attributionUuids
              : [],
          ).length === activeRelationCount.editableCount)
    );
  }, [activeRelationCount, activeSelectableAttributionIds, bulkSelection]);

  const selectionQuery = useMemo<AttributionSelectionQuery>(
    () => ({
      ...resultSetCriteria,
      relation: relationForCurrentResource,
    }),
    [relationForCurrentResource, resultSetCriteria],
  );
  const previousSelectionQuery = usePrevious(selectionQuery);
  const selectionHasRows =
    bulkSelection?.mode === 'allMatching'
      ? !!activeRelationCount?.editableCount &&
        bulkSelection.excludedAttributionUuids.length <
          activeRelationCount.editableCount
      : false;
  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    { selection },
    { enabled: selectionHasRows },
  );
  const clearSelection = useCallback(() => {
    setBulkSelection(null);
  }, []);
  useEffect(() => {
    if (
      bulkSelection?.mode === 'allMatching' &&
      activeRelationCount !== undefined &&
      bulkSelection.excludedAttributionUuids.length >=
        activeRelationCount.editableCount
    ) {
      clearSelection();
    }
  }, [activeRelationCount, bulkSelection, clearSelection]);
  const toggleAttributionSelection = useCallback(
    (id: string, selected: boolean) => {
      setBulkSelection((current) => {
        if (current?.mode === 'allMatching') {
          const excluded = new Set(current.excludedAttributionUuids);
          if (selected) {
            excluded.delete(id);
          } else {
            excluded.add(id);
          }
          return {
            ...current,
            excludedAttributionUuids: [...excluded],
          };
        }

        const selectedIds =
          current?.mode === 'explicit' ? current.attributionUuids : [];
        const nextSelectedIds = selected
          ? selectedIds.includes(id)
            ? selectedIds
            : [...selectedIds, id]
          : selectedIds.filter((currentId) => currentId !== id);

        return nextSelectedIds.length
          ? { mode: 'explicit', attributionUuids: nextSelectedIds }
          : null;
      });
    },
    [],
  );
  const isAttributionSelected = useCallback(
    (id: string) =>
      bulkSelection?.mode === 'allMatching'
        ? activeSelectableAttributionIds?.includes(id) === true &&
          !bulkSelection.excludedAttributionUuids.includes(id)
        : bulkSelection?.mode === 'explicit'
          ? bulkSelection.attributionUuids.includes(id)
          : false,
    [activeSelectableAttributionIds, bulkSelection],
  );

  useEffect(() => {
    if (
      bulkSelection &&
      previousSelectionQuery &&
      !isEqual(previousSelectionQuery, selectionQuery) &&
      !pickerMode.isActive
    ) {
      clearSelection();
    }
  }, [
    clearSelection,
    pickerMode.isActive,
    previousSelectionQuery,
    bulkSelection,
    selectionQuery,
  ]);

  // reset resource-dependent selection state when the selected resource changes
  useEffect(() => {
    if (selectedResourceId !== previousSelectedResourceId) {
      clearSelection();
      setActiveRelation('resource');
    }
  }, [clearSelection, previousSelectedResourceId, selectedResourceId]);

  // remove explicit selections that are no longer loaded after filtering
  useEffect(() => {
    if (
      bulkSelection?.mode !== 'explicit' ||
      !attributionIds ||
      relationTransitionRef.current
    ) {
      return;
    }

    const effectiveSelectedIds = intersection(
      attributionIds,
      bulkSelection.attributionUuids,
    );
    if (isEqual(effectiveSelectedIds, bulkSelection.attributionUuids)) {
      return;
    }

    setBulkSelection((current) =>
      current?.mode === 'explicit' && effectiveSelectedIds.length
        ? { ...current, attributionUuids: effectiveSelectedIds }
        : null,
    );
  }, [activeRelation, attributionIds, bulkSelection]);

  useEffect(() => {
    if (
      relationTransitionRef.current &&
      relationForCurrentResource === activeRelation &&
      !loading
    ) {
      relationTransitionRef.current = false;
    }
  }, [activeRelation, loading, relationForCurrentResource, attributionIds]);

  // reset selection when active relation changes and not in replacement or compare-selection mode
  useEffect(() => {
    if (!pickerMode.isActive) {
      clearSelection();
    }
  }, [activeRelation, clearSelection, pickerMode.isActive]);

  // reset active relation when active relation no longer exists
  useEffect(() => {
    if (
      requestedRelationRef.current !== null &&
      requestedRelationRef.current === activeRelation
    ) {
      if (availableRelations?.includes(requestedRelationRef.current)) {
        requestedRelationRef.current = null;
      } else {
        return;
      }
    }

    if (
      !loading &&
      availableRelations?.length &&
      !availableRelations.includes(activeRelation)
    ) {
      setActiveRelation(availableRelations[0]);
    }
  }, [activeRelation, availableRelations, loading]);

  // switch to the tab of a newly selected attribution
  useEffect(() => {
    if (selectedAttributionRelation) {
      setActiveRelation(selectedAttributionRelation);
    }
  }, [selectedAttributionRelation]);

  const childrenProps: PackagesPanelChildrenProps = {
    activeAttributionIds,
    activeRelation,
    attributionIds,
    attributions,
    contentHeight: `calc(100% - 42px - ${availableRelations?.length ? TABS_CONTAINER_HEIGHT : 0}px - ${alert ? ALERT_CONTAINER_HEIGHT : 0}px)`,
    loading,
    loadingMore,
    loadMoreError,
    fetchNextPage,
    selection,
    selectionSummary: selectionSummaryQuery.data,
    selectionSummaryLoading: selectionSummaryQuery.isLoading,
    toggleAttributionSelection,
    isAttributionSelected,
    clearSelection,
    pickerMode,
    resultSetKey,
    selectedAttributionId,
    selectedAttributionIds,
    totalAttributionCount,
  };

  const isDisabledDuringReplacement = external && pickerMode.mode === 'replace';

  return (
    <Panel
      data-testid={testId}
      sx={{
        opacity: isDisabledDuringReplacement ? PICKER_MODE_DISABLED_OPACITY : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {renderActionBar()}
      {children(childrenProps)}
    </Panel>
  );

  function renderActionBar() {
    return (
      <ActionBarContainer>
        {renderTabs()}
        <ActionBar>
          <ButtonGroup>{renderSelectAllCheckbox()}</ButtonGroup>
          <ButtonGroup>{renderActions(childrenProps)}</ButtonGroup>
          <ButtonGroup>
            <SortButton
              disabled={
                loading ||
                !attributionIds ||
                attributionIds.length === 0 ||
                isDisabledDuringReplacement
              }
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
            />
            <FilterButton
              options={menuFilterOptions}
              isActive={isFilterActive}
              onOpenChange={setIsFilterOpen}
              onClear={() =>
                setFiltersWithUnsavedCheck({
                  ...filters,
                  filters: [],
                  valueFilters: {},
                })
              }
              anchorPosition={'right'}
              disabled={
                loading ||
                isDisabledDuringReplacement ||
                (attributionIds !== null &&
                  attributionIds.length === 0 &&
                  !isFilterActive)
              }
            />
          </ButtonGroup>
        </ActionBar>
        {renderAlert()}
      </ActionBarContainer>
    );
  }

  function renderTabs() {
    if (!availableRelations?.length) {
      return <Tabs centered variant={'fullWidth'} value={-1}></Tabs>;
    }

    const activeTabIndex = availableRelations.findIndex(
      (key) => key === activeRelation,
    );

    return (
      <Tabs
        centered
        variant={'fullWidth'}
        value={activeTabIndex === -1 ? false : activeTabIndex}
        onChange={(_, index) => {
          preserveSelectedAttributionRef.current = true;
          setActiveRelation(availableRelations[index]);
        }}
      >
        {availableRelations.map((key) => (
          <Tab
            wrapped
            key={key}
            label={`${text.relations[key]} (${new Intl.NumberFormat().format(relationCounts?.[key]?.visibleCount ?? 0)})`}
          />
        ))}
      </Tabs>
    );
  }

  function renderAlert() {
    return (
      <AlertContainer open={!!alert} color={alert?.color}>
        <MuiTypography
          sx={{ padding: '2px 0' }}
          color={alert?.textColor || OpossumColors.white}
        >
          {alert?.text}
        </MuiTypography>
      </AlertContainer>
    );
  }

  function renderSelectAllCheckbox() {
    return (
      <MuiTooltip
        title={
          areAllAttributionsSelected || bulkSelection
            ? text.packageLists.deselectAll
            : text.packageLists.selectAll
        }
        disableInteractive
        placement={'top'}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: {
                  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                  offset: [0, -8],
                },
              },
            ],
          },
        }}
      >
        <Checkbox
          disabled={!activeRelationCount?.editableCount || pickerMode.isActive}
          checked={areAllAttributionsSelected}
          indeterminate={
            !areAllAttributionsSelected &&
            !!bulkSelection &&
            (bulkSelection.mode === 'allMatching'
              ? bulkSelection.excludedAttributionUuids.length > 0
              : bulkSelection.attributionUuids.length > 0)
          }
          aria-label={'select all'}
          onChange={() => {
            if (areAllAttributionsSelected) {
              clearSelection();
              return;
            }
            if (bulkSelection?.mode === 'allMatching') {
              setBulkSelection({
                ...bulkSelection,
                excludedAttributionUuids: [],
              });
              return;
            }
            if (activeSelectableAttributionIds) {
              setBulkSelection({
                mode: 'allMatching',
                query: selectionQuery,
                excludedAttributionUuids: [],
              });
            }
          }}
        />
      </MuiTooltip>
    );
  }
};
