// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement, useMemo, useState } from 'react';
import {
  DisplayPackageInfos,
  Height,
  NumberOfDisplayedItems,
} from '../../types/types';
import { List } from '../List/List';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { getFilteredPackageCardIdsFromDisplayPackageInfos } from './package-list-helpers';

const CARD_VERTICAL_DISTANCE = 41;

interface AttributionsViewPackageListProps {
  displayPackageInfos: DisplayPackageInfos;
  sortedPackageCardIds: Array<string>;
  getAttributionCard(packageCardId: string): ReactElement | null;
  max: NumberOfDisplayedItems | Height;
}

export function AttributionsViewPackageList(
  props: AttributionsViewPackageListProps,
): ReactElement {
  const [search, setSearch] = useState('');

  const filteredAndSortedPackageCardIds: Array<string> = useMemo(
    () =>
      getFilteredPackageCardIdsFromDisplayPackageInfos(
        props.displayPackageInfos,
        props.sortedPackageCardIds,
        search,
      ),
    [props.displayPackageInfos, props.sortedPackageCardIds, search],
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
          props.getAttributionCard(filteredAndSortedPackageCardIds[index])
        }
        max={props.max}
        length={filteredAndSortedPackageCardIds.length}
        cardVerticalDistance={CARD_VERTICAL_DISTANCE}
      />
    </div>
  );
}
