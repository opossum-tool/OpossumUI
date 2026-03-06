// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableContainer from '@mui/material/TableContainer';
import { upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';

import { QueryResult } from '../../../ElectronBackend/api/queries';
import { DEFAULT_USER_SETTINGS } from '../../../shared/shared-constants';
import { Order, TableOrdering } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { useUserSettings } from '../../state/variables/use-user-setting';
import {
  Column,
  ColumnConfig,
  orderLicenseTableRows,
  SingleColumn,
} from './AttributionCountPerSourcePerLicenseTable.util';
import { AttributionCountPerSourcePerLicenseTableFooter } from './AttributionCountPerSourcePerLicenseTableFooter/AttributionCountPerSourcePerLicenseTableFooter';
import { AttributionCountPerSourcePerLicenseTableHead } from './AttributionCountPerSourcePerLicenseTableHead/AttributionCountPerSourcePerLicenseTableHead';
import { AttributionCountPerSourcePerLicenseTableRow } from './AttributionCountPerSourcePerLicenseTableRow/AttributionCountPerSourcePerLicenseTableRow';

const classes = {
  container: {
    marginBottom: '3px',
  },
};

export interface AttributionCountPerSourcePerLicenseTableProps {
  tableData: QueryResult<'licenseTable'>;
}

export const AttributionCountPerSourcePerLicenseTable: React.FC<
  AttributionCountPerSourcePerLicenseTableProps
> = ({ tableData }) => {
  const componentText = text.attributionCountPerSourcePerLicenseTable;

  // Sort no source last
  const sourceNames = Object.keys(tableData.totals.perSource).toSorted(
    (a, b) => (a === '-' ? 1 : b === '-' ? -1 : a.localeCompare(b)),
  );

  const [userSettings, updateUserSettings] = useUserSettings();
  const showCriticality = userSettings.showCriticality;
  const showClassifications = userSettings.showClassifications;

  const getCriticalityColumn = useCallback((): Array<Column> => {
    if (showCriticality) {
      return [
        {
          columnName: componentText.columns.criticality.title,
          columnType: SingleColumn.CRITICALITY,
          columnId: SingleColumn.CRITICALITY,
          align: 'center',
          defaultOrder: 'desc',
        },
      ];
    }
    return [];
  }, [componentText.columns.criticality.title, showCriticality]);

  const getClassificationColumn = useCallback((): Array<Column> => {
    if (showClassifications) {
      return [
        {
          columnName: componentText.columns.classification,
          columnType: SingleColumn.CLASSIFICATION,
          columnId: SingleColumn.CLASSIFICATION,
          align: 'center',
          defaultOrder: 'desc',
        },
      ];
    }
    return [];
  }, [componentText.columns.classification, showClassifications]);

  const columnConfig: ColumnConfig = useMemo(
    () =>
      new ColumnConfig([
        {
          groupName: componentText.columns.licenseInfo,
          columns: [
            {
              columnName: componentText.columns.licenseName,
              columnType: SingleColumn.NAME,
              columnId: SingleColumn.NAME,
              align: 'left',
              defaultOrder: 'asc',
            },
            ...getCriticalityColumn(),
            ...getClassificationColumn(),
          ],
        },
        {
          groupName: componentText.columns.signalCountPerSource,
          columns: [
            ...sourceNames.map((sourceName) => ({
              columnName: upperFirst(sourceName),
              columnType: { sourceName },
              columnId: sourceName,
              align: 'center' as const,
              defaultOrder: 'desc' as Order,
            })),
            {
              columnName: componentText.columns.totalSources,
              columnType: SingleColumn.TOTAL,
              columnId: SingleColumn.TOTAL,
              align: 'center',
              defaultOrder: 'desc',
            },
          ],
        },
      ]),
    [
      componentText.columns.licenseInfo,
      componentText.columns.licenseName,
      componentText.columns.signalCountPerSource,
      componentText.columns.totalSources,
      getCriticalityColumn,
      getClassificationColumn,
      sourceNames,
    ],
  );

  const [ordering, setOrdering] = useState<TableOrdering>(
    userSettings.attributionTableOrdering,
  );
  const effectiveOrdering = columnConfig.getColumnById(ordering.orderedColumn)
    ? ordering
    : DEFAULT_USER_SETTINGS.attributionTableOrdering;

  const handleRequestSort = (columnId: string, defaultOrder: Order) => {
    let newOrdering: TableOrdering;
    if (
      effectiveOrdering !== ordering &&
      effectiveOrdering.orderedColumn === columnId
    ) {
      newOrdering = {
        ...effectiveOrdering,
        orderDirection:
          effectiveOrdering.orderDirection === 'asc' ? 'desc' : 'asc',
      };
    } else if (ordering.orderedColumn === columnId) {
      newOrdering = {
        ...ordering,
        orderDirection: ordering.orderDirection === 'asc' ? 'desc' : 'asc',
      };
    } else {
      newOrdering = {
        orderDirection: defaultOrder,
        orderedColumn: columnId,
      };
    }
    setOrdering(newOrdering);
    updateUserSettings({ attributionTableOrdering: newOrdering });
  };

  const orderedRows = useMemo(() => {
    const orderedColumnType = columnConfig.getColumnById(
      effectiveOrdering.orderedColumn,
    )?.columnType;

    return orderLicenseTableRows(
      tableData.perLicense,
      effectiveOrdering.orderDirection,
      orderedColumnType,
    );
  }, [
    columnConfig,
    effectiveOrdering.orderedColumn,
    effectiveOrdering.orderDirection,
    tableData.perLicense,
  ]);

  return (
    <MuiBox sx={{ display: 'flex', height: '100%' }}>
      <MuiTableContainer sx={classes.container}>
        <MuiTable size="small" stickyHeader>
          <AttributionCountPerSourcePerLicenseTableHead
            columnConfig={columnConfig}
            tableOrdering={effectiveOrdering}
            onRequestSort={handleRequestSort}
          />
          <MuiTableBody>
            {orderedRows.map((row, rowIndex) => (
              <AttributionCountPerSourcePerLicenseTableRow
                columnConfig={columnConfig}
                signalCountsPerSource={row.perSource}
                licenseName={row.licenseName ?? '-'}
                licenseCriticality={row.criticality}
                licenseClassification={row.classification}
                totalSignalCount={row.total}
                key={JSON.stringify([
                  row.licenseName,
                  row.criticality,
                  row.classification,
                ])}
                rowIndex={rowIndex}
              />
            ))}
          </MuiTableBody>
          <AttributionCountPerSourcePerLicenseTableFooter
            columnConfig={columnConfig}
            totalAttributionsPerSource={tableData.totals.perSource}
          />
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
};
