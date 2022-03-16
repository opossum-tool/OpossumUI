// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { getFormattedCellData } from './report-table-item-helpers';
import clsx from 'clsx';
import MuiTypography from '@mui/material/Typography';
import {
  CommentIcon,
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { TableConfig, tableConfigs } from '../Table/Table';
import makeStyles from '@mui/styles/makeStyles';
import { clickableIcon, OpossumColors } from '../../shared-styles';
import { PathPredicate } from '../../types/types';
import { useStylesReportTableHeader } from '../ReportTableHeader/ReportTableHeader';
import { AttributionInfo, Source } from '../../../shared/shared-types';
import { IconButton } from '../IconButton/IconButton';
import EditorIcon from '@mui/icons-material/Edit';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { getPackageInfoKeys } from '../../../shared/shared-util';
import { getFrequentLicensesTexts } from '../../state/selectors/all-views-resource-selectors';
import { useAppSelector } from '../../state/hooks';

export const reportTableRowHeight = 190;
const padding = 10;

const useStyles = makeStyles({
  tableData: {
    overflow: 'auto',
    whiteSpace: 'pre-line',
    padding,
    height: reportTableRowHeight - 2 * padding,
  },
  noWrap: {
    whiteSpace: 'pre',
  },
  bold: {
    fontWeight: 'bold',
  },
  greyText: {
    color: OpossumColors.disabledGrey,
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
  iconButton: {
    marginBottom: 5,
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
  clickableIcon,
});

const CELLS_WITHOUT_TEXT_WRAP = [
  'resources',
  'url',
  'copyright',
  'licenseText',
];

type CellData = number | string | Source;

interface ReportTableItemProps {
  attributionInfo: AttributionInfo;
  attributionId: string;
  isFileWithChildren: PathPredicate;
  onIconClick(attributionId: string): void;
}

export function ReportTableItem(props: ReportTableItemProps): ReactElement {
  const classes = { ...useStylesReportTableHeader(), ...useStyles() };
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);

  function isPackageInfoIncomplete(attributionInfo: AttributionInfo): boolean {
    return getPackageInfoKeys().some((attributionProperty) =>
      isImportantAttributionInformationMissing(
        attributionProperty,
        attributionInfo
      )
    );
  }

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
    const hasFrequentLicenseName =
      attributionInfo.licenseName &&
      Object.keys(frequentLicenseTexts).includes(attributionInfo.licenseName);
    const isFrequentLicenseAndHasNoText =
      hasFrequentLicenseName && !attributionInfo.licenseText;
    const displayAttributionInfo =
      attributionInfo.licenseName && isFrequentLicenseAndHasNoText
        ? {
            ...attributionInfo,
            licenseText: frequentLicenseTexts[attributionInfo.licenseName],
          }
        : attributionInfo;

    const cellData = getFormattedCellData(
      config,
      displayAttributionInfo,
      props.isFileWithChildren
    );

    return (
      <div
        className={clsx(
          classes.borders,
          classes.scrollableTableCell,
          config.attributionProperty === 'icons'
            ? [
                classes.iconTableCell,
                isPackageInfoIncomplete(attributionInfo) &&
                  classes.markedTableCell,
              ]
            : [
                classes.tableCell,
                isImportantAttributionInformationMissing(
                  config.attributionProperty,
                  attributionInfo
                ) && classes.markedTableCell,
              ],
          config.width === 'small'
            ? classes.smallTableCell
            : config.width === 'wide'
            ? classes.wideTableCell
            : config.width === 'medium'
            ? classes.mediumTableCell
            : config.width === 'verySmall'
            ? classes.verySmallTableCell
            : undefined
        )}
        key={`table-row-${config.attributionProperty}-${index}`}
      >
        {config.attributionProperty !== 'icons' && (
          <MuiTypography
            className={clsx(
              classes.tableData,
              CELLS_WITHOUT_TEXT_WRAP.includes(config.attributionProperty) &&
                classes.noWrap,
              config.attributionProperty === 'licenseName' &&
                hasFrequentLicenseName &&
                classes.bold,
              config.attributionProperty === 'licenseText' &&
                isFrequentLicenseAndHasNoText &&
                classes.greyText
            )}
            component={'div'}
          >
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
          <IconButton
            tooltipTitle="edit"
            placement="left"
            className={clsx(classes.iconButton)}
            onClick={(): void => {
              props.onIconClick(attributionId);
            }}
            icon={
              <EditorIcon
                className={clsx(
                  classes.editIcon,
                  classes.icon,
                  classes.clickableIcon
                )}
                aria-label={`edit ${attributionInfo['packageName'] || ''}`}
              />
            }
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
