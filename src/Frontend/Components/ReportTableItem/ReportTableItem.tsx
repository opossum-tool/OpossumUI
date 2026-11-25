// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import EditorIcon from '@mui/icons-material/Edit';
import { type SxProps, TableCell } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import type { Theme } from '@mui/material/styles';
import MuiTypography from '@mui/material/Typography';
import { skipToken } from '@tanstack/react-query';
import { Fragment } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { View } from '../../enums/enums';
import { ROOT_PATH } from '../../shared-constants';
import {
  baseIconSize,
  borderMedium,
  borderThin,
  clickableIcon,
  OpossumColors,
} from '../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setPendingAttributionNavigation } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { resetManualAuditFiltersPreservingSort } from '../../state/actions/resource-actions/navigation-actions';
import { navigateToView } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { backend } from '../../util/backendClient';
import {
  isPackageAttributeIncomplete,
  isPackageIncomplete,
} from '../../util/input-validation';
import { openUrl } from '../../util/open-url';
import { IconButton } from '../IconButton/IconButton';
import {
  AiGeneratedIcon,
  DeferredIcon,
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  HumanModifiedIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
} from '../Icons/Icons';
import { type TableConfig, tableConfigs } from '../ReportView/TableConfig';
import { getFormattedCellData } from './ReportTableItem.util';

export const REPORT_VIEW_ROW_HEIGHT = 150;
const PADDING = 2.5;
// 4px theme spacing lattice base × PADDING units
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const PADDING_PX = 4 * PADDING;

// 1 MUI theme spacing unit = 4px (createTheme({ spacing: 4 }) in App.style.ts)
const THEME_SPACING_UNIT_PX = 4;
const ICON_SIZE_PX = Number.parseInt(baseIconSize, 10);
// every icon sits in an equally sized square cell: the icon svg plus its
// `mx: 0.5` margins, so all grid tracks share identical outer dimensions
const ICON_CELL_SIZE_PX = ICON_SIZE_PX + THEME_SPACING_UNIT_PX;
const ICON_BOX_HEIGHT_PX = REPORT_VIEW_ROW_HEIGHT - 2 * PADDING_PX;
// icons stack vertically in the fixed height row before wrapping to a new column
const ICONS_PER_COLUMN = Math.floor(
  (ICON_BOX_HEIGHT_PX + THEME_SPACING_UNIT_PX) /
    (ICON_CELL_SIZE_PX + THEME_SPACING_UNIT_PX),
);
// the most icons any row can show: edit button, seven signal flags, and one
// AI status icon. The icons grid always reserves tracks for this worst case so
// the first table column is static across virtualization and rows that show
// fewer icons just leave left-aligned trailing space.
const MAX_SIGNAL_ICONS = 9;
const WORST_CASE_COLUMN_COUNT = Math.ceil(MAX_SIGNAL_ICONS / ICONS_PER_COLUMN);

