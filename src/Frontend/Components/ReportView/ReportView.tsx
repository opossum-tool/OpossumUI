// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { pickBy } from 'lodash';
import { useMemo } from 'react';

import { View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { navigateToView } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getFilesWithChildren,
  getManualAttributions,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getAttributionsWithResources } from '../../util/get-attributions-with-resources';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { useVariable } from '../../util/use-variable';
import {
  Filter,
  FILTER_FUNCTIONS,
  filters,
} from '../../web-workers/scripts/get-filtered-attributions';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { FILTER_ICONS } from '../AttributionList/AttributionList.util';
import { Autocomplete } from '../Autocomplete/Autocomplete';
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
  const manualAttributions = useAppSelector(getManualAttributions);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  const [selectedFilters, setActiveFilters] = useVariable<Array<Filter>>(
    'active-filters',
    [],
  );
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);
  const dispatch = useAppDispatch();

  const attributionsWithResources = getAttributionsWithResources(
    useMemo(
      () =>
        selectedFilters.length
          ? pickBy(manualAttributions, (attribution) =>
              selectedFilters.every((filter) =>
                FILTER_FUNCTIONS[filter](attribution, externalAttributions),
              ),
            )
          : manualAttributions,
      [selectedFilters, externalAttributions, manualAttributions],
    ),
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
            <Autocomplete<Filter, true, false, false>
              options={filters}
              optionText={{ primary: (option) => option }}
              multiple
              title={'Filter'}
              value={selectedFilters}
              onChange={(_, value) => setActiveFilters(value)}
              renderOptionStartIcon={(option) => FILTER_ICONS[option]}
              filterSelectedOptions
              sx={{ flex: 'initial', width: 300 }}
              aria-label={'attribution filters'}
            />
            <AttributionCountsPanel
              sx={{ display: 'inline-block', margin: '20px' }}
            />
          </MuiBox>
        }
      />
    </MuiBox>
  );
}
