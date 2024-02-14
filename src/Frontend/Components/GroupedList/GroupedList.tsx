// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import MuiBox from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import MuiTooltip from '@mui/material/Tooltip';
import { SxProps } from '@mui/system';
import { defer } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GroupedVirtuoso, GroupedVirtuosoHandle } from 'react-virtuoso';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { notInTests } from '../../util/not-in-tests';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { GroupContainer } from './GroupedList.style';

export interface GroupedListProps {
  groupedIds: Record<string, Array<string>>;
  loading?: boolean;
  renderGroupName?: (key: string) => React.ReactNode;
  renderItemContent: (id: string) => React.ReactNode;
  selectedId?: string;
  sx?: SxProps;
}

export function GroupedList({
  groupedIds,
  loading,
  renderGroupName,
  renderItemContent,
  selectedId,
  sx,
}: GroupedListProps) {
  const ref = useRef<GroupedVirtuosoHandle>(null);
  const [{ endIndex, startIndex }, setRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>({ startIndex: 0, endIndex: 0 });

  const groups = useMemo(() => {
    const flattened = Object.values(groupedIds).flat();

    return {
      ids: flattened,
      keys: Object.keys(groupedIds),
      counts: Object.values(groupedIds).map((group) => group.length),
      selectedIndex: flattened.findIndex((id) => id === selectedId),
    };
  }, [groupedIds, selectedId]);

  useEffect(() => {
    if (groups.selectedIndex >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: groups.selectedIndex,
          align: 'center',
        }),
      );
    }
  }, [groups.selectedIndex]);

  return (
    <LoadingMask sx={{ position: 'relative', ...sx }} active={loading}>
      {loading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            width: '100%',
            height: 2,
            zIndex: 2,
            top: 0,
            left: 0,
          }}
        />
      )}
      <GroupedVirtuoso
        ref={ref}
        rangeChanged={setRange}
        // https://github.com/petyosi/react-virtuoso/issues/1001
        initialTopMostItemIndex={notInTests(
          ~groups.selectedIndex && {
            index: groups.selectedIndex,
            behavior: 'auto',
            align: 'center',
          },
        )}
        groupCounts={groups.counts}
        groupContent={(index) => (
          <GroupContainer role={'group'}>
            <MuiBox sx={{ display: 'flex' }}>
              {renderJumpUp(index)}
              {renderJumpDown(index)}
            </MuiBox>
            {renderGroupName?.(groups.keys[index]) || (
              <MuiBox sx={{ flex: 1 }} />
            )}
          </GroupContainer>
        )}
        itemContent={(index) => renderItemContent(groups.ids[index])}
      />
    </LoadingMask>
  );

  function renderJumpUp(index: number) {
    const isFirstGroup = index === 0;
    const isFirstItemVisible = startIndex === 0;
    const isFirstItemInGroupVisible =
      startIndex <= groups.counts.slice(0, index).reduce((a, b) => a + b, 0);
    const Icon = isFirstGroup ? KeyboardDoubleArrowUpIcon : KeyboardArrowUpIcon;

    return (
      <MuiTooltip
        title={
          isFirstGroup
            ? isFirstItemVisible
              ? undefined
              : text.packageLists.scrollToTop
            : isFirstItemInGroupVisible
              ? text.packageLists.jumpPrevious
              : text.packageLists.jumpStart
        }
        enterDelay={500}
      >
        <Icon
          fontSize={'inherit'}
          color={isFirstGroup && isFirstItemVisible ? 'disabled' : undefined}
          sx={{
            cursor: isFirstGroup && isFirstItemVisible ? undefined : 'pointer',
            borderRadius: '50%',
            '&:hover': {
              background:
                isFirstGroup && isFirstItemVisible
                  ? undefined
                  : OpossumColors.lightGrey,
            },
          }}
          onClick={
            isFirstGroup
              ? isFirstItemVisible
                ? undefined
                : () => ref.current?.scrollToIndex({ index: 0 })
              : () =>
                  ref.current?.scrollToIndex({
                    groupIndex: isFirstItemInGroupVisible ? index - 1 : index,
                  })
          }
        />
      </MuiTooltip>
    );
  }

  function renderJumpDown(index: number) {
    const isLastGroup = index === groups.counts.length - 1;
    const isLastItemVisible = endIndex === groups.ids.length - 1;
    const Icon = isLastGroup
      ? KeyboardDoubleArrowDownIcon
      : KeyboardArrowDownIcon;

    return (
      <MuiTooltip
        title={
          isLastGroup
            ? isLastItemVisible
              ? undefined
              : text.packageLists.scrollToBottom
            : text.packageLists.jumpNext
        }
        enterDelay={500}
      >
        <Icon
          fontSize={'inherit'}
          color={isLastGroup && isLastItemVisible ? 'disabled' : undefined}
          sx={{
            cursor: isLastGroup && isLastItemVisible ? undefined : 'pointer',
            borderRadius: '50%',
            '&:hover': {
              background:
                isLastGroup && isLastItemVisible
                  ? undefined
                  : OpossumColors.lightGrey,
            },
          }}
          onClick={
            isLastGroup
              ? isLastItemVisible
                ? undefined
                : () => ref.current?.scrollToIndex({ index: 'LAST' })
              : () => ref.current?.scrollToIndex({ groupIndex: index + 1 })
          }
        />
      </MuiTooltip>
    );
  }
}
