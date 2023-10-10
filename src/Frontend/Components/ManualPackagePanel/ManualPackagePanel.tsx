// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  getAttributionsOfSelectedResource,
  getAttributionsOfSelectedResourceOrClosestParent,
  getDisplayedPackage,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { Button } from '../Button/Button';
import { ManualAttributionList } from '../ManualAttributionList/ManualAttributionList';
import { OpossumColors } from '../../shared-styles';
import MuiBox from '@mui/material/Box';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparerForAttributions } from '../../util/get-alphabetical-comparer';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../shared-constants';
import { createPackageCardId } from '../../util/create-package-card-id';

const classes = {
  root: {
    marginRight: '1px',
    padding: '8px',
    background: OpossumColors.white,
    border: `1px ${OpossumColors.white} solid`,
  },
  select: {
    backgroundColor: OpossumColors.white,
  },
  buttonDiv: {
    marginTop: '6px',
    marginBottom: '4px',
  },
};

interface ManualPackagePanelProps {
  showParentAttributions: boolean;
  overrideParentMode: boolean;
  showAddNewAttributionButton: boolean;
  onOverrideParentClick(): void;
}

export function ManualPackagePanel(
  props: ManualPackagePanelProps,
): ReactElement | null {
  const dispatch = useAppDispatch();
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const attributionsOfSelectedResource: Attributions = useAppSelector(
    getAttributionsOfSelectedResource,
  );
  const selectedResourceOrClosestParentAttributions: Attributions =
    useAppSelector(getAttributionsOfSelectedResourceOrClosestParent);

  const selectedResourceId: string = useAppSelector(getSelectedResourceId);

  const shownAttributionsOfResource: Attributions = props.overrideParentMode
    ? attributionsOfSelectedResource
    : selectedResourceOrClosestParentAttributions;

  const { sortedPackageCardIds, displayPackageInfos } =
    getSortedPackageCardIdsAndDisplayPackageInfos(shownAttributionsOfResource);

  function onCardClick(
    packageCardId: string,
    isAddNewAttributionButton: boolean,
  ): void {
    dispatch(
      selectPackageCardInAuditViewOrOpenUnsavedPopup(
        PackagePanelTitle.ManualPackages,
        isAddNewAttributionButton
          ? ADD_NEW_ATTRIBUTION_BUTTON_ID
          : packageCardId,
        isAddNewAttributionButton
          ? EMPTY_DISPLAY_PACKAGE_INFO
          : displayPackageInfos[packageCardId],
      ),
    );
  }

  const showParentAttributions: boolean =
    props.showParentAttributions && !props.overrideParentMode;

  return (
    <MuiPaper sx={classes.root} elevation={0} square={true}>
      <MuiTypography variant={'subtitle1'}>
        {showParentAttributions
          ? 'Attributions (from parents)'
          : 'Attributions'}
      </MuiTypography>
      <ManualAttributionList
        displayPackageInfos={displayPackageInfos}
        sortedPackageCardIds={sortedPackageCardIds}
        selectedResourceId={selectedResourceId}
        selectedPackageCardId={selectedPackage?.packageCardId}
        onCardClick={onCardClick}
        isAddNewAttributionItemShown={props.showAddNewAttributionButton}
        attributionsFromParent={showParentAttributions}
      />
      <MuiBox sx={classes.buttonDiv}>
        {showParentAttributions && (
          <Button
            buttonText={'Override parent'}
            isDark={true}
            onClick={props.onOverrideParentClick}
          />
        )}
      </MuiBox>
    </MuiPaper>
  );
}

function getSortedPackageCardIdsAndDisplayPackageInfos(
  shownAttributionsOfResource: Attributions,
): {
  sortedPackageCardIds: Array<string>;
  displayPackageInfos: DisplayPackageInfos;
} {
  const sortedAttributionIds = Object.keys(shownAttributionsOfResource).sort(
    getAlphabeticalComparerForAttributions(shownAttributionsOfResource),
  );

  const sortedPackageCardIds: Array<string> = [];
  const displayPackageInfos: DisplayPackageInfos = {};
  sortedAttributionIds.forEach((attributionId, index) => {
    const packageCardId = createPackageCardId(
      PackagePanelTitle.ManualPackages,
      index,
    );
    sortedPackageCardIds.push(packageCardId);
    displayPackageInfos[packageCardId] = convertPackageInfoToDisplayPackageInfo(
      shownAttributionsOfResource[attributionId],
      [attributionId],
    );
  });
  return { sortedPackageCardIds, displayPackageInfos };
}
