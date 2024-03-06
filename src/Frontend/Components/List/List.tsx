// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { useVirtuosoRefs } from '../../util/use-virtuoso-refs';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { NoResults } from '../NoResults/NoResults';
import { StyledLinearProgress } from './List.style';

export interface ListItemContentProps {
  index: number;
  selected: boolean;
  focused: boolean;
}

export interface ListProps {
  className?: string;
  data: ReadonlyArray<string> | null;
  loading?: boolean;
  renderItemContent: (
    datum: string,
    props: ListItemContentProps,
  ) => React.ReactNode;
  selectedId?: string;
  sx?: SxProps;
  testId?: string;
}

export function List({
  className,
  data,
  loading,
  renderItemContent,
  selectedId,
  sx,
  testId,
  ...props
}: ListProps & Omit<VirtuosoProps<string, unknown>, 'data' | 'selected'>) {
  const {
    focusedIndex,
    ref,
    scrollerRef,
    setIsVirtuosoFocused,
    selectedIndex,
  } = useVirtuosoRefs<VirtuosoHandle>({
    data,
    selectedId,
  });

  return (
    <LoadingMask
      className={className}
      sx={{ position: 'relative', ...sx }}
      active={loading}
      testId={testId}
    >
      {loading && <StyledLinearProgress data-testid={'loading'} />}
      {data && (
        <Virtuoso
          ref={ref}
          onFocus={() => setIsVirtuosoFocused(true)}
          onBlur={() => setIsVirtuosoFocused(false)}
          components={{
            EmptyPlaceholder:
              loading || data.length ? undefined : () => <NoResults />,
          }}
          scrollerRef={scrollerRef}
          data={data}
          itemContent={(index) =>
            renderItemContent(data[index], {
              index,
              selected: index === selectedIndex,
              focused: index === focusedIndex,
            })
          }
          {...props}
        />
      )}
    </LoadingMask>
  );
}
