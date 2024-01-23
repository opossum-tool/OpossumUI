// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import PlusIcon from '@mui/icons-material/Add';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import MuiBox from '@mui/material/Box';
import { memo, useMemo, useState } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { View } from '../../enums/enums';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setMultiSelectSelectedAttributionIds } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import {
  anyLocateFilterIsSet,
  attributionMatchesLocateFilter,
} from '../../state/helpers/action-and-reducer-helpers';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getFrequentLicensesNameOrder } from '../../state/selectors/all-views-resource-selectors';
import {
  getMultiSelectSelectedAttributionIds,
  getSelectedAttributionIdInAttributionView,
} from '../../state/selectors/attribution-view-resource-selectors';
import { getLocatePopupFilters } from '../../state/selectors/locate-popup-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { ListCardConfig, PackageCardConfig } from '../../types/types';
import { getCardLabels } from '../../util/get-card-labels';
import { Checkbox } from '../Checkbox/Checkbox';
import { IconButton } from '../IconButton/IconButton';
import { ListCard } from '../ListCard/ListCard';
import { ResourcePathPopup } from '../ResourcePathPopup/ResourcePathPopup';
import {
  getKey,
  getPackageCardHighlighting,
  getRightIcons,
} from './PackageCard.util';

const classes = {
  clickableIcon,
  disabledIcon,
  multiSelectPackageCard: {
    flexGrow: 1,
    minWidth: '0px',
  },
};

export const CANNOT_ADD_PREFERRED_ATTRIBUTION_TOOLTIP =
  'A preferred attribution cannot be added';

export const PACKAGE_CARD_HEIGHT = 42;

