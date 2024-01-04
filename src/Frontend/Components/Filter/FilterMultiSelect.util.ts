// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy } from 'lodash';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import { useVariable } from '../../util/use-variable';

export const ACTIVE_FILTERS_REDUX_KEY = 'active-filters';

export const filters = Object.values(text.attributionFilters);
export type Filter = (typeof filters)[number];

const FILTER_ACTIONS: Record<Filter, (packageInfo: PackageInfo) => boolean> = {
  'Third Party': (packageInfo) => !packageInfo.firstParty,
  'First Party': (packageInfo) => !!packageInfo.firstParty,
  'Needs Follow-Up': (packageInfo) => !!packageInfo.followUp,
  'Needs Review by QA': (packageInfo) => !!packageInfo.needsReview,
  'Currently Preferred': (packageInfo) => !!packageInfo.preferred,
};

export function useFilteredAttributions() {
  const attributions = useAppSelector(getManualAttributions);
  const [activeFilters] = useVariable<Array<Filter>>(
    ACTIVE_FILTERS_REDUX_KEY,
    [],
  );

  return {
    activeFilters,
    attributions: activeFilters.length
      ? pickBy(attributions, (attribution) =>
          activeFilters.every((filter) => FILTER_ACTIONS[filter](attribution)),
        )
      : attributions,
  };
}
