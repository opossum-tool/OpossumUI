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
import { useEffect, useMemo, useState } from 'react';

import { Attributions, Relation } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { Filter } from '../../../shared-constants';
import { OpossumColors } from '../../../shared-styles';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { UseFilteredData } from '../../../state/variables/use-filtered-data';
import { getRelationPriority } from '../../../util/sort-attributions';
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
  activeRelation: string | null;
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
  alert?: Alert;
  availableFilters: Array<Filter>;
  children: React.FC<PackagesPanelChildrenProps>;
  disableSelectAll?: boolean;
  useFilteredData: UseFilteredData;
  renderActions: React.FC<PackagesPanelChildrenProps>;
}

export const PackagesPanel = ({
  alert,
  availableFilters,
  children,
  disableSelectAll,
  renderActions,
  useFilteredData,
}: Props) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [multiSelectedAttributionIds, setMultiSelectedAttributionIds] =
    useState<Array<string>>([]);
  const [activeRelation, setActiveRelation] = useState<string | null>(null);
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  const [{ attributions, loading }] = useFilteredData();
  const attributionIds = attributions && Object.keys(attributions);

  const groupedIds = useMemo(
    () =>
      attributions &&
      _groupBy(
        _orderBy(
          attributionIds,
          (id) => getRelationPriority(attributions[id].relation),
          'desc',
        ),
        (id) => attributions[id].relation || 'unrelated',
      ),
    [attributionIds, attributions],
  );

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

  const areAllAttributionsSelected = useMemo(
    () =>
      !!attributionIds?.length &&
      !difference(attributionIds, multiSelectedAttributionIds).length,
    [attributionIds, multiSelectedAttributionIds],
  );

  const effectiveSelectedIds = useMemo(
    () => intersection(attributionIds, multiSelectedAttributionIds),
    [attributionIds, multiSelectedAttributionIds],
  );
  const prevEffectiveSelectedIds = usePrevious(
    effectiveSelectedIds,
    effectiveSelectedIds,
  );

  useEffect(() => {
    if (!isEqual(effectiveSelectedIds, prevEffectiveSelectedIds)) {
      setMultiSelectedAttributionIds(effectiveSelectedIds);
    }
  }, [dispatch, effectiveSelectedIds, prevEffectiveSelectedIds]);

  useEffect(() => {
    if (activeRelation) {
      !attributionIdsForReplacement.length &&
        setMultiSelectedAttributionIds([]);
    }
  }, [activeRelation, attributionIdsForReplacement.length]);

  useEffect(() => {
    if (
      groupedIds &&
      Object.keys(groupedIds).length &&
      (!activeRelation || !Object.keys(groupedIds).includes(activeRelation))
    ) {
      setActiveRelation(Object.keys(groupedIds)[0]);
    }
  }, [activeRelation, groupedIds]);

  useEffect(() => {
    if (selectedResourceId) {
      setActiveRelation(null);
    }
  }, [selectedResourceId]);

  const relationOfSelectedAttribution = useMemo(
    () =>
      selectedAttributionId &&
      groupedIds &&
      Object.entries(groupedIds).find(([_, value]) =>
        value.includes(selectedAttributionId),
      )?.[0],
    [groupedIds, selectedAttributionId],
  );

  useEffect(() => {
    if (relationOfSelectedAttribution) {
      setActiveRelation(relationOfSelectedAttribution);
    }
  }, [relationOfSelectedAttribution]);

  const childrenProps: PackagesPanelChildrenProps = {
    activeAttributionIds: activeRelation
      ? groupedIds?.[activeRelation] ?? []
      : null,
    activeRelation,
    attributionIds,
    attributions,
    contentHeight: `calc(100% - 42px - ${groupedIds ? TABS_CONTAINER_HEIGHT : 0}px - ${alert ? ALERT_CONTAINER_HEIGHT : 0}px)`,
    loading,
    multiSelectedAttributionIds,
    selectedAttributionId,
    selectedAttributionIds,
    setMultiSelectedAttributionIds,
  };

  return (
    <Panel>
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
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
            />
            <FilterButton
              availableFilters={availableFilters}
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
            />
          </ButtonGroup>
        </ActionBar>
        {renderAlert()}
      </ActionBarContainer>
    );
  }

  function renderTabs() {
    if (!groupedIds || !Object.keys(groupedIds).length) {
      return null;
    }

    const activeTabIndex = Object.keys(groupedIds).findIndex(
      (key) => key === activeRelation,
    );

    return (
      <Tabs
        centered
        variant={'fullWidth'}
        value={activeTabIndex === -1 ? false : activeTabIndex}
        onChange={(_, index) => {
          setActiveRelation(Object.keys(groupedIds)[index]);
        }}
      >
        {Object.keys(groupedIds).map((key) => (
          <Tab
            wrapped
            key={key}
            label={`${text.relations[key as Relation]} (${new Intl.NumberFormat().format(groupedIds[key]?.length ?? 0)})`}
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
          onChange={() =>
            attributionIds &&
            setMultiSelectedAttributionIds(
              areAllAttributionsSelected || !!multiSelectedAttributionIds.length
                ? []
                : attributionIds,
            )
          }
        />
      </MuiTooltip>
    );
  }
};