interface PackageCardProps {
  cardId: string;
  displayPackageInfo: DisplayPackageInfo;
  packageCount?: number;
  cardConfig: PackageCardConfig;
  onClick?(): void;
  onIconClick?(): void;
  showOpenResourcesIcon?: boolean;
  showCheckBox?: boolean;
  isScrolling?: boolean;
}
export const PackageCard = memo((props: PackageCardProps) => {
  const dispatch = useAppDispatch();
  const selectedView = useAppSelector(getSelectedView);
  const selectedAttributionIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const multiSelectSelectedAttributionIds = useAppSelector(
    getMultiSelectSelectedAttributionIds,
  );
  const locatePopupFilter = useAppSelector(getLocatePopupFilters);

  const [showAssociatedResourcesPopup, setShowAssociatedResourcesPopup] =
    useState<boolean>(false);

  const isExternalAttribution = Boolean(props.cardConfig.isExternalAttribution);
  const packageLabels = getCardLabels(props.displayPackageInfo);
  const attributionIds = props.displayPackageInfo.attributionIds;

  const frequentLicenseNames = useAppSelector(getFrequentLicensesNameOrder);
  const listCardConfig = useMemo((): ListCardConfig => {
    let listCardConfig: ListCardConfig = {
      ...props.cardConfig,
      firstParty: props.displayPackageInfo.firstParty,
      excludeFromNotice: props.displayPackageInfo.excludeFromNotice,
      needsReview: Boolean(props.displayPackageInfo.needsReview),
      followUp: Boolean(props.displayPackageInfo.followUp),
      isPreferred: Boolean(props.displayPackageInfo.preferred),
      wasPreferred: Boolean(props.displayPackageInfo.wasPreferred),
      criticality: props.cardConfig.isExternalAttribution
        ? props.displayPackageInfo.criticality
        : props.displayPackageInfo.preSelected
          ? props.displayPackageInfo.criticality
          : undefined,
    };
    if (!isExternalAttribution) {
      const attributionId = attributionIds[0];
      listCardConfig = {
        ...listCardConfig,
        isMultiSelected:
          multiSelectSelectedAttributionIds.includes(attributionId),
      };
    } else {
      listCardConfig = {
        ...listCardConfig,
        isLocated: anyLocateFilterIsSet(locatePopupFilter)
          ? attributionMatchesLocateFilter(
              props.displayPackageInfo,
              locatePopupFilter,
              frequentLicenseNames,
            )
          : false,
      };
    }

    return listCardConfig;
  }, [
    attributionIds,
    frequentLicenseNames,
    isExternalAttribution,
    locatePopupFilter,
    multiSelectSelectedAttributionIds,
    props.cardConfig,
    props.displayPackageInfo,
  ]);

  const highlighting =
    selectedView === View.Attribution
      ? getPackageCardHighlighting(props.displayPackageInfo)
      : undefined;

  const displayAttributionIds = props.displayPackageInfo.attributionIds;

  function getLeftElementForManualAttribution() {
    const attributionId = attributionIds[0];

    function handleMultiSelectAttributionSelected(
      event: React.ChangeEvent<HTMLInputElement>,
    ): void {
      const newMultiSelectSelectedAttributionIds = event.target.checked
        ? multiSelectSelectedAttributionIds.concat([attributionId])
        : multiSelectSelectedAttributionIds.filter(
            (id) => id !== attributionId,
          );

      dispatch(
        setMultiSelectSelectedAttributionIds(
          newMultiSelectSelectedAttributionIds,
        ),
      );
      !selectedAttributionIdInAttributionView &&
        dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
    }

    return props.showCheckBox ? (
      <Checkbox
        checked={multiSelectSelectedAttributionIds.includes(attributionId)}
        onChange={handleMultiSelectAttributionSelected}
        skeleton={props.isScrolling}
        disableRipple
      />
    ) : undefined;
  }

  const leftIcon =
    props.onIconClick && !props.cardConfig.isResolved ? (
      <IconButton
        tooltipTitle={
          props.displayPackageInfo.preferred
            ? CANNOT_ADD_PREFERRED_ATTRIBUTION_TOOLTIP
            : 'add'
        }
        tooltipPlacement="left"
        disabled={props.displayPackageInfo.preferred}
        onClick={props.onIconClick}
        key={getKey('add-icon', props.cardId)}
        icon={
          <PlusIcon
            sx={
              props.displayPackageInfo.preferred
                ? classes.disabledIcon
                : classes.clickableIcon
            }
            aria-label={`add ${packageLabels[0] || ''}`}
          />
        }
      />
    ) : undefined;

  const openResourcesIcon = useMemo(
    () =>
      props.showOpenResourcesIcon ? (
        <IconButton
          tooltipTitle="show resources"
          tooltipPlacement="right"
          onClick={(): void => {
            setShowAssociatedResourcesPopup(true);
          }}
          key={`open-resources-icon-${props.displayPackageInfo.packageName}-${props.displayPackageInfo.packageVersion}`}
          icon={<OpenInBrowserIcon sx={classes.clickableIcon} />}
        />
      ) : undefined,
    [
      props.displayPackageInfo.packageName,
      props.displayPackageInfo.packageVersion,
      props.showOpenResourcesIcon,
    ],
  );

  const rightIcons = useMemo(
    () => getRightIcons(listCardConfig, props.cardId, openResourcesIcon),
    [listCardConfig, openResourcesIcon, props.cardId],
  );

  return (
    <MuiBox
      aria-label={`package card ${packageLabels[0]}`}
      sx={!props.showCheckBox ? classes.multiSelectPackageCard : {}}
    >
      {showAssociatedResourcesPopup && (
        <ResourcePathPopup
          closePopup={(): void => setShowAssociatedResourcesPopup(false)}
          attributionIds={displayAttributionIds}
          isExternalAttribution={Boolean(
            props.cardConfig.isExternalAttribution,
          )}
        />
      )}
      <ListCard
        text={packageLabels[0] || ''}
        secondLineText={packageLabels[1] || undefined}
        cardConfig={listCardConfig}
        count={props.packageCount}
        onClick={props.onClick}
        leftIcon={leftIcon}
        rightIcons={rightIcons}
        leftElement={
          isExternalAttribution
            ? undefined
            : getLeftElementForManualAttribution()
        }
        highlighting={highlighting}
      />
    </MuiBox>
  );
});
