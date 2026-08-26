// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { TableCell, TableRow } from '@mui/material';
import MuiButton from '@mui/material/Button';
import MuiLinearProgress from '@mui/material/LinearProgress';
import { defer } from 'lodash-es';
import { useEffect, useMemo, useRef } from 'react';
import { TableVirtuoso, type TableVirtuosoHandle } from 'react-virtuoso';

import { useAppSelector } from '../../state/hooks';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { useReportAttributionsList } from '../../util/use-report-attributions-list';
import { ReportTableHeader } from '../ReportTableHeader/ReportTableHeader';
import {
  REPORT_VIEW_ROW_HEIGHT,
  ReportTableItem,
} from '../ReportTableItem/ReportTableItem';
import { TABLE_COMPONENTS, tableConfigs } from './TableConfig';

export const ReportView: React.FC = () => {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const ref = useRef<TableVirtuosoHandle>(null);

  const {
    attributions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    nextPageError,
  } = useReportAttributionsList();

  const packageInfos = attributions && Object.values(attributions);

  const selectedIndex = useMemo(
    () => packageInfos?.findIndex(({ id }) => id === selectedAttributionId),
    [packageInfos, selectedAttributionId],
  );

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

  if (!packageInfos) {
    return null;
  }

  return (
    <TableVirtuoso
      aria-label={'report view'}
      ref={ref}
      // https://github.com/petyosi/react-virtuoso/issues/609
      style={{ overflowAnchor: 'none' }}
      components={TABLE_COMPONENTS}
      fixedHeaderContent={() => (
        <ReportTableHeader
          loading={attributions === null}
          empty={packageInfos.length === 0}
        />
      )}
      fixedFooterContent={() => (
        <ReportTableFooter
          loading={isFetchingNextPage}
          error={nextPageError}
          onRetry={() => void fetchNextPage()}
        />
      )}
      data={packageInfos}
      fixedItemHeight={REPORT_VIEW_ROW_HEIGHT}
      defaultItemHeight={REPORT_VIEW_ROW_HEIGHT}
      endReached={hasNextPage ? () => void fetchNextPage() : undefined}
      itemContent={(_, packageInfo) => (
        <ReportTableItem packageInfo={packageInfo} />
      )}
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
