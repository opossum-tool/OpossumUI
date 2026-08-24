// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import {
  groupBy as _groupBy,
  orderBy as _orderBy,
  difference,
  intersection,
  isEqual,
} from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Attributions, Relation } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import {
  OpossumColors,
  PICKER_MODE_DISABLED_OPACITY,
} from '../../../shared-styles';
import { changeAttributionFiltersOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
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
import { getRelationPriority } from '../../../util/sort-attributions';
import { useFilterProperties } from '../../../util/use-filter-properties';
import { useInfiniteAttributionsList } from '../../../util/use-infinite-attributions-list';
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
  activeRelation: Relation | null;
  attributionIds: Array<string> | null;
  attributions: Attributions | null;
  contentHeight: string;
  loading: boolean;
  loadingMore: boolean;
  loadMoreError: unknown;
  onRetryLoadMore: () => void;
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  multiSelectedAttributionIds: Array<string>;
  pickerMode: PickerMode;
  selectedAttributionId: string;
  selectedAttributionIds: Array<string>;
  setMultiSelectedAttributionIds: React.Dispatch<
    React.SetStateAction<Array<string>>
  >;
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
  const selectedAttributionIsExternal = useSelectedAttributionIsExternal();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const lastResourceIdWithAutoSelectionRef = useRef(selectedResourceId);
  const previousSelectedResourceId = usePrevious(selectedResourceId);

  const [multiSelectedAttributionIds, setMultiSelectedAttributionIds] =
    useState<Array<string>>([]);
  const [activeRelation, setActiveRelation] = useState<Relation>('resource');
  const relationForCurrentResource =
    selectedResourceId !== previousSelectedResourceId
      ? 'resource'
      : activeRelation;
  const { filterProps } = useFilterProperties({
    mode: external ? 'external' : 'manual',
  });
  const [filters, setFilteredAttributions] = useFilteredData();
  const { filters: attributionFilters, valueFilters } = filters;
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;
  const infiniteAttributions = useInfiniteAttributionsList({
    external,
    filters: attributionFilters,
    search: filters.search,
    sort: filters.sorting,
    valueFilters,
    resourcePathForRelationships: selectedResourceId,
    showResolved: areHiddenSignalsVisible && external,
    excludeUnrelated: external || isSelectedResourceReadonly,
    includeReadonly: true,
    relation: relationForCurrentResource,
  });
  const {
    attributions,
    loading,
    loadingMore,
    loadMoreError,
    onRetryLoadMore,
    fetchNextPage,
    hasNextPage,
    relationCounts,
  } = {
    attributions: infiniteAttributions.attributions,
    loading: infiniteAttributions.loading,
    loadingMore: infiniteAttributions.isFetchingNextPage,
    loadMoreError: infiniteAttributions.nextPageError,
    onRetryLoadMore: infiniteAttributions.fetchNextPage,
    fetchNextPage: infiniteAttributions.fetchNextPage,
    hasNextPage: infiniteAttributions.hasNextPage,
    relationCounts: infiniteAttributions.relationCounts,
  };
  const selectedAttribution = attributions?.[selectedAttributionId];
  const groupedIds = useMemo(
    () =>
      attributions &&
      _groupBy(
        _orderBy(
          Object.keys(attributions),
          (id) => getRelationPriority(attributions[id].relation),
          'desc',
        ),
        (id) => attributions[id].relation || 'unrelated',
      ),
    [attributions],
  );

  // Automatic attribution selection
  useEffect(() => {
    if (loading || !attributions) {
      if (
        !external &&
        lastResourceIdWithAutoSelectionRef.current !== selectedResourceId
      ) {
        dispatch(setSelectedAttributionId(''));
      }
      return;
    }

    if (
      !external &&
      lastResourceIdWithAutoSelectionRef.current !== selectedResourceId
    ) {
      lastResourceIdWithAutoSelectionRef.current = selectedResourceId;
      const closestAttributionId =
        groupedIds?.resource?.[0] ?? groupedIds?.parents?.[0];

      dispatch(setSelectedAttributionId(closestAttributionId ?? ''));
      return;
    }

    const replacementAttribution = attributions
      ? Object.values(attributions)[0]
      : undefined;

    if (
      selectedAttributionId &&
      selectedAttributionIsExternal === external &&
      !attributions?.[selectedAttributionId] &&
      replacementAttribution
    ) {
      dispatch(setSelectedAttributionId(replacementAttribution.id));
    }
  }, [
    attributions,
    dispatch,
    external,
    groupedIds,
    loading,
    selectedAttributionId,
    selectedAttributionIsExternal,
    selectedResourceId,
  ]);
  const setFiltersWithUnsavedCheck = useCallback(
    (nextFilters: AttributionFilters) => {
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

  const attributionIds = attributions && Object.keys(attributions);

  const availableRelations = relationCounts
    ? (['resource', 'parents', 'children', 'unrelated'] as const).filter(
        (relation) => relationCounts[relation] !== undefined,
      )
    : null;
  const selectedAttributionRelation =
    attributions?.[selectedAttributionId]?.relation;
  const activeAttributionIds = useMemo(
    () =>
      groupedIds && activeRelation ? (groupedIds[activeRelation] ?? []) : null,
    [activeRelation, groupedIds],
  );

  const activeSelectableAttributionIds = useMemo(
    () =>
      activeAttributionIds?.filter(
        (id) => attributions?.[id]?.resourceAccess !== 'readonly',
      ),
    [activeAttributionIds, attributions],
  );

  const selectedAttributionIds = useMemo(
    () =>
      intersection(
        multiSelectedAttributionIds.length
          ? multiSelectedAttributionIds
          : [selectedAttributionId],
        attributionIds,
      )?.filter((id) => attributions?.[id]?.resourceAccess !== 'readonly'),
    [
      attributionIds,
      attributions,
      multiSelectedAttributionIds,
      selectedAttributionId,
    ],
  );

  const areAllAttributionsSelected = useMemo(() => {
    return (
      !!activeSelectableAttributionIds?.length &&
      !difference(activeSelectableAttributionIds, multiSelectedAttributionIds)
        .length
    );
  }, [activeSelectableAttributionIds, multiSelectedAttributionIds]);
  const effectiveSelectedIds = useMemo(
    () => intersection(attributionIds, multiSelectedAttributionIds),
    [attributionIds, multiSelectedAttributionIds],
  );
  const prevEffectiveSelectedIds = usePrevious(
    effectiveSelectedIds,
    effectiveSelectedIds,
  );

  // reset resource-dependent selection state when the selected resource changes
  useEffect(() => {
    if (selectedResourceId !== previousSelectedResourceId) {
      if (multiSelectedAttributionIds.length) {
        setMultiSelectedAttributionIds([]);
      }
      setActiveRelation('resource');
    }
  }, [
    multiSelectedAttributionIds.length,
    previousSelectedResourceId,
    selectedResourceId,
  ]);

  // adjust multi-selected IDs when previously visible attributions become invisible
  useEffect(() => {
    if (!isEqual(effectiveSelectedIds, prevEffectiveSelectedIds)) {
      setMultiSelectedAttributionIds(effectiveSelectedIds);
    }
  }, [dispatch, effectiveSelectedIds, prevEffectiveSelectedIds]);

  // reset multi-selected IDs when active relation changes and not in replacement or compare-selection mode
  useEffect(() => {
    if (activeRelation && !pickerMode.isActive) {
      setMultiSelectedAttributionIds([]);
    }
  }, [activeRelation, pickerMode.isActive]);

  // reset active relation when active relation no longer exists
  useEffect(() => {
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
    contentHeight: `calc(100% - 42px - ${groupedIds && Object.keys(groupedIds).length ? TABS_CONTAINER_HEIGHT : 0}px - ${alert ? ALERT_CONTAINER_HEIGHT : 0}px)`,
    loading,
    loadingMore,
    loadMoreError,
    onRetryLoadMore,
    fetchNextPage,
    hasNextPage,
    multiSelectedAttributionIds,
    pickerMode,
    selectedAttributionId,
    selectedAttributionIds,
    setMultiSelectedAttributionIds,
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
          setActiveRelation(availableRelations[index]);
        }}
      >
        {availableRelations.map((key) => (
          <Tab
            wrapped
            key={key}
            label={`${text.relations[key]} (${new Intl.NumberFormat().format(relationCounts?.[key] ?? 0)})`}
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
          multiSelectedAttributionIds.length
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
          disabled={
            !activeSelectableAttributionIds?.length ||
            pickerMode.isActive ||
            hasNextPage
          }
          checked={areAllAttributionsSelected}
          indeterminate={
            !areAllAttributionsSelected && !!multiSelectedAttributionIds.length
          }
          aria-label={'select all'}
          onChange={() => {
            activeSelectableAttributionIds &&
              setMultiSelectedAttributionIds(
                areAllAttributionsSelected ||
                  !!multiSelectedAttributionIds.length
                  ? []
                  : activeSelectableAttributionIds,
              );
          }}
        />
      </MuiTooltip>
    );
  }
};
