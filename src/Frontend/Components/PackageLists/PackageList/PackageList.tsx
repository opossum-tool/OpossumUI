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

import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { TRANSITION } from '../../../shared-styles';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getSelectedAttributionId } from '../../../state/selectors/resource-selectors';
import { UseFilteredData } from '../../../state/variables/use-filtered-data';
import { usePrevious } from '../../../util/use-previous';
import { Checkbox } from '../../Checkbox/Checkbox';
import { FilterButton } from '../../FilterButton/FilterButton';
import { GroupedList } from '../../GroupedList/GroupedList';
import { SearchTextField } from '../../SearchTextField/SearchTextField';
import { SortButton } from '../../SortButton/SortButton';
import {
  ActionBar,
  ActionBarContainer,
  ButtonGroup,
  MessageContainer,
  Panel,
} from './PackageList.style';

const ALERT_CONTAINER_HEIGHT = 24;

export interface PackageListChildrenProps {
  attributionIds: Array<string>;
  attributions: Attributions;
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
  children: React.FC<PackageListChildrenProps>;
  useFilteredData: UseFilteredData;
  orderBy?: Array<(value: PackageInfo, index: number) => unknown>;
  order?: Array<'asc' | 'desc'>;
  groupBy: (attribution: PackageInfo) => string;
  renderGroupName: (
    key: string,
    props: PackageListChildrenProps,
  ) => React.ReactNode;
  renderItemContent: (
    id: string,
    props: PackageListChildrenProps,
  ) => React.ReactNode;
}

export const PackageList = ({
  alert,
  children,
  renderGroupName,
  renderItemContent,
  useFilteredData,
  groupBy,
  orderBy,
  order,
}: Props) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const [multiSelectedAttributionIds, setMultiSelectedAttributionIds] =
    useState<Array<string>>([]);

  const [{ attributions, loading, search }, setFilteredAttributions] =
    useFilteredData();
  const attributionIds = Object.keys(attributions);

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
      !!attributionIds.length &&
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

  const groupedIds = useMemo(
    () =>
      _groupBy(
        orderBy
          ? _orderBy(
              attributionIds,
              orderBy.map((f, index) => (id) => f(attributions[id], index)),
              order,
            )
          : attributionIds,
        (id) => groupBy(attributions[id]),
      ),
    [attributionIds, attributions, groupBy, orderBy, order],
  );

  const childrenProps: PackageListChildrenProps = {
    attributionIds,
    attributions,
    multiSelectedAttributionIds,
    selectedAttributionId,
    selectedAttributionIds,
    setMultiSelectedAttributionIds,
  };

  return (
    <Panel>
      <SearchTextField
        onInputChange={(search) => {
          setFilteredAttributions((prev) => ({ ...prev, search }));
        }}
        search={search}
        placeholder={text.packageLists.searchAttributions}
      />
      {renderActionBar()}
      {renderGroupedList()}
    </Panel>
  );

  function renderGroupedList() {
    return (
      <GroupedList
        groupedIds={groupedIds}
        selectedId={selectedAttributionId}
        renderItemContent={(key) => renderItemContent(key, childrenProps)}
        renderGroupName={(key) => renderGroupName(key, childrenProps)}
        loading={loading}
        sx={{
          transition: TRANSITION,
          height: `calc(100% - 82px - ${alert ? ALERT_CONTAINER_HEIGHT : 0}px)`,
        }}
      />
    );
  }

  function renderActionBar() {
    return (
      <ActionBarContainer>
        <ActionBar>
          <ButtonGroup>{renderSelectAllCheckbox()}</ButtonGroup>
          <ButtonGroup>{children(childrenProps)}</ButtonGroup>
          <ButtonGroup>
            <SortButton
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
            />
            <FilterButton
              anchorPosition={'right'}
              useFilteredData={useFilteredData}
            />
          </ButtonGroup>
        </ActionBar>
        {renderAlert()}
      </ActionBarContainer>
    );
  }

  function renderAlert() {
    return (
      <MessageContainer
        height={alert ? ALERT_CONTAINER_HEIGHT : 0}
        color={alert?.color}
      >
        <MuiTypography
          sx={{ padding: '2px 0' }}
          color={alert?.textColor || 'white'}
        >
          {alert?.text}
        </MuiTypography>
      </MessageContainer>
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
          disabled={!attributionIds.length || !!alert}
          checked={areAllAttributionsSelected}
          indeterminate={
            !areAllAttributionsSelected && !!multiSelectedAttributionIds.length
          }
          onChange={() =>
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
