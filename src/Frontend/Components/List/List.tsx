// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { defer } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { LoadingMask } from '../LoadingMask/LoadingMask';
import { NoResults } from '../NoResults/NoResults';
import { StyledLinearProgress } from './List.style';

export interface ListProps {
  className?: string;
  data: ReadonlyArray<string> | null;
  loading?: boolean;
  renderItemContent: (datum: string, index: number) => React.ReactNode;
  selected?: string;
  sx?: SxProps;
  testId?: string;
}

export function List({
  className,
  data,
  loading,
  renderItemContent,
  selected,
  sx,
  testId,
  ...props
}: ListProps & Omit<VirtuosoProps<string, unknown>, 'data' | 'selected'>) {
  const ref = useRef<VirtuosoHandle>(null);

  const selectedIndex = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return data.findIndex((datum) => datum === selected);
  }, [data, selected]);

  useEffect(() => {
    if (selectedIndex !== undefined && selectedIndex >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: selectedIndex,
          align: 'center',
        }),
      );
    }
  }, [selectedIndex]);

  return (
    <LoadingMask
      className={className}
      sx={{ position: 'relative', ...sx }}
      active={loading}
      testId={testId}
    >
      {loading && <StyledLinearProgress data-testid={'loading'} />}
      {renderList()}
    </LoadingMask>
  );

  function renderList() {
    if (!data) {
      return null;
    }

    return (
      <Virtuoso
        ref={ref}
        components={{
          EmptyPlaceholder:
            loading || data.length ? undefined : () => <NoResults />,
        }}
        data={data}
        itemContent={(index) => renderItemContent(data[index], index)}
        {...props}
      />
    );
  }
}
