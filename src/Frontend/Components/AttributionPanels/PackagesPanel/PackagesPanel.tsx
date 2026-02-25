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
} from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';

import { FilterProperties } from '../../../../ElectronBackend/api/queries';
import {
  Attributions,
  PackageInfo,
  Relation,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO, Filter } from '../../../shared-constants';
import { OpossumColors } from '../../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { UseFilteredData } from '../../../state/variables/use-filtered-data';
import { getRelationPriority } from '../../../util/sort-attributions';
import { useFilteredAttributionsList } from '../../../util/use-attribution-lists';
import { usePrevious } from '../../../util/use-previous';
import { Checkbox } from '../../Checkbox/Checkbox';
import { FilterButton } from '../../FilterButton/FilterButton';
import { SortButton } from '../../SortButton/SortButton';
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
  multiSelectedAttributionIds: Array<string>;
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
  autoselectAttribution?: boolean;
  availableFilters: Array<Filter>;
  children: (props: PackagesPanelChildrenProps) => React.ReactNode;
  disableSelectAll?: boolean;
  useFilteredData: UseFilteredData;
  renderActions: (props: PackagesPanelChildrenProps) => React.ReactNode;
  testId?: string;
  filterProperties?: FilterProperties;
}

export const PackagesPanel = ({
  external,
  alert,
  autoselectAttribution,
  availableFilters,
  children,
  disableSelectAll,
  renderActions,
  useFilteredData,
  testId,
  filterProperties,
}: Props) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const previousSelectedResourceId = usePrevious(selectedResourceId);

  const [multiSelectedAttributionIds, setMultiSelectedAttributionIds] =
    useState<Array<string>>([]);
  const [activeRelation, setActiveRelation] = useState<Relation>('children');
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  const previousAutoselectResourceId = useRef(selectedResourceId);

  const {attributions, loading} = useFilteredAttributionsList({ external });

  const attributionIds = attributions && Object.keys(attributions);

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
  const availableRelations =
    groupedIds && (Object.keys(groupedIds) as Array<Relation> | null);
  const selectedAttributionRelation =
    attributions?.[selectedAttributionId]?.relation;

  const selectedAttributionIds = useMemo(
    () =>
      intersection(
        multiSelectedAttributionIds.length
          ? multiSelectedAttributionIds
          : [selectedAttributionId],
        attributionIds,
      ),
    [attributionIds, multiSelectedAttributionIds, selectedAttributionId],
  );

  const areAllAttributionsSelected = useMemo(() => {
    const activeAttributionIds = attributionIds?.filter(
      (id) => attributions?.[id].relation === activeRelation,
    );
    return (
      !!activeAttributionIds?.length &&
      !difference(activeAttributionIds, multiSelectedAttributionIds).length
    );
  }, [
    activeRelation,
    attributionIds,
    attributions,
    multiSelectedAttributionIds,
  ]);

  const effectiveSelectedIds = useMemo(
    () => intersection(attributionIds, multiSelectedAttributionIds),
    [attributionIds, multiSelectedAttributionIds],
  );
  const prevEffectiveSelectedIds = usePrevious(
    effectiveSelectedIds,
    effectiveSelectedIds,
  );

  // reset multi-selected IDs when selected resource changes
  useEffect(() => {
    if (
      selectedResourceId !== previousSelectedResourceId &&
      multiSelectedAttributionIds.length
    ) {
      setMultiSelectedAttributionIds([]);
    }
  }, [
    multiSelectedAttributionIds.length,
    previousSelectedResourceId,
    selectedResourceId,
  ]);

  useEffect(() => {
    if (
      autoselectAttribution &&
      attributions &&
      selectedResourceId !== previousAutoselectResourceId.current
    ) {
      previousAutoselectResourceId.current = selectedResourceId;
      const firstAttribution: PackageInfo | undefined = Object.values(
        attributions,
      ).find(
        ({ relation }) => relation === 'resource' || relation === 'parents',
      );
      dispatch(
        changeSelectedAttributionOrOpenUnsavedPopup(
          firstAttribution || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      );
    }
  }, [autoselectAttribution, attributions, dispatch, selectedResourceId]);

  // adjust multi-selected IDs when previously visible attributions become invisible
  useEffect(() => {
    if (!isEqual(effectiveSelectedIds, prevEffectiveSelectedIds)) {
      setMultiSelectedAttributionIds(effectiveSelectedIds);
    }
  }, [dispatch, effectiveSelectedIds, prevEffectiveSelectedIds]);

  // reset multi-selected IDs when active relation changes and not in replacement mode
  useEffect(() => {
    if (activeRelation && !attributionIdsForReplacement.length) {
      setMultiSelectedAttributionIds([]);
    }
  }, [activeRelation, attributionIdsForReplacement.length]);

  // reset active relation when active relation no longer exists
  useEffect(() => {
    if (
      availableRelations?.length &&
      (!activeRelation || !availableRelations.includes(activeRelation))
    ) {
      setActiveRelation(availableRelations[0]);
    }
  }, [activeRelation, availableRelations]);

  // switch to the tab of a newly selected attribution
  useEffect(() => {
    if (selectedAttributionRelation) {
      setActiveRelation(selectedAttributionRelation);
    }
  }, [selectedAttributionRelation]);

  const childrenProps: PackagesPanelChildrenProps = {
    activeAttributionIds: groupedIds
      ? (groupedIds[activeRelation] ?? [])
      : null,
    activeRelation,
    attributionIds,
    attributions,
    contentHeight: `calc(100% - 42px - ${groupedIds && Object.keys(groupedIds).length ? TABS_CONTAINER_HEIGHT : 0}px - ${alert ? ALERT_CONTAINER_HEIGHT : 0}px)`,
    loading,
    multiSelectedAttributionIds,
    selectedAttributionId,
    selectedAttributionIds,
    setMultiSelectedAttributionIds,
  };

  return (
    <Panel data-testid={testId}>
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
                loading || !attributionIds || attributionIds.length === 0
              }
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
            />
            <FilterButton
              filterProps={filterProperties}
              availableFilters={availableFilters}
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
              disabled={loading}
              emptyAttributions={
                attributionIds !== null && attributionIds.length === 0
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
      return null;
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
            label={`${text.relations[key]} (${new Intl.NumberFormat().format(groupedIds?.[key]?.length ?? 0)})`}
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
          disabled={!attributionIds?.length || disableSelectAll}
          checked={areAllAttributionsSelected}
          indeterminate={
            !areAllAttributionsSelected && !!multiSelectedAttributionIds.length
          }
          aria-label={'select all'}
          onChange={() => {
            attributionIds &&
              setMultiSelectedAttributionIds(
                areAllAttributionsSelected ||
                  !!multiSelectedAttributionIds.length
                  ? []
                  : attributionIds.filter(
                      (id) => attributions?.[id].relation === activeRelation,
                    ),
              );
          }}
        />
      </MuiTooltip>
    );
  }
};
