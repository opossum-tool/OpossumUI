// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import { SxProps } from '@mui/system';
import { defer } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GroupedVirtuoso,
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps,
} from 'react-virtuoso';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { NoResults } from '../NoResults/NoResults';
import { GroupContainer, StyledLinearProgress } from './GroupedList.style';

export interface GroupedListProps {
  className?: string;
  grouped: Record<string, ReadonlyArray<string>> | null;
  loading?: boolean;
  renderGroupName?: (key: string) => React.ReactNode;
  renderItemContent: (datum: string, index: number) => React.ReactNode;
  selected?: string;
  sx?: SxProps;
  testId?: string;
}

export function GroupedList({
  className,
  grouped,
  loading,
  renderGroupName,
  renderItemContent,
  selected,
  sx,
  testId,
  ...props
}: GroupedListProps & Omit<GroupedVirtuosoProps<string, unknown>, 'selected'>) {
  const ref = useRef<GroupedVirtuosoHandle>(null);
  const [{ startIndex, endIndex }, setRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>({ startIndex: 0, endIndex: 0 });

  const groups = useMemo(() => {
    if (!grouped) {
      return null;
    }

    const flattened = Object.values(grouped).flat();

    return {
      ids: flattened,
      keys: Object.keys(grouped),
      counts: Object.values(grouped).map((group) => group.length),
      selectedIndex: flattened.findIndex((datum) => datum === selected),
    };
  }, [grouped, selected]);

  useEffect(() => {
    if (groups?.selectedIndex !== undefined && groups.selectedIndex >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: groups.selectedIndex,
          align: 'center',
        }),
      );
    }
  }, [groups?.selectedIndex]);

  return (
    <LoadingMask
      className={className}
      sx={{ position: 'relative', ...sx }}
      active={loading}
      testId={testId}
    >
      {loading && <StyledLinearProgress data-testid={'loading'} />}
      {renderGroups()}
    </LoadingMask>
  );

  function renderGroups() {
    if (!groups) {
      return null;
    }

    return (
      <GroupedVirtuoso
        ref={ref}
        components={{
          EmptyPlaceholder:
            loading || groups.ids.length ? undefined : () => <NoResults />,
        }}
        rangeChanged={setRange}
        groupCounts={groups?.counts}
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
        itemContent={(index) => renderItemContent(groups.ids[index], index)}
        {...props}
      />
    );
  }

  function renderJumpUp(index: number) {
    if (!groups) {
      return null;
    }

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
    if (!groups) {
      return null;
    }

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
