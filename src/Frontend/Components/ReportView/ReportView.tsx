// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import {
  Attributions,
  AttributionsToResources,
} from '../../../shared/shared-types';
import { PopupType } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getFilesWithChildren,
  getManualAttributions,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getAttributionsWithResources } from '../../util/get-attributions-with-resources';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { useFilters } from '../../util/use-filters';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import { Table } from '../Table/Table';

const classes = {
  root: {
    width: '100vw',
    height: '100%',
    backgroundColor: OpossumColors.lightestBlue,
  },
};

export function ReportView(): ReactElement {
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const attributionsToResources: AttributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);
  const dispatch = useAppDispatch();

  const attributionsWithResources = getAttributionsWithResources(
    attributions,
    attributionsToResources,
  );

  function getOnIconClick(): (attributionId: string) => void {
    return (attributionId): void => {
      dispatch(openPopup(PopupType.EditAttributionPopup, attributionId));
      dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId));
    };
  }

  return (
    <MuiBox sx={classes.root}>
      <Table
        attributionsWithResources={useFilters(attributionsWithResources)}
        isFileWithChildren={isFileWithChildren}
        onIconClick={getOnIconClick()}
        topElement={
          <div>
            <FilterMultiSelect sx={{ maxWidth: '300px' }} />
            <AttributionCountsPanel
              sx={{ display: 'inline-block', margin: '20px' }}
            />
          </div>
        }
      />
    </MuiBox>
  );
}
