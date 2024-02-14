// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { defer, isEqual } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { Virtuoso, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';

import { LoadingMask } from '../LoadingMask/LoadingMask';
import { NoResults } from '../NoResults/NoResults';
import { StyledLinearProgress } from './List.style';

export interface ListProps<D> {
  className?: string;
  data: ReadonlyArray<D> | null;
  loading?: boolean;
  renderItemContent: (datum: D, index: number) => React.ReactNode;
  selected?: D;
  sx?: SxProps;
}

export function List<D>({
  className,
  data,
  loading,
  renderItemContent,
  selected,
  sx,
  ...props
}: ListProps<D> & Omit<VirtuosoProps<D, unknown>, 'data' | 'selected'>) {
  const ref = useRef<VirtuosoHandle>(null);

  const selectedIndex = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return data.findIndex((datum) => isEqual(datum, selected));
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
    >
      {loading && <StyledLinearProgress />}
      {renderList()}
    </LoadingMask>
  );

  function renderList() {
    if (!data) {
      return null;
    }

    if (!data.length && !loading) {
      return <NoResults />;
    }

    return (
      <Virtuoso
        ref={ref}
        data={data}
        itemContent={(index) => renderItemContent(data[index], index)}
        {...props}
      />
    );
  }
}
