// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useMemo } from 'react';
import {
  AttributionInfo,
  AttributionsWithResources,
} from '../../../shared/shared-types';
import { PathPredicate } from '../../types/types';
import {
  reportTableClasses,
  ReportTableHeader,
} from '../ReportTableHeader/ReportTableHeader';
import { List } from '../List/List';
import {
  ReportTableItem,
  reportTableRowHeight,
} from '../ReportTableItem/ReportTableItem';
import { useWindowHeight } from '../../util/use-window-height';
import { OpossumColors } from '../../shared-styles';
import { topBarHeight } from '../TopBar/TopBar';
import MuiBox from '@mui/material/Box';

const classes = {
  ...reportTableClasses,
  root: {
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingBottom: '10px',
    width: 'calc(100% - 20px)',
  },
  tableAndHeader: {
    overflow: 'overlay',
  },
  table: {
    backgroundColor: OpossumColors.white,
    borderCollapse: 'separate',
    borderSpacing: '0px',
  },
};

export interface TableConfig {
  attributionProperty: keyof AttributionInfo | 'icons';
  displayName: string;
  width?: 'verySmall' | 'small' | 'medium' | 'wide';
}

export const tableConfigs: Array<TableConfig> = [
  {
    attributionProperty: 'icons',
    displayName: '',
    width: 'verySmall',
  },
  {
    attributionProperty: 'packageName',
    displayName: 'Name',
    width: 'small',
  },
  {
    attributionProperty: 'packageVersion',
    displayName: 'Version',
    width: 'small',
  },
  {
    attributionProperty: 'licenseName',
    displayName: 'License',
    width: 'small',
  },
  {
    attributionProperty: 'licenseText',
    displayName: 'License Text',
    width: 'wide',
  },
  { attributionProperty: 'url', displayName: 'URL', width: 'medium' },
  {
    attributionProperty: 'resources',
    displayName: 'Resources',
    width: 'medium',
  },
  {
    attributionProperty: 'copyright',
    displayName: 'Copyright',
    width: 'medium',
  },
  {
    attributionProperty: 'attributionConfidence',
    displayName: 'Confidence',
    width: 'small',
  },
  { attributionProperty: 'comment', displayName: 'Comment', width: 'small' },
];

interface TableProps {
  attributionsWithResources: AttributionsWithResources;
  isFileWithChildren: PathPredicate;
  onIconClick(attributionId: string): void;
  topElement?: JSX.Element;
}

export function Table(props: TableProps): ReactElement | null {
  const tableHeaderOffset = 110;
  const maxHeight = useWindowHeight() - topBarHeight - tableHeaderOffset;
  const attributionsIds = useMemo(() => {
    return Object.keys(props.attributionsWithResources);
  }, [props.attributionsWithResources]);

  function getReportTableItem(index: number): ReactElement {
    const attributionId = attributionsIds[index];
    return (
      <ReportTableItem
        attributionInfo={props.attributionsWithResources[attributionId]}
        attributionId={attributionId}
        isFileWithChildren={props.isFileWithChildren}
        onIconClick={props.onIconClick}
      />
    );
  }

  return (
    <MuiBox sx={classes.root}>
      {props.topElement}
      {attributionsIds.length ? (
        <MuiBox sx={classes.tableAndHeader}>
          <MuiBox sx={{ ...classes.tableWidth, ...classes.table }}>
            <ReportTableHeader />
          </MuiBox>
          <MuiBox sx={classes.tableWidth}>
            <List
              length={attributionsIds.length}
              cardVerticalDistance={reportTableRowHeight}
              max={{ height: maxHeight }}
              getListItem={getReportTableItem}
              leftScrollBar={true}
            />
          </MuiBox>
        </MuiBox>
      ) : null}
    </MuiBox>
  );
}
