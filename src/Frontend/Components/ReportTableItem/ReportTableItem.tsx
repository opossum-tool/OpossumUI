// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import {
  getFormattedCellData,
  isMarkedTableCell,
} from './report-table-item-helpers';
import clsx from 'clsx';
import MuiTypography from '@material-ui/core/Typography';
import {
  CommentIcon,
  EditIcon,
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { AttributionInfo, TableConfig, tableConfigs } from '../Table/Table';
import { makeStyles } from '@material-ui/core/styles';
import { OpossumColors } from '../../shared-styles';
import { PathPredicate } from '../../types/types';
import { useStylesReportTableHeader } from '../ReportTableHeader/ReportTableHeader';
import { Source } from '../../../shared/shared-types';

export const reportTableRowHeight = 190;
const padding = 10;

const useStyles = makeStyles({
  tableData: {
    overflow: 'auto',
    whiteSpace: 'pre-line',
    padding: padding,
    height: reportTableRowHeight - 2 * padding,
  },
  iconTableData: {
    overflow: 'hidden',
    whiteSpace: 'pre-line',
    paddingTop: 7,
    paddingBottom: 7,
    height: reportTableRowHeight - 2 * padding,
    textAlign: 'center',
  },
  tableCell: {
    flex: '1 1 auto',
    overflowY: 'auto',
    verticalAlign: 'middle',
  },
  scrollableTableCell: { overflow: 'hidden' },
  iconTableCell: {
    flex: '1 1 auto',
    overflowY: 'auto',
    verticalAlign: 'text-top',
    borderRightWidth: 0.5,
  },
  borders: {
    border: `0.5px ${OpossumColors.lightBlue} solid`,
  },
  icon: {
    width: 15,
    height: 15,
    margin: 1,
  },
  editIcon: {
    backgroundColor: OpossumColors.white,
    border: `2px ${OpossumColors.darkBlue} solid`,
  },
  firstPartyIcon: {
    border: `2px ${OpossumColors.darkBlue} solid`,
    color: OpossumColors.darkBlue,
  },
  commentIcon: {
    border: `2px ${OpossumColors.black} solid`,
    color: OpossumColors.black,
  },
  followUpIcon: {
    border: `2px ${OpossumColors.red} solid`,
    color: OpossumColors.red,
  },
  excludeFromNoticeIcon: {
    border: `2px ${OpossumColors.grey} solid`,
    color: OpossumColors.grey,
  },
  preSelectedIcon: {
    border: `2px ${OpossumColors.brown} solid`,
    color: OpossumColors.brown,
  },
  markedTableCell: {
    backgroundColor: OpossumColors.lightOrange,
  },
  tableRow: {
    display: 'flex',
    minWidth: 2480,
    backgroundColor: OpossumColors.white,
    alignItems: 'stretch',
  },
  containerWithoutLineBreak: {
    whiteSpace: 'nowrap',
  },
});

type CellData = number | string | Source;

interface ReportTableItemProps {
  attributionInfo: AttributionInfo;
  attributionId: string;
  isFileWithChildren: PathPredicate;
  onIconClick(attributionId: string): void;
}

export function ReportTableItem(props: ReportTableItemProps): ReactElement {
  const classes = { ...useStylesReportTableHeader(), ...useStyles() };

  function getTableRow(
    attributionInfo: AttributionInfo,
    attributionId: string
  ): ReactElement {
    return (
      <div
        key={`table-row-${attributionInfo.packageName}-${attributionId}`}
        className={classes.tableRow}
      >
        {tableConfigs.map((config, index) =>
          getTableCell(attributionInfo, attributionId, config, index)
        )}
      </div>
    );
  }

  function getTableCell(
    attributionInfo: AttributionInfo,
    attributionId: string,
    config: TableConfig,
    index: number
  ): ReactElement {
    const cellData = getFormattedCellData(
      config,
      attributionInfo,
      props.isFileWithChildren
    );

    return (
      <div
        className={clsx(
          classes.borders,
          classes.scrollableTableCell,
          config.attributionProperty === 'icons'
            ? [classes.iconTableCell]
            : [classes.tableCell],
          config.width === 'small'
            ? classes.smallTableCell
            : config.width === 'wide'
            ? classes.wideTableCell
            : config.width === 'medium'
            ? classes.mediumTableCell
            : config.width === 'verySmall'
            ? classes.verySmallTableCell
            : undefined,
          isMarkedTableCell(config, attributionInfo) && classes.markedTableCell
        )}
        key={`table-row-${config.attributionProperty}-${index}`}
      >
        {config.attributionProperty !== 'icons' && (
          <MuiTypography className={classes.tableData} component={'div'}>
            {getCellData(cellData, config.attributionProperty)}
          </MuiTypography>
        )}
        {config.attributionProperty === 'icons' &&
          getIcons(attributionInfo, attributionId)}
      </div>
    );
  }

  function getCellData(
    cellData: CellData,
    attributionProperty: keyof AttributionInfo
  ): ReactElement {
    if (attributionProperty === 'resources' && typeof cellData === 'string') {
      return (
        <div>
          {cellData.split('\n').map((path, index) => (
            <div
              key={`table-cell-content-${attributionProperty}-${index}`}
              className={classes.containerWithoutLineBreak}
            >
              {path}
            </div>
          ))}
        </div>
      );
    } else if (attributionProperty === 'url') {
      return (
        <div className={classes.containerWithoutLineBreak}>{cellData}</div>
      );
    }
    return <div>{cellData}</div>;
  }

  function getIcons(
    attributionInfo: AttributionInfo,
    attributionId: string
  ): ReactElement {
    return (
      <div className={classes.iconTableData}>
        <>
          <EditIcon
            className={clsx(classes.editIcon, classes.icon)}
            onClick={(): void => props.onIconClick(attributionId)}
            label={attributionInfo['packageName'] || ''}
          />
          <br />
        </>
        {attributionInfo.followUp && (
          <>
            <FollowUpIcon
              className={clsx(classes.icon, classes.followUpIcon)}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.comment && (
          <>
            <CommentIcon className={clsx(classes.icon, classes.commentIcon)} />{' '}
            <br />
          </>
        )}
        {attributionInfo.firstParty && (
          <>
            <FirstPartyIcon
              className={clsx(classes.icon, classes.firstPartyIcon)}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.excludeFromNotice && (
          <>
            <ExcludeFromNoticeIcon
              className={clsx(classes.icon, classes.excludeFromNoticeIcon)}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.preSelected && (
          <>
            <PreSelectedIcon
              className={clsx(classes.icon, classes.preSelectedIcon)}
            />{' '}
            <br />
          </>
        )}
      </div>
    );
  }

  return getTableRow(props.attributionInfo, props.attributionId);
}
