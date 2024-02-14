// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

import { text } from '../../../shared/text';
import { ROOT_PATH } from '../../shared-constants';
import { setSelectedResourceId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { useFilteredAttributions } from '../../state/variables/use-filtered-data';
import { notInTests } from '../../util/not-in-tests';
import { ReportTableHeader } from '../ReportTableHeader/ReportTableHeader';
import {
  REPORT_VIEW_ROW_HEIGHT,
  ReportTableItem,
} from '../ReportTableItem/ReportTableItem';
import { TABLE_COMPONENTS } from './TableConfig';

export function ReportView() {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const [{ attributions }, setFilteredAttributions] = useFilteredAttributions();
  const packageInfos = Object.values(attributions);
  const selectedIndex = useMemo(
    () => packageInfos.findIndex(({ id }) => id === selectedAttributionId),
    [packageInfos, selectedAttributionId],
  );

  // filtered attributions depend on the selected resource and the sorting
  // but in report view we want to see all attributions with the default sorting
  useEffect(() => {
    dispatch(setSelectedResourceId(ROOT_PATH));
    setFilteredAttributions((prev) => ({
      ...prev,
      sorting: text.sortings.name,
    }));
  }, [dispatch, setFilteredAttributions]);

  return (
    <TableVirtuoso
      // https://github.com/petyosi/react-virtuoso/issues/609
      style={{ overflowAnchor: 'none' }}
      components={TABLE_COMPONENTS}
      // https://github.com/petyosi/react-virtuoso/issues/1001
      initialTopMostItemIndex={notInTests(~selectedIndex && selectedIndex)}
      fixedHeaderContent={() => <ReportTableHeader />}
      data={packageInfos}
      fixedItemHeight={REPORT_VIEW_ROW_HEIGHT}
      defaultItemHeight={REPORT_VIEW_ROW_HEIGHT}
      itemContent={(_, packageInfo) => (
        <ReportTableItem packageInfo={packageInfo} />
      )}
    />
  );
}
