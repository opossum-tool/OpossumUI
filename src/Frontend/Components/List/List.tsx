// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { useVirtuosoRefs } from '../../util/use-virtuoso-refs';
import { EmptyPlaceholder } from '../EmptyPlaceholder/EmptyPlaceholder';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { VirtuosoComponentContext } from '../VirtuosoComponentContext/VirtuosoComponentContext';
import { StyledLinearProgress } from './List.style';

export interface ListItemContentProps {
  index: number;
  selected: boolean;
  focused: boolean;
}

export type BaseItem = { id: unknown };

interface ListProps<ItemType extends BaseItem> {
  className?: string;
  data: ReadonlyArray<ItemType> | null;
  loading?: boolean;
  renderItemContent: (
    datum: ItemType,
    props: ListItemContentProps,
  ) => React.ReactNode;
  selectedId?: string;
  sx?: SxProps;
  testId?: string;
}

export function List<ItemType extends BaseItem>({
  className,
  data,
  loading,
  renderItemContent,
  selectedId,
  sx,
  testId,
  components,
  ...props
}: ListProps<ItemType> &
  Omit<VirtuosoProps<ItemType, unknown>, 'data' | 'selected'>) {
  const {
    focusedIndex,
    ref,
    scrollerRef,
    setIsVirtuosoFocused,
    selectedIndex,
    isVirtuosoFocused,
  } = useVirtuosoRefs<ItemType, VirtuosoHandle>({
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
        // Virtuoso components must not be inlined: https://github.com/petyosi/react-virtuoso/issues/566
        <VirtuosoComponentContext value={{ isVirtuosoFocused, loading }}>
          <Virtuoso
            ref={ref}
            onFocus={() => setIsVirtuosoFocused(true)}
            onBlur={() => setIsVirtuosoFocused(false)}
            tabIndex={-1}
            components={{
              EmptyPlaceholder,
              ...components,
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
        </VirtuosoComponentContext>
      )}
    </LoadingMask>
  );
}
