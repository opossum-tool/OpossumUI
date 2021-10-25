// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  Attributions,
  AttributionsToResources,
  AttributionsWithResources,
} from '../../../shared/shared-types';
import { View } from '../../enums/enums';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { navigateToView } from '../../state/actions/view-actions/view-actions';
import {
  getFrequentLicensesTexts,
  getIsFileWithChildren,
  getManualAttributions,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getAttributionsWithResources } from '../../util/get-attributions-with-resources';
import { provideFollowUpFilter } from '../../util/provide-follow-up-filter';
import { Checkbox } from '../Checkbox/Checkbox';
import { Table } from '../Table/Table';
import { OpossumColors } from '../../shared-styles';
import { areOnlyFollowUpAttributionsShown } from '../../state/selectors/view-selector';

const useStyles = makeStyles({
  root: {
    width: '100vw',
    height: '100%',
    backgroundColor: OpossumColors.lightestBlue,
  },
  checkBox: {
    display: 'flex',
    alignItems: 'center',
  },
});

export function ReportView(): ReactElement {
  const classes = useStyles();
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const attributionsToResources: AttributionsToResources = useAppSelector(
    getManualAttributionsToResources
  );
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const isFileWithChildren = useAppSelector(getIsFileWithChildren);
  const filterForFollowUp = useAppSelector(areOnlyFollowUpAttributionsShown);
  const dispatch = useAppDispatch();

  const { handleFilterChange, getFilteredAttributions } = provideFollowUpFilter(
    filterForFollowUp,
    dispatch
  );

  const attributionsWithResources = getAttributionsWithResources(
    attributions,
    attributionsToResources
  );

  function getAttributionsWithResourcesIncludingLicenseTexts(): AttributionsWithResources {
    return Object.fromEntries(
      Object.entries(attributionsWithResources).map(
        ([uuid, attributionInfo]) => {
          const isFrequentLicenseAndHasNoText =
            attributionInfo.licenseName &&
            !attributionInfo.licenseText &&
            Object.keys(frequentLicenseTexts).includes(
              attributionInfo.licenseName
            );

          if (attributionInfo.licenseName && isFrequentLicenseAndHasNoText) {
            return [
              uuid,
              {
                ...attributionInfo,
                licenseText: frequentLicenseTexts[attributionInfo.licenseName],
              },
            ];
          } else {
            return [uuid, attributionInfo];
          }
        }
      )
    );
  }

  function getOnIconClick(): (attributionId: string) => void {
    return (attributionId): void => {
      dispatch(navigateToView(View.Attribution));
      dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
    };
  }

  const attributionsWithResourcesIncludingLicenseTexts =
    getAttributionsWithResourcesIncludingLicenseTexts();
  const checkBoxLabel = `Show only follow-up (${
    Object.values(attributions).filter((attribution) => attribution.followUp)
      .length
  })`;

  return (
    <div className={classes.root}>
      <Table
        attributionsWithResources={
          getFilteredAttributions(
            attributionsWithResourcesIncludingLicenseTexts
          ) as AttributionsWithResources
        }
        isFileWithChildren={isFileWithChildren}
        onIconClick={getOnIconClick()}
        topElement={
          <Checkbox
            label={checkBoxLabel}
            checked={filterForFollowUp}
            onChange={handleFilterChange}
            className={classes.checkBox}
          />
        }
      />
    </div>
  );
}
