/* eslint-disable @typescript-eslint/no-magic-numbers */
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import ListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiRating from '@mui/material/Rating';
import { SxProps } from '@mui/system';
import { useMemo, useState } from 'react';

import { DisplayPackageInfo, FollowUp } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon, OpossumColors } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector, useAppStore } from '../../state/hooks';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getIsPreferenceFeatureEnabled,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { getQAMode } from '../../state/selectors/view-selector';
import { prettifySource } from '../../util/prettify-source';
import {
  ExcludeFromNoticeIcon,
  FollowUpIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  SourceIcon,
  WasPreferredIcon,
} from '../Icons/Icons';

const classes = {
  container: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  menuPaper: {
    overflow: 'visible',
    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
    mt: 1.5,
    '&:before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: '50%',
      width: 10,
      height: 10,
      bgcolor: 'background.paper',
      transform: 'translateY(-50%) rotate(45deg)',
      zIndex: 0,
    },
  },
} satisfies SxProps;

interface ChipDatum {
  active: boolean;
  option: string;
  icon?: React.ReactElement;
  interactive: boolean;
  label: React.ReactNode;
  onAdd?(): void;
  onDelete?(): void;
}

interface Props {
  packageInfo: DisplayPackageInfo;
  isEditable: boolean;
}

export function AuditingOptions({
  packageInfo,
  isEditable,
}: Props): React.ReactNode {
  const chips = useChips({ packageInfo, isEditable });
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [pendingOptions, setPendingOptions] = useState<Array<string>>([]);
  const inactiveChips = chips.filter(
    ({ active, interactive }) => !active && interactive,
  );

  return chips.length ? (
    <>
      <MuiBox sx={classes.container}>
        {renderTriggerButton()}
        {renderActiveChips()}
      </MuiBox>
      {renderMenu()}
    </>
  ) : null;

  function renderTriggerButton() {
    return (
      isEditable &&
      !!inactiveChips.length && (
        <MuiChip
          label={text.auditingOptions.add}
          color={'primary'}
          icon={<AddIcon color="primary" sx={baseIcon} />}
          size={'small'}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-controls={anchorEl ? 'attribution-options-menu' : undefined}
          aria-haspopup={'true'}
          aria-expanded={anchorEl ? 'true' : undefined}
        />
      )
    );
  }

  function renderActiveChips() {
    return chips.map(
      ({ label, icon, active, onDelete, interactive, option }, index) =>
        active ? (
          <MuiChip
            key={index}
            label={label}
            size={'small'}
            icon={icon}
            onDelete={interactive ? onDelete : undefined}
            data-testid={`auditing-option-${option}`}
          />
        ) : null,
    );
  }

  function renderMenu() {
    return (
      <MuiMenu
        anchorEl={anchorEl}
        id={'attribution-options-menu'}
        open={!!anchorEl}
        onClose={() => {
          setAnchorEl(undefined);
          pendingOptions.forEach((option) => {
            chips.find((chip) => chip.option === option)?.onAdd?.();
          });
          setPendingOptions([]);
        }}
        slotProps={{ paper: { elevation: 0, sx: classes.menuPaper } }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{ variant: 'menu', sx: { padding: 0 } }}
      >
        {renderInactiveChips()}
      </MuiMenu>
    );

    function renderInactiveChips() {
      return inactiveChips.map(({ label, icon, option }, index) => (
        <MuiMenuItem
          sx={{ padding: '12px' }}
          key={index}
          onClick={() => {
            option &&
              setPendingOptions((prev) =>
                prev.includes(option)
                  ? prev.filter((value) => value !== option)
                  : prev.concat(option),
              );
          }}
          divider={index + 1 !== inactiveChips.length}
          disableRipple
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <MuiListItemText
            primary={label}
            primaryTypographyProps={{ sx: { marginTop: '2px' } }}
          />
          <CheckIcon
            sx={{
              width: '20px',
              height: '20px',
              marginLeft: '16px',
              visibility:
                option && pendingOptions.includes(option)
                  ? undefined
                  : 'hidden',
            }}
          />
        </MuiMenuItem>
      ));
    }
  }
}

