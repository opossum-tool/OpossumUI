// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import EditorIcon from '@mui/icons-material/Edit';
import { type SxProps, TableCell } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { type Theme, useTheme } from '@mui/material/styles';
import MuiTypography from '@mui/material/Typography';
import { skipToken } from '@tanstack/react-query';
import { Fragment } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { View } from '../../enums/enums';
import { ROOT_PATH } from '../../shared-constants';
import {
  baseIconPadding,
  baseIconSize,
  borderMedium,
  borderThin,
  OpossumColors,
  Sizing,
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
const PADDING = Sizing.SmallGap;

function getStyles(theme: Theme) {
  const glyphSize = baseIconSize;
  const iconPadding = theme.spacing(baseIconPadding);
  const iconBorderWidth = borderMedium;
  const iconOuterSize = `calc(${glyphSize} + 2 * ${iconPadding} + 2 * ${iconBorderWidth})`;

  return {
    tableData: {
      overflow: 'auto',
      whiteSpace: 'pre-line',
      padding: PADDING,
      boxSizing: 'border-box',
      height: '100%',
    },
    bold: {
      fontWeight: 'bold',
    },
    iconTableData: {
      py: PADDING,
      px: PADDING,
      boxSizing: 'border-box',
      height: '100%',
      display: 'grid',
      gridAutoFlow: 'column',
      gridTemplateRows: `repeat(auto-fill, ${iconOuterSize})`,
      gridAutoColumns: iconOuterSize,
      width: 'max-content',
      alignContent: 'start',
      justifyContent: 'start',
      gap: Sizing.Tiny,
    },
    iconSlot: {
      width: iconOuterSize,
      height: iconOuterSize,
      display: 'flex',
    },
    emptyIconSlot: {
      // Pack visible icons first, keeping unused capacity as trailing space.
      order: 1,
      visibility: 'hidden',
    },
    editButton: {
      '&:hover svg, &.Mui-focusVisible svg': {
        background: OpossumColors.middleBlue,
      },
    },
    tableCell: {
      wordBreak: 'break-all',
      boxSizing: 'border-box',
      height: REPORT_VIEW_ROW_HEIGHT,
    },
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
      boxSizing: 'content-box',
      width: glyphSize,
      height: glyphSize,
      padding: iconPadding,
      border: `${iconBorderWidth} solid transparent`,
      m: 0,
    },
    editIcon: {
      backgroundColor: OpossumColors.white,
      borderColor: OpossumColors.brown,
      color: OpossumColors.brown,
    },
    firstPartyIcon: {
      borderColor: OpossumColors.darkBlue,
    },
    commentIcon: {
      borderColor: OpossumColors.black,
      color: OpossumColors.black,
    },
    followUpIcon: {
      borderColor: OpossumColors.red,
    },
    needsReviewIcon: {
      borderColor: OpossumColors.orange,
    },
    excludeFromNoticeIcon: {
      borderColor: OpossumColors.grey,
    },
    preSelectedIcon: {
      borderColor: OpossumColors.darkBlue,
    },
    preferredIcon: {
      borderColor: OpossumColors.mediumOrange,
    },
    markedTableCell: {
      backgroundColor: OpossumColors.lightOrange,
    },
  } as const satisfies SxProps<Theme>;
}

interface ReportTableItemProps {
  packageInfo: PackageInfo;
}

export function ReportTableItem({ packageInfo }: ReportTableItemProps) {
  const classes = getStyles(useTheme());
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
    // Each entry is one potentially visible slot. Mutually exclusive AI states
    // share an entry so reserving the full list doesn't overcount them.
    const icons = [
      {
        key: 'edit',
        content: (
          <IconButton
            wrapperSx={classes.iconSlot}
            sx={{
              ...classes.iconSlot,
              ...classes.editButton,
            }}
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
            icon={<EditorIcon sx={{ ...classes.icon, ...classes.editIcon }} />}
          />
        ),
      },
      {
        key: 'needs-review',
        content: packageInfo.needsReview && (
          <NeedsReviewIcon
            tooltipPlacement="right"
            sx={{ ...classes.icon, ...classes.needsReviewIcon }}
          />
        ),
      },
      {
        key: 'follow-up',
        content: packageInfo.followUp && (
          <FollowUpIcon
            tooltipPlacement="right"
            sx={{ ...classes.icon, ...classes.followUpIcon }}
          />
        ),
      },
      {
        key: 'first-party',
        content: packageInfo.firstParty && (
          <FirstPartyIcon
            tooltipPlacement="right"
            sx={{ ...classes.icon, ...classes.firstPartyIcon }}
          />
        ),
      },
      {
        key: 'exclude-from-notice',
        content: packageInfo.excludeFromNotice && (
          <ExcludeFromNoticeIcon
            tooltipPlacement="right"
            sx={{ ...classes.icon, ...classes.excludeFromNoticeIcon }}
          />
        ),
      },
      {
        key: 'pre-selected',
        content: packageInfo.preSelected && (
          <PreSelectedIcon
            tooltipPlacement="right"
            sx={{ ...classes.icon, ...classes.preSelectedIcon }}
          />
        ),
      },
      {
        key: 'preferred',
        content: packageInfo.preferred && (
          <PreferredIcon
            tooltipPlacement="right"
            sx={{ ...classes.icon, ...classes.preferredIcon }}
          />
        ),
      },
      {
        key: 'ai-status',
        content:
          aiStatus &&
          (aiStatus.deferred ? (
            <DeferredIcon tooltipPlacement="right" sx={classes.icon} />
          ) : (
            <AiGeneratedIcon tooltipPlacement="right" sx={classes.icon} />
          )),
      },
      {
        key: 'human-modified',
        content: aiStatus?.humanModified && (
          <HumanModifiedIcon tooltipPlacement="right" sx={classes.icon} />
        ),
      },
    ];

    return (
      <MuiBox sx={classes.iconTableData}>
        {icons.map(({ key, content }) =>
          content ? (
            <Fragment key={key}>{content}</Fragment>
          ) : (
            <MuiBox
              key={key}
              aria-hidden
              sx={{ ...classes.iconSlot, ...classes.emptyIconSlot }}
            />
          ),
        )}
      </MuiBox>
    );
  }
}
