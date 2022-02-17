// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement, useMemo } from 'react';
import {
  AttributionsWithResources,
  PackageInfo,
} from '../../../shared/shared-types';
import { PathPredicate } from '../../types/types';
import {
  ReportTableHeader,
  useStylesReportTableHeader,
} from '../ReportTableHeader/ReportTableHeader';
import { List } from '../List/List';
import {
  ReportTableItem,
  reportTableRowHeight,
} from '../ReportTableItem/ReportTableItem';
import { useWindowHeight } from '../../util/use-window-height';
import clsx from 'clsx';
import { OpossumColors } from '../../shared-styles';
import { topBarHeight } from '../TopBar/TopBar';

const useStyles = makeStyles({
  root: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
    width: 'calc(100% - 20px)',
  },
  tableAndHeader: {
    overflow: 'overlay',
  },
  table: {
    backgroundColor: OpossumColors.white,
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
});

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
  {
    attributionProperty: 'followUp',
    displayName: 'Follow-up',
    width: 'small',
  },
  {
    attributionProperty: 'excludeFromNotice',
    displayName: 'Excluded',
    width: 'small',
  },
  {
    attributionProperty: 'firstParty',
    displayName: 'First Party',
    width: 'small',
  },
];

export interface AttributionInfo extends PackageInfo {
  resources: Array<string>;
}

interface TableProps {
  attributionsWithResources: AttributionsWithResources;
  isFileWithChildren: PathPredicate;
  onIconClick(attributionId: string): void;
  topElement?: JSX.Element;
}

export function Table(props: TableProps): ReactElement | null {
  const classes = { ...useStylesReportTableHeader(), ...useStyles() };
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
    <div className={classes.root}>
      {props.topElement}
      {attributionsIds.length ? (
        <div className={classes.tableAndHeader}>
          <div className={clsx(classes.tableWidth, classes.table)}>
            <ReportTableHeader />
          </div>
          <div className={classes.tableWidth}>
            <List
              length={attributionsIds.length}
              cardVerticalDistance={reportTableRowHeight}
              max={{ height: maxHeight }}
              getListItem={getReportTableItem}
              leftScrollBar={true}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
