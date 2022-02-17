// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  Attributions,
  AttributionsToResources,
  AttributionsWithResources,
} from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import {
  getFilesWithChildren,
  getFrequentLicensesTexts,
  getManualAttributions,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getAttributionsWithResources } from '../../util/get-attributions-with-resources';
import { useFilters } from '../../util/use-filters';
import { Table } from '../Table/Table';
import { OpossumColors } from '../../shared-styles';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';

const useStyles = makeStyles({
  root: {
    width: '100vw',
    height: '100%',
    backgroundColor: OpossumColors.lightestBlue,
  },
  multiselect: {
    maxWidth: '300px',
  },
});

export function ReportView(): ReactElement {
  const classes = useStyles();
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const attributionsToResources: AttributionsToResources = useAppSelector(
    getManualAttributionsToResources
  );
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);
  const dispatch = useAppDispatch();

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
      dispatch(openPopup(PopupType.EditAttributionPopup, attributionId));
      dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
    };
  }

  const attributionsWithResourcesIncludingLicenseTexts =
    getAttributionsWithResourcesIncludingLicenseTexts();

  return (
    <div className={classes.root}>
      <Table
        attributionsWithResources={useFilters(
          attributionsWithResourcesIncludingLicenseTexts
        )}
        isFileWithChildren={isFileWithChildren}
        onIconClick={getOnIconClick()}
        topElement={<FilterMultiSelect className={classes.multiselect} />}
      />
    </div>
  );
}
