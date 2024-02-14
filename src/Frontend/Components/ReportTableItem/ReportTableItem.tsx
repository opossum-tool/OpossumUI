// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import EditorIcon from '@mui/icons-material/Edit';
import { SxProps, TableCell } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import MuiTypography from '@mui/material/Typography';
import { Fragment } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { View } from '../../enums/enums';
import { clickableIcon, OpossumColors } from '../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { navigateToView } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getFrequentLicensesTexts } from '../../state/selectors/resource-selectors';
import {
  isImportantAttributionInformationMissing,
  isPackageInfoIncomplete,
} from '../../util/is-important-attribution-information-missing';
import { openUrl } from '../../util/open-url';
import { IconButton } from '../IconButton/IconButton';
import {
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { TableConfig, tableConfigs } from '../ReportView/TableConfig';
import { getFormattedCellData } from './ReportTableItem.util';

export const REPORT_VIEW_ROW_HEIGHT = 150;
const PADDING = 10;

const classes = {
  tableData: {
    overflow: 'auto',
    whiteSpace: 'pre-line',
    padding: `${PADDING}px`,
    height: `${REPORT_VIEW_ROW_HEIGHT - 2 * PADDING}px`,
  },
  bold: {
    fontWeight: 'bold',
  },
  iconTableData: {
    padding: `${PADDING}px 7px`,
    height: `${REPORT_VIEW_ROW_HEIGHT - 2 * PADDING}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
  tableCell: { wordBreak: 'break-all' },
  iconsCell: {
    position: 'sticky',
    left: 0,
    background: '#e3e3e3',
  },
  borders: {
    borderRight: `1px solid ${OpossumColors.mediumGrey}`,
    borderBottom: `1px solid ${OpossumColors.mediumGrey}`,
  },
  icon: {
    width: '15px',
    height: '15px',
  },
  editIcon: {
    backgroundColor: OpossumColors.white,
    border: `2px ${OpossumColors.brown} solid`,
    color: OpossumColors.brown,
  },
  firstPartyIcon: {
    border: `2px ${OpossumColors.darkBlue} solid`,
  },
  commentIcon: {
    border: `2px ${OpossumColors.black} solid`,
    color: OpossumColors.black,
  },
  followUpIcon: {
    border: `2px ${OpossumColors.red} solid`,
  },
  needsReviewIcon: {
    border: `2px ${OpossumColors.orange} solid`,
  },
  excludeFromNoticeIcon: {
    border: `2px ${OpossumColors.grey} solid`,
  },
  preSelectedIcon: {
    border: `2px ${OpossumColors.darkBlue} solid`,
  },
  preferredIcon: {
    border: `2px ${OpossumColors.mediumOrange} solid`,
  },
  markedTableCell: {
    backgroundColor: OpossumColors.lightOrange,
  },
  clickableIcon,
} satisfies SxProps;

interface ReportTableItemProps {
  packageInfo: PackageInfo;
}

export function ReportTableItem({ packageInfo }: ReportTableItemProps) {
  const dispatch = useAppDispatch();
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);

  return (
    <Fragment key={`table-row-${packageInfo.id}`}>
      {tableConfigs.map((config, index) =>
        renderTableCell(packageInfo, config, index),
      )}
    </Fragment>
  );

  function renderTableCell(
    packageInfo: PackageInfo,
    config: TableConfig,
    index: number,
  ) {
    const hasFrequentLicenseName =
      packageInfo.licenseName &&
      Object.keys(frequentLicenseTexts).includes(packageInfo.licenseName);
    const isFrequentLicenseAndHasNoText =
      hasFrequentLicenseName && !packageInfo.licenseText;
    const displayAttributionInfo =
      packageInfo.licenseName && isFrequentLicenseAndHasNoText
        ? {
            ...packageInfo,
            licenseText: frequentLicenseTexts[packageInfo.licenseName],
          }
        : packageInfo;

    const cellData = getFormattedCellData(config, displayAttributionInfo);

    return (
      <TableCell
        data-testid={
          config.attributionProperty === 'id' ? packageInfo.id : undefined
        }
        sx={{
          minWidth: config.width,
          maxWidth: config.width,
          ...classes.borders,
          ...classes.tableCell,
          ...(config.attributionProperty === 'id'
            ? {
                ...classes.iconsCell,
                ...(isPackageInfoIncomplete(packageInfo) &&
                  classes.markedTableCell),
              }
            : {
                ...(isImportantAttributionInformationMissing(
                  config.attributionProperty,
                  packageInfo,
                ) && classes.markedTableCell),
              }),
        }}
        key={`table-row-${config.attributionProperty}-${index}`}
      >
        {config.attributionProperty === 'id' ? (
          getIcons(packageInfo)
        ) : (
          <MuiTypography
            sx={{
              ...classes.tableData,
              ...(config.attributionProperty === 'licenseName' &&
                hasFrequentLicenseName &&
                classes.bold),
            }}
            component={'div'}
          >
            {config.attributionProperty === 'url' ? (
              <MuiLink href={'#'} onClick={() => openUrl(cellData.toString())}>
                {cellData}
              </MuiLink>
            ) : (
              cellData
            )}
          </MuiTypography>
        )}
      </TableCell>
    );
  }

  function getIcons(packageInfo: PackageInfo) {
    return (
      <MuiBox sx={classes.iconTableData}>
        <IconButton
          tooltipTitle={text.reportView.openInAuditView}
          tooltipPlacement={'right'}
          onClick={() => {
            dispatch(changeSelectedAttributionOrOpenUnsavedPopup(packageInfo));
            dispatch(navigateToView(View.Audit));
          }}
          icon={
            <EditorIcon
              sx={{
                ...classes.icon,
                ...classes.clickableIcon,
                ...classes.editIcon,
              }}
            />
          }
        />
        {packageInfo.needsReview && (
          <NeedsReviewIcon
            tooltipPlacement={'right'}
            sx={{
              ...classes.icon,
              ...classes.needsReviewIcon,
            }}
          />
        )}
        {packageInfo.followUp && (
          <FollowUpIcon
            tooltipPlacement={'right'}
            sx={{
              ...classes.icon,
              ...classes.followUpIcon,
            }}
          />
        )}
        {packageInfo.firstParty && (
          <FirstPartyIcon
            tooltipPlacement={'right'}
            sx={{
              ...classes.icon,
              ...classes.firstPartyIcon,
            }}
          />
        )}
        {packageInfo.excludeFromNotice && (
          <ExcludeFromNoticeIcon
            tooltipPlacement={'right'}
            sx={{
              ...classes.icon,
              ...classes.excludeFromNoticeIcon,
            }}
          />
        )}
        {packageInfo.preSelected && (
          <PreSelectedIcon
            tooltipPlacement={'right'}
            sx={{
              ...classes.icon,
              ...classes.preSelectedIcon,
            }}
          />
        )}
        {packageInfo.preferred && (
          <PreferredIcon
            tooltipPlacement={'right'}
            sx={{
              ...classes.icon,
              ...classes.preferredIcon,
            }}
          />
        )}
      </MuiBox>
    );
  }
}
