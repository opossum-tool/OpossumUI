// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { defer } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { TableVirtuoso, TableVirtuosoHandle } from 'react-virtuoso';

import { useAppSelector } from '../../state/hooks';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { useFilteredAttributionsInReportView } from '../../state/variables/use-filtered-data';
import { ReportTableHeader } from '../ReportTableHeader/ReportTableHeader';
import {
  REPORT_VIEW_ROW_HEIGHT,
  ReportTableItem,
} from '../ReportTableItem/ReportTableItem';
import { TABLE_COMPONENTS } from './TableConfig';

export const ReportView: React.FC = () => {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const ref = useRef<TableVirtuosoHandle>(null);

  const [{ attributions }] = useFilteredAttributionsInReportView();
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
      fixedHeaderContent={() => <ReportTableHeader />}
      data={packageInfos}
      fixedItemHeight={REPORT_VIEW_ROW_HEIGHT}
      defaultItemHeight={REPORT_VIEW_ROW_HEIGHT}
      itemContent={(_, packageInfo) => (
        <ReportTableItem packageInfo={packageInfo} />
      )}
    />
  );
};
