// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useMemo, useState } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { Height, NumberOfDisplayedItems } from '../../types/types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { List } from '../List/List';
import { SearchTextField } from '../SearchTextField/SearchTextField';

interface FilteredListProps {
  attributions: Attributions;
  attributionIds: Array<string>;

  getAttributionCard(attributionId: string): ReactElement | null;

  max: NumberOfDisplayedItems | Height;
  cardVerticalDistance?: number;
}

export function FilteredList(props: FilteredListProps): ReactElement {
  const [search, setSearch] = useState('');

  const sortedFilteredAttributionIds: Array<string> = useMemo(() => {
    function filterBySearchTerm(attributionId: string): boolean {
      const attribution = props.attributions[attributionId];
      return Boolean(
        attribution &&
          (search === '' ||
            (attribution.packageName &&
              attribution.packageName
                .toLowerCase()
                .includes(search.toLowerCase())) ||
            (attribution.licenseName &&
              attribution.licenseName
                .toLowerCase()
                .includes(search.toLowerCase())) ||
            (attribution.copyright &&
              attribution.copyright
                .toLowerCase()
                .includes(search.toLowerCase())))
      );
    }

    return props.attributionIds
      .filter(filterBySearchTerm)
      .sort(getAlphabeticalComparer(props.attributions));
  }, [props.attributions, props.attributionIds, search]);

  return (
    <div>
      <SearchTextField onInputChange={setSearch} search={search} />
      <List
        getListItem={(index: number): ReactElement | null =>
          props.getAttributionCard(sortedFilteredAttributionIds[index])
        }
        max={props.max}
        length={sortedFilteredAttributionIds.length}
        cardVerticalDistance={props.cardVerticalDistance}
      />
    </div>
  );
}
