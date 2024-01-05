// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { navigateToView } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getFilesWithChildren,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getAttributionsWithResources } from '../../util/get-attributions-with-resources';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import { useFilteredAttributions } from '../Filter/FilterMultiSelect.util';
import { Table } from '../Table/Table';

const classes = {
  root: {
    width: '100vw',
    height: '100%',
    backgroundColor: OpossumColors.lightestBlue,
  },
};

export function ReportView() {
  const attributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);
  const dispatch = useAppDispatch();

  const attributionsWithResources = getAttributionsWithResources(
    useFilteredAttributions().attributions,
    attributionsToResources,
  );

  return (
    <MuiBox aria-label={'report view'} sx={classes.root}>
      <Table
        attributionsWithResources={attributionsWithResources}
        isFileWithChildren={isFileWithChildren}
        onIconClick={(attributionId) => {
          dispatch(
            changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId),
          );
          dispatch(navigateToView(View.Attribution));
        }}
        topElement={
          <MuiBox sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterMultiSelect width={300} />
            <AttributionCountsPanel
              sx={{ display: 'inline-block', margin: '20px' }}
            />
          </MuiBox>
        }
      />
    </MuiBox>
  );
}
