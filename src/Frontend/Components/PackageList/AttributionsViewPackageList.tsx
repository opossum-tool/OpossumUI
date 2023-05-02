// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useMemo, useState } from 'react';
import {
  DisplayAttributionWithCount,
  Height,
  NumberOfDisplayedItems,
} from '../../types/types';
import { List } from '../List/List';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { getFilteredPackageIdsFromDisplayAttributions } from './package-list-helpers';

const CARD_VERTICAL_DISTANCE = 41;

interface AttributionsViewPackageListProps {
  displayAttributions: Array<DisplayAttributionWithCount>;
  getAttributionCard(attributionId: string): ReactElement | null;
  max: NumberOfDisplayedItems | Height;
}

export function AttributionsViewPackageList(
  props: AttributionsViewPackageListProps
): ReactElement {
  const [search, setSearch] = useState('');

  const filteredPackageIds: Array<string> = useMemo(
    () =>
      getFilteredPackageIdsFromDisplayAttributions(
        props.displayAttributions,
        search
      ),
    [props.displayAttributions, search]
  );

  return (
    <div>
      <SearchTextField
        onInputChange={setSearch}
        search={search}
        showIcon={true}
      />
      <List
        getListItem={(index: number): ReactElement | null =>
          props.getAttributionCard(filteredPackageIds[index])
        }
        max={props.max}
        length={filteredPackageIds.length}
        cardVerticalDistance={CARD_VERTICAL_DISTANCE}
      />
    </div>
  );
}