const classes = {
  tableData: {
    overflow: 'auto',
    whiteSpace: 'pre-line',
    padding: PADDING,
    height: REPORT_VIEW_ROW_HEIGHT - 2 * PADDING_PX,
  },
  bold: {
    fontWeight: 'bold',
  },
  iconTableData: {
    py: PADDING,
    px: 1.75,
    height: REPORT_VIEW_ROW_HEIGHT - 2 * PADDING_PX,
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateRows: `repeat(${ICONS_PER_COLUMN}, ${ICON_CELL_SIZE_PX}px)`,
    gridTemplateColumns: `repeat(${WORST_CASE_COLUMN_COUNT}, ${ICON_CELL_SIZE_PX}px)`,
    gridAutoColumns: `${ICON_CELL_SIZE_PX}px`,
    alignContent: 'start',
    justifyContent: 'start',
    gap: 1,
  },
  iconCell: {
    width: ICON_CELL_SIZE_PX,
    height: ICON_CELL_SIZE_PX,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCell: { wordBreak: 'break-all' },
  iconsCell: {
    position: 'sticky',
    left: 0,
    background: '#e3e3e3',
  },
  borders: {
    borderRight: `${borderThin} solid ${OpossumColors.mediumGrey}`,
    borderBottom: `${borderThin} solid ${OpossumColors.mediumGrey}`,
  },
  icon: {
    width: baseIconSize,
    height: baseIconSize,
  },
  editIcon: {
    backgroundColor: OpossumColors.white,
    border: `${borderMedium} ${OpossumColors.brown} solid`,
    color: OpossumColors.brown,
  },
  firstPartyIcon: {
    border: `${borderMedium} ${OpossumColors.darkBlue} solid`,
  },
  commentIcon: {
    border: `${borderMedium} ${OpossumColors.black} solid`,
    color: OpossumColors.black,
  },
  followUpIcon: {
    border: `${borderMedium} ${OpossumColors.red} solid`,
  },
  needsReviewIcon: {
    border: `${borderMedium} ${OpossumColors.orange} solid`,
  },
  excludeFromNoticeIcon: {
    border: `${borderMedium} ${OpossumColors.grey} solid`,
  },
  preSelectedIcon: {
    border: `${borderMedium} ${OpossumColors.darkBlue} solid`,
  },
  preferredIcon: {
    border: `${borderMedium} ${OpossumColors.mediumOrange} solid`,
  },
  markedTableCell: {
    backgroundColor: OpossumColors.lightOrange,
  },
  clickableIcon,
} as const satisfies SxProps<Theme>;

interface ReportTableItemProps {
  packageInfo: PackageInfo;
}

export function ReportTableItem({ packageInfo }: ReportTableItemProps) {
  const dispatch = useAppDispatch();
  const frequentLicenseTextResult = backend.getFrequentLicenseText.useQuery(
    packageInfo.licenseName
      ? { licenseName: packageInfo.licenseName }
      : skipToken,
  );

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
    const frequentLicenseText = frequentLicenseTextResult.data;
    const hasFrequentLicenseName =
      !!packageInfo.licenseName && !!frequentLicenseText;
    const isFrequentLicenseAndHasNoText =
      hasFrequentLicenseName && !packageInfo.licenseText;
    const displayAttributionInfo =
      packageInfo.licenseName && isFrequentLicenseAndHasNoText
        ? {
            ...packageInfo,
            licenseText: frequentLicenseText,
          }
        : packageInfo;

    const cellData = getFormattedCellData(config, displayAttributionInfo);

    return (
      <TableCell
        data-testid={
          config.attributionProperty === 'id' ? packageInfo.id : undefined
        }
        sx={{
          minWidth: ({ spacing }) => spacing(config.width),
          ...classes.borders,
          ...classes.tableCell,
          ...(config.attributionProperty === 'id'
            ? {
                ...classes.iconsCell,
                ...(isPackageIncomplete(packageInfo) &&
                  classes.markedTableCell),
              }
            : {
                maxWidth: ({ spacing }) => spacing(config.width),
                ...(isPackageAttributeIncomplete(
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
    const aiStatus = packageInfo.aiStatus;
    return (
      <MuiBox sx={classes.iconTableData}>
        <MuiBox sx={classes.iconCell}>
          <IconButton
            tooltipTitle={text.reportView.openInAuditView}
            tooltipPlacement={'right'}
            onClick={() => {
              dispatch(
                setPendingAttributionNavigation({
                  attributionUuid: packageInfo.id,
                  fallbackResourcePath: ROOT_PATH,
                }),
              );
              dispatch(resetManualAuditFiltersPreservingSort());
              dispatch(
                changeSelectedAttributionOrOpenUnsavedPopup(packageInfo),
              );
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
        </MuiBox>
        {packageInfo.needsReview && (
          <MuiBox sx={classes.iconCell}>
            <NeedsReviewIcon
              tooltipPlacement={'right'}
              sx={{
                ...classes.icon,
                ...classes.needsReviewIcon,
              }}
            />
          </MuiBox>
        )}
        {packageInfo.followUp && (
          <MuiBox sx={classes.iconCell}>
            <FollowUpIcon
              tooltipPlacement={'right'}
              sx={{
                ...classes.icon,
                ...classes.followUpIcon,
              }}
            />
          </MuiBox>
        )}
        {packageInfo.firstParty && (
          <MuiBox sx={classes.iconCell}>
            <FirstPartyIcon
              tooltipPlacement={'right'}
              sx={{
                ...classes.icon,
                ...classes.firstPartyIcon,
              }}
            />
          </MuiBox>
        )}
        {packageInfo.excludeFromNotice && (
          <MuiBox sx={classes.iconCell}>
            <ExcludeFromNoticeIcon
              tooltipPlacement={'right'}
              sx={{
                ...classes.icon,
                ...classes.excludeFromNoticeIcon,
              }}
            />
          </MuiBox>
        )}
        {packageInfo.preSelected && (
          <MuiBox sx={classes.iconCell}>
            <PreSelectedIcon
              tooltipPlacement={'right'}
              sx={{
                ...classes.icon,
                ...classes.preSelectedIcon,
              }}
            />
          </MuiBox>
        )}
        {packageInfo.preferred && (
          <MuiBox sx={classes.iconCell}>
            <PreferredIcon
              tooltipPlacement={'right'}
              sx={{
                ...classes.icon,
                ...classes.preferredIcon,
              }}
            />
          </MuiBox>
        )}
        {aiStatus?.deferred && (
          <MuiBox sx={classes.iconCell}>
            <DeferredIcon tooltipPlacement={'right'} sx={classes.icon} />
          </MuiBox>
        )}
        {!aiStatus?.deferred && aiStatus && (
          <MuiBox sx={classes.iconCell}>
            <AiGeneratedIcon tooltipPlacement={'right'} sx={classes.icon} />
          </MuiBox>
        )}
        {aiStatus?.humanModified && (
          <MuiBox sx={classes.iconCell}>
            <HumanModifiedIcon tooltipPlacement={'right'} sx={classes.icon} />
          </MuiBox>
        )}
      </MuiBox>
    );
  }
}