function useChips({
  packageInfo,
  isEditable,
}: {
  packageInfo: DisplayPackageInfo;
  isEditable: boolean;
}) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const qaMode = useAppSelector(getQAMode);
  const attributionSources = useAppSelector(getExternalAttributionSources);
  const isPreferenceFeatureEnabled = useAppSelector(
    getIsPreferenceFeatureEnabled,
  );
  const externalAttributions = useAppSelector(getExternalAttributions);
  const source = useMemo(() => {
    const sourceName =
      packageInfo.source?.additionalName || packageInfo.source?.name;

    if (sourceName) {
      return {
        sourceName,
        fromOrigin: false,
      };
    }

    const originSource = (
      packageInfo.originIds?.length
        ? Object.values(externalAttributions).find(
            (signal) =>
              signal.originIds?.some(
                (id) => packageInfo.originIds?.includes(id),
              ),
          )
        : undefined
    )?.source;

    return {
      sourceName: originSource?.additionalName || originSource?.name,
      fromOrigin: true,
    };
  }, [
    externalAttributions,
    packageInfo.originIds,
    packageInfo.source?.additionalName,
    packageInfo.source?.name,
  ]);

  return useMemo<Array<ChipDatum>>(
    () => [
      {
        option: 'preferred',
        label: text.auditingOptions.currentlyPreferred,
        icon: <PreferredIcon noTooltip />,
        active: !!packageInfo.preferred,
        onAdd: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              preferred: true,
            }),
          ),
        onDelete: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              preferred: false,
            }),
          ),
        interactive: isPreferenceFeatureEnabled && qaMode,
      },
      {
        option: 'was-preferred',
        label: text.auditingOptions.previouslyPreferred,
        icon: <WasPreferredIcon noTooltip />,
        active: !!packageInfo.wasPreferred,
        interactive: false,
      },
      {
        option: 'pre-selected',
        label: text.auditingOptions.preselected,
        icon: <PreSelectedIcon noTooltip />,
        active: !!packageInfo.preSelected,
        interactive: false,
      },
      {
        option: 'follow-up',
        label: text.auditingOptions.followUp,
        icon: <FollowUpIcon noTooltip />,
        active: !!packageInfo.followUp,
        onAdd: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              followUp: FollowUp,
            }),
          ),
        onDelete: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              followUp: undefined,
            }),
          ),
        interactive: true,
      },
      {
        option: 'needs-review',
        label: text.auditingOptions.needsReview,
        icon: <NeedsReviewIcon noTooltip />,
        active: !!packageInfo.needsReview,
        onAdd: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              needsReview: true,
            }),
          ),
        onDelete: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              needsReview: false,
            }),
          ),
        interactive: true,
      },
      {
        option: 'excluded-from-notice',
        label: text.auditingOptions.excludedFromNotice,
        icon: <ExcludeFromNoticeIcon noTooltip />,
        active: !!packageInfo.excludeFromNotice,
        onAdd: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              excludeFromNotice: true,
            }),
          ),
        onDelete: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              excludeFromNotice: false,
            }),
          ),
        interactive: true,
      },
      {
        option: 'source',
        label: `${
          source.fromOrigin ? text.attributionColumn.originallyFrom : ''
        }${prettifySource(source.sourceName, attributionSources)}`,
        icon: <SourceIcon noTooltip />,
        active: !!source.sourceName,
        interactive: false,
      },
      {
        option: 'confidence',
        label: text.auditingOptions.confidence,
        icon: (
          <MuiRating
            size={'small'}
            sx={{
              '& .MuiRating-iconEmpty .MuiSvgIcon-root': {
                color: OpossumColors.grey,
              },
            }}
            value={((packageInfo.attributionConfidence || 0) / 100) * 5}
            onChange={(_, newValue) =>
              newValue &&
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...getTemporaryDisplayPackageInfo(store.getState()),
                  attributionConfidence: newValue * 20,
                }),
              )
            }
            IconContainerComponent={({ value, ...rest }) => (
              <span
                aria-disabled={
                  Math.round(
                    ((packageInfo.attributionConfidence || 0) / 100) * 5,
                  ) !== value
                }
                aria-label={`confidence of ${value}`}
                {...rest}
              >
                {getSatisfaction(value)}
              </span>
            )}
            readOnly={!isEditable}
            highlightSelectedOnly
          />
        ),
        active: true,
        interactive: false,
      },
    ],
    [
      attributionSources,
      dispatch,
      isEditable,
      isPreferenceFeatureEnabled,
      packageInfo.attributionConfidence,
      packageInfo.excludeFromNotice,
      packageInfo.followUp,
      packageInfo.needsReview,
      packageInfo.preSelected,
      packageInfo.preferred,
      packageInfo.wasPreferred,
      qaMode,
      source,
      store,
    ],
  );
}

function getSatisfaction(value: number): React.ReactNode {
  if (value <= 1) {
    return (
      <SentimentVeryDissatisfiedIcon
        color={'error'}
        sx={{ width: '19px', height: '19px' }}
      />
    );
  } else if (value === 2) {
    return (
      <SentimentDissatisfiedIcon
        color={'error'}
        sx={{ width: '19px', height: '19px' }}
      />
    );
  } else if (value === 3) {
    return (
      <SentimentSatisfiedIcon
        color={'warning'}
        sx={{ width: '19px', height: '19px' }}
      />
    );
  } else if (value === 4) {
    return (
      <SentimentSatisfiedAltIcon
        color={'success'}
        sx={{ width: '19px', height: '19px' }}
      />
    );
  }

  return (
    <SentimentVerySatisfiedIcon
      color={'success'}
      sx={{ width: '19px', height: '19px' }}
    />
  );
}
