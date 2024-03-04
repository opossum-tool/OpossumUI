// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-magic-numbers */
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import MuiRating from '@mui/material/Rating';
import { useMemo } from 'react';

import { Criticality, PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { OpossumColors } from '../../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  useAppDispatch,
  useAppSelector,
  useAppStore,
} from '../../../state/hooks';
import {
  getExternalAttributions,
  getExternalAttributionSources,
  getIsPreferenceFeatureEnabled,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import { useUserSetting } from '../../../state/variables/use-user-setting';
import { prettifySource } from '../../../util/prettify-source';
import {
  CriticalityIcon,
  ExcludeFromNoticeIcon,
  FollowUpIcon,
  ModifiedPreferredIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  SourceIcon,
  WasPreferredIcon,
} from '../../Icons/Icons';
import { SelectMenuOption } from '../../SelectMenu/SelectMenu';

interface AuditingOption extends SelectMenuOption {
  deleteIcon?: React.ReactElement;
  interactive: boolean;
}

export function useAuditingOptions({
  packageInfo,
  isEditable,
}: {
  packageInfo: PackageInfo;
  isEditable: boolean;
}) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const [qaMode] = useUserSetting({ key: 'qaMode' });
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
        ? Object.values(externalAttributions).find(({ originIds }) =>
            originIds?.some((id) => packageInfo.originIds?.includes(id)),
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

  return useMemo<Array<AuditingOption>>(
    () => [
      {
        id: 'preferred',
        label: text.auditingOptions.currentlyPreferred,
        icon: <PreferredIcon noTooltip />,
        selected: !!packageInfo.preferred,
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
        interactive: isPreferenceFeatureEnabled && !!qaMode && isEditable,
      },
      {
        id: 'was-preferred',
        label: text.auditingOptions.previouslyPreferred,
        icon: <WasPreferredIcon noTooltip />,
        selected: !!packageInfo.wasPreferred,
        interactive: false,
      },
      {
        id: 'is-modified-preferred',
        label: text.auditingOptions.modifiedPreferred,
        icon: <ModifiedPreferredIcon noTooltip />,
        selected: !!packageInfo.modifiedPreferred,
        interactive: false,
      },
      {
        id: 'pre-selected',
        label: text.auditingOptions.preselected,
        icon: <PreSelectedIcon noTooltip />,
        selected: !!packageInfo.preSelected,
        interactive: false,
      },
      {
        id: 'follow-up',
        label: text.auditingOptions.followUp,
        icon: <FollowUpIcon noTooltip />,
        selected: !!packageInfo.followUp,
        onAdd: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              followUp: true,
            }),
          ),
        onDelete: () =>
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...getTemporaryDisplayPackageInfo(store.getState()),
              followUp: false,
            }),
          ),
        interactive: isEditable,
      },
      {
        id: 'needs-review',
        label: text.auditingOptions.needsReview,
        icon: <NeedsReviewIcon noTooltip />,
        selected: !!packageInfo.needsReview,
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
        interactive: isEditable,
      },
      {
        id: 'excluded-from-notice',
        label: text.auditingOptions.excludedFromNotice,
        icon: <ExcludeFromNoticeIcon noTooltip />,
        selected: !!packageInfo.excludeFromNotice,
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
        interactive: isEditable,
      },
      {
        id: 'source',
        label: `${
          source.fromOrigin ? text.attributionColumn.originallyFrom : ''
        }${prettifySource(source.sourceName, attributionSources)}`,
        icon: <SourceIcon noTooltip />,
        selected: !!source.sourceName,
        interactive: false,
      },
      {
        id: 'criticality',
        label:
          packageInfo.criticality === Criticality.High
            ? text.auditingOptions.highCriticality
            : text.auditingOptions.mediumCriticality,
        icon: (
          <CriticalityIcon noTooltip criticality={packageInfo.criticality} />
        ),
        selected: !!packageInfo.criticality,
        interactive: false,
      },
      {
        id: 'confidence',
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
        selected: true,
        interactive: false,
      },
    ],
    [
      attributionSources,
      dispatch,
      isEditable,
      isPreferenceFeatureEnabled,
      packageInfo.attributionConfidence,
      packageInfo.criticality,
      packageInfo.excludeFromNotice,
      packageInfo.followUp,
      packageInfo.modifiedPreferred,
      packageInfo.needsReview,
      packageInfo.preSelected,
      packageInfo.preferred,
      packageInfo.wasPreferred,
      qaMode,
      source.fromOrigin,
      source.sourceName,
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
