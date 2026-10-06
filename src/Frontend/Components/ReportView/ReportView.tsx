// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCell, TableRow } from '@mui/material';
import MuiButton from '@mui/material/Button';
import MuiLinearProgress from '@mui/material/LinearProgress';
import { defer } from 'lodash-es';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TableVirtuoso, type TableVirtuosoHandle } from 'react-virtuoso';

import { useAppSelector } from '../../state/hooks';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { useReportAttributionsList } from '../../util/use-report-attributions-list';
import { ReportTableHeader } from '../ReportTableHeader/ReportTableHeader';
import {
  REPORT_VIEW_ROW_HEIGHT,
  ReportTableItem,
} from '../ReportTableItem/ReportTableItem';
import {
  type ReportTableData,
  TABLE_COMPONENTS,
  tableConfigs,
} from './TableConfig';

export const ReportView: React.FC = () => {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const ref = useRef<TableVirtuosoHandle>(null);

  const {
    attributions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    nextPageError,
    resultSetKey,
    targetIndex,
    totalCount,
  } = useReportAttributionsList();

  const packageInfos = attributions && Object.values(attributions);
  const loadedPackageInfos = packageInfos ?? [];
  const effectiveTotalCount =
    totalCount === undefined
      ? undefined
      : Math.max(totalCount, loadedPackageInfos.length);
  const virtuosoData: Array<ReportTableData> =
    effectiveTotalCount === undefined
      ? loadedPackageInfos
      : Array.from(
          { length: effectiveTotalCount },
          (_, index) => loadedPackageInfos[index],
        );
  const hasUnloadedRows =
    packageInfos !== null &&
    effectiveTotalCount !== undefined &&
    effectiveTotalCount > loadedPackageInfos.length;
  const [visibleRange, setVisibleRange] = useState<{
    endIndex: number;
    resultSetKey: string;
  } | null>(null);
  const [readiness, setReadiness] = useState<{
    resultSetKey: string;
    ready: boolean;
  }>({ resultSetKey: '', ready: false });
  const isListReady =
    readiness.resultSetKey === resultSetKey && readiness.ready;
  const visibleEndIndex =
    visibleRange !== null && visibleRange.resultSetKey === resultSetKey
      ? visibleRange.endIndex
      : -1;

  useEffect(() => {
    if (packageInfos === null) {
      setVisibleRange(null);
      setReadiness({ resultSetKey, ready: false });
    }
  }, [packageInfos, resultSetKey]);

  useEffect(() => {
    if (
      !hasUnloadedRows ||
      visibleEndIndex < (packageInfos?.length ?? 0) ||
      isFetchingNextPage ||
      nextPageError
    ) {
      return;
    }
    void fetchNextPage(visibleEndIndex);
  }, [
    fetchNextPage,
    hasUnloadedRows,
    isFetchingNextPage,
    nextPageError,
    packageInfos?.length,
    visibleEndIndex,
  ]);

  const loadedSelectedIndex = packageInfos?.findIndex(
    ({ id }) => id === selectedAttributionId,
  );
  const selectedIndex = useMemo(
    () =>
      loadedSelectedIndex !== undefined && loadedSelectedIndex >= 0
        ? loadedSelectedIndex
        : targetIndex,
    // Object values are recreated on every render; only compare the index.
    [loadedSelectedIndex, targetIndex],
  );

  useEffect(() => {
    if (isListReady && selectedIndex !== undefined && selectedIndex >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: selectedIndex,
          align: 'center',
        }),
      );
    }
  }, [isListReady, selectedIndex]);

  if (!packageInfos) {
    return null;
  }

  return (
    <TableVirtuoso<ReportTableData>
      aria-label={'report view'}
      ref={ref}
      // https://github.com/petyosi/react-virtuoso/issues/609
      style={{ overflowAnchor: 'none' }}
      components={TABLE_COMPONENTS}
      fixedHeaderContent={() => (
        <ReportTableHeader empty={packageInfos.length === 0} />
      )}
      fixedFooterContent={() => (
        <ReportTableFooter
          loading={isFetchingNextPage}
          error={nextPageError}
          onRetry={() => void fetchNextPage(visibleEndIndex)}
        />
      )}
      data={virtuosoData}
      {...(effectiveTotalCount === undefined
        ? {}
        : { totalCount: effectiveTotalCount })}
      rangeChanged={(range) =>
        setVisibleRange({ endIndex: range.endIndex, resultSetKey })
      }
      itemsRendered={(items) => {
        if (items.some((item) => item.size > 0)) {
          defer(() =>
            setReadiness((current) =>
              current.resultSetKey === resultSetKey && current.ready
                ? current
                : { resultSetKey, ready: true },
            ),
          );
        }
      }}
      fixedItemHeight={REPORT_VIEW_ROW_HEIGHT}
      defaultItemHeight={REPORT_VIEW_ROW_HEIGHT}
      endReached={
        hasUnloadedRows
          ? undefined
          : hasNextPage
            ? (endIndex) => void fetchNextPage(endIndex)
            : undefined
      }
      itemContent={(_index, packageInfo) =>
        packageInfo ? (
          <ReportTableItem packageInfo={packageInfo} />
        ) : (
          tableConfigs.map((config) => (
            <TableCell
              key={`table-placeholder-${config.attributionProperty}`}
              sx={{ height: REPORT_VIEW_ROW_HEIGHT }}
            />
          ))
        )
      }
    />
  );
};

function ReportTableFooter({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={tableConfigs.length} padding={'none'}>
          <MuiLinearProgress />
        </TableCell>
      </TableRow>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={tableConfigs.length} align={'center'}>
          <MuiButton size={'small'} onClick={onRetry}>
            {'Retry'}
          </MuiButton>
        </TableCell>
      </TableRow>
    );
  }

  return null;
}
