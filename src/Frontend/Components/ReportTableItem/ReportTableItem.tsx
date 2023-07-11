// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { getFormattedCellData } from './report-table-item-helpers';
import MuiTypography from '@mui/material/Typography';
import {
  CommentIcon,
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  NeedsReviewIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { TableConfig, tableConfigs } from '../Table/Table';
import { clickableIcon, OpossumColors } from '../../shared-styles';
import { PathPredicate } from '../../types/types';
import { reportTableClasses } from '../ReportTableHeader/ReportTableHeader';
import { AttributionInfo } from '../../../shared/shared-types';
import { IconButton } from '../IconButton/IconButton';
import EditorIcon from '@mui/icons-material/Edit';
import {
  isImportantAttributionInformationMissing,
  isPackageInfoIncomplete,
} from '../../util/is-important-attribution-information-missing';
import { getFrequentLicensesTexts } from '../../state/selectors/all-views-resource-selectors';
import { useAppSelector } from '../../state/hooks';
import MuiBox from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { openUrl } from '../../util/open-url';

export const reportTableRowHeight = 190;
const padding = 10;

const classes = {
  tableData: {
    overflow: 'auto',
    whiteSpace: 'pre-line',
    padding: `${padding}px`,
    height: `${reportTableRowHeight - 2 * padding}px`,
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
    paddingTop: '7px',
    paddingBottom: '7px',
    height: `${reportTableRowHeight - 2 * padding}px`,
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
    borderRightWidth: '0.5px',
  },
  borders: {
    border: `0.5px ${OpossumColors.lightBlue} solid`,
  },
  icon: {
    width: '15px',
    height: '15px',
    margin: '1px',
  },
  iconButton: {
    marginBottom: '5px',
  },
  editIcon: {
    backgroundColor: OpossumColors.white,
    border: `2px ${OpossumColors.brown} solid`,
    color: OpossumColors.brown,
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
  needsReviewIcon: {
    border: `2px ${OpossumColors.orange} solid`,
    color: OpossumColors.orange,
  },
  excludeFromNoticeIcon: {
    border: `2px ${OpossumColors.grey} solid`,
    color: OpossumColors.grey,
  },
  preSelectedIcon: {
    border: `2px ${OpossumColors.darkBlue} solid`,
    color: OpossumColors.darkBlue,
  },
  markedTableCell: {
    backgroundColor: OpossumColors.lightOrange,
  },
  tableRow: {
    display: 'flex',
    minWidth: '2480px',
    backgroundColor: OpossumColors.white,
    alignItems: 'stretch',
  },
  containerWithoutLineBreak: {
    whiteSpace: 'nowrap',
  },
  clickableIcon,
};

const CELLS_WITHOUT_TEXT_WRAP = [
  'resources',
  'url',
  'copyright',
  'licenseText',
];

interface ReportTableItemProps {
  attributionInfo: AttributionInfo;
  attributionId: string;
  isFileWithChildren: PathPredicate;
  onIconClick(attributionId: string): void;
}

export function ReportTableItem(props: ReportTableItemProps): ReactElement {
  const reportTableItemClasses = { ...reportTableClasses, ...classes };
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);

  function getTableRow(
    attributionInfo: AttributionInfo,
    attributionId: string,
  ): ReactElement {
    return (
      <MuiBox
        key={`table-row-${attributionInfo.packageName}-${attributionId}`}
        sx={reportTableItemClasses.tableRow}
      >
        {tableConfigs.map((config, index) =>
          getTableCell(attributionInfo, attributionId, config, index),
        )}
      </MuiBox>
    );
  }

  function getTableCell(
    attributionInfo: AttributionInfo,
    attributionId: string,
    config: TableConfig,
    index: number,
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
      props.isFileWithChildren,
    );

    return (
      <MuiBox
        sx={{
          ...reportTableItemClasses.borders,
          ...reportTableItemClasses.scrollableTableCell,
          ...(config.attributionProperty === 'icons'
            ? {
                ...classes.iconTableCell,
                ...(isPackageInfoIncomplete(attributionInfo)
                  ? classes.markedTableCell
                  : {}),
              }
            : {
                ...classes.tableCell,
                ...(isImportantAttributionInformationMissing(
                  config.attributionProperty,
                  attributionInfo,
                )
                  ? classes.markedTableCell
                  : {}),
              }),
          ...(config.width === 'small'
            ? reportTableItemClasses.smallTableCell
            : config.width === 'wide'
            ? reportTableItemClasses.wideTableCell
            : config.width === 'medium'
            ? reportTableItemClasses.mediumTableCell
            : config.width === 'verySmall'
            ? reportTableItemClasses.verySmallTableCell
            : {}),
        }}
        key={`table-row-${config.attributionProperty}-${index}`}
      >
        {config.attributionProperty !== 'icons' && (
          <MuiTypography
            sx={{
              ...classes.tableData,
              ...(CELLS_WITHOUT_TEXT_WRAP.includes(config.attributionProperty)
                ? classes.noWrap
                : {}),
              ...(config.attributionProperty === 'licenseName' &&
              hasFrequentLicenseName
                ? classes.bold
                : {}),
              ...(config.attributionProperty === 'licenseText' &&
              isFrequentLicenseAndHasNoText
                ? classes.greyText
                : {}),
            }}
            component={'div'}
          >
            {getCellData(cellData, config.attributionProperty)}
          </MuiTypography>
        )}
        {config.attributionProperty === 'icons' &&
          getIcons(attributionInfo, attributionId)}
      </MuiBox>
    );
  }

  function getCellData(
    cellData: string | number,
    attributionProperty: keyof AttributionInfo,
  ): ReactElement {
    if (attributionProperty === 'resources' && typeof cellData === 'string') {
      return (
        <div>
          {cellData.split('\n').map((path, index) => (
            <MuiBox
              key={`table-cell-content-${attributionProperty}-${index}`}
              sx={reportTableItemClasses.containerWithoutLineBreak}
            >
              {path}
            </MuiBox>
          ))}
        </div>
      );
    } else if (attributionProperty === 'url') {
      return (
        <MuiBox sx={reportTableItemClasses.containerWithoutLineBreak}>
          <MuiLink
            component="button"
            onClick={(): void => openUrl(cellData.toString())}
          >
            {cellData}
          </MuiLink>
        </MuiBox>
      );
    }
    return <div>{cellData}</div>;
  }

  function getIcons(
    attributionInfo: AttributionInfo,
    attributionId: string,
  ): ReactElement {
    return (
      <MuiBox sx={reportTableItemClasses.iconTableData}>
        <>
          <IconButton
            tooltipTitle="edit"
            tooltipPlacement="left"
            sx={classes.iconButton}
            onClick={(): void => {
              props.onIconClick(attributionId);
            }}
            icon={
              <EditorIcon
                sx={{
                  ...reportTableItemClasses.icon,
                  ...reportTableItemClasses.clickableIcon,
                  ...reportTableItemClasses.editIcon,
                }}
                aria-label={`edit ${attributionInfo['packageName'] || ''}`}
              />
            }
          />
          <br />
        </>
        {attributionInfo.needsReview && (
          <>
            <NeedsReviewIcon
              sx={{
                ...reportTableItemClasses.icon,
                ...reportTableItemClasses.needsReviewIcon,
              }}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.followUp && (
          <>
            <FollowUpIcon
              sx={{
                ...reportTableItemClasses.icon,
                ...reportTableItemClasses.followUpIcon,
              }}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.comment && (
          <>
            <CommentIcon
              sx={{
                ...reportTableItemClasses.icon,
                ...reportTableItemClasses.commentIcon,
              }}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.firstParty && (
          <>
            <FirstPartyIcon
              sx={{
                ...reportTableItemClasses.icon,
                ...reportTableItemClasses.firstPartyIcon,
              }}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.excludeFromNotice && (
          <>
            <ExcludeFromNoticeIcon
              sx={{
                ...reportTableItemClasses.icon,
                ...reportTableItemClasses.excludeFromNoticeIcon,
              }}
            />{' '}
            <br />
          </>
        )}
        {attributionInfo.preSelected && (
          <>
            <PreSelectedIcon
              sx={{
                ...reportTableItemClasses.icon,
                ...reportTableItemClasses.preSelectedIcon,
              }}
            />{' '}
            <br />
          </>
        )}
      </MuiBox>
    );
  }

  return getTableRow(props.attributionInfo, props.attributionId);
}
