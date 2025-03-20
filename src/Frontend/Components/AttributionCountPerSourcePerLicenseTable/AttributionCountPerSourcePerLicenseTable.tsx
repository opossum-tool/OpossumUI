// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableContainer from '@mui/material/TableContainer';
import { orderBy, upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import { useShowClassifications } from '../../state/variables/use-show-classifications';
import { useShowCriticality } from '../../state/variables/use-show-criticality';
import {
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { Order } from '../TableCellWithSorting/TableCellWithSorting';
import {
  Column,
  ColumnConfig,
  orderLicenseNames,
  SingleColumn,
  TableOrdering,
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
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
}

const defaultOrdering: TableOrdering = {
  orderDirection: 'asc',
  orderedColumn: SingleColumn.NAME,
};
export const AttributionCountPerSourcePerLicenseTable: React.FC<
  AttributionCountPerSourcePerLicenseTableProps
> = (props) => {
  const componentText = text.attributionCountPerSourcePerLicenseTable;

  const sourceNames = Object.keys(
    props.licenseCounts.totalAttributionsPerSource,
  );

  const showCriticality = useShowCriticality();
  const showClassifications = useShowClassifications();

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

  const [ordering, setOrdering] = useState<TableOrdering>(defaultOrdering);
  const effectiveOrdering = columnConfig.getColumnById(ordering.orderedColumn)
    ? ordering
    : defaultOrdering;

  const handleRequestSort = (columnId: string, defaultOrder: Order) => {
    if (
      effectiveOrdering !== ordering &&
      effectiveOrdering.orderedColumn === columnId
    ) {
      setOrdering({
        ...effectiveOrdering,
        orderDirection:
          effectiveOrdering.orderDirection === 'asc' ? 'desc' : 'asc',
      });
    } else if (ordering.orderedColumn === columnId) {
      setOrdering((currentOrdering) => ({
        ...currentOrdering,
        orderDirection:
          currentOrdering.orderDirection === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setOrdering({
        orderDirection: defaultOrder,
        orderedColumn: columnId,
      });
    }
  };

  const orderedLicenseNames = useMemo(() => {
    const orderedColumnType = columnConfig.getColumnById(
      effectiveOrdering.orderedColumn,
    )?.columnType;

    if (orderedColumnType === undefined) {
      return orderBy(
        Object.keys(props.licenseNamesWithCriticality),
        (licenseName) => licenseName.toLowerCase(),
        effectiveOrdering.orderDirection,
      );
    }

    return orderLicenseNames(
      props.licenseNamesWithCriticality,
      props.licenseNamesWithClassification,
      props.licenseCounts,
      effectiveOrdering.orderDirection,
      orderedColumnType,
    );
  }, [
    columnConfig,
    effectiveOrdering.orderedColumn,
    effectiveOrdering.orderDirection,
    props.licenseNamesWithCriticality,
    props.licenseNamesWithClassification,
    props.licenseCounts,
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
            {orderedLicenseNames.map((licenseName, rowIndex) => (
              <AttributionCountPerSourcePerLicenseTableRow
                columnConfig={columnConfig}
                signalCountsPerSource={
                  props.licenseCounts.attributionCountPerSourcePerLicense[
                    licenseName
                  ]
                }
                licenseName={licenseName}
                licenseCriticality={
                  props.licenseNamesWithCriticality[licenseName]
                }
                licenseClassification={
                  props.licenseNamesWithClassification[licenseName]
                }
                totalSignalCount={
                  props.licenseCounts.totalAttributionsPerLicense[licenseName]
                }
                key={rowIndex}
                rowIndex={rowIndex}
              />
            ))}
          </MuiTableBody>
          <AttributionCountPerSourcePerLicenseTableFooter
            columnConfig={columnConfig}
            totalAttributionsPerSource={
              props.licenseCounts.totalAttributionsPerSource
            }
          />
        </MuiTable>
      </MuiTableContainer>
    </MuiBox>
  );
};
