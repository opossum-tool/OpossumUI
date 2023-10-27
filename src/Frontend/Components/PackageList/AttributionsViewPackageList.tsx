// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement, useMemo, useState } from 'react';
import { DisplayPackageInfos } from '../../types/types';
import { List } from '../List/List';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { getFilteredPackageCardIdsFromDisplayPackageInfos } from './package-list-helpers';
import MuiBox from '@mui/material/Box';
import { PACKAGE_CARD_HEIGHT } from '../PackageCard/PackageCard';

const classes = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
};

interface AttributionsViewPackageListProps {
  displayPackageInfos: DisplayPackageInfos;
  sortedPackageCardIds: Array<string>;
  getAttributionCard(packageCardId: string): ReactElement | null;
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
    <MuiBox sx={classes.container}>
      <SearchTextField onInputChange={setSearch} search={search} />
      <List
        getListItem={(index: number): ReactElement | null =>
          props.getAttributionCard(filteredAndSortedPackageCardIds[index])
        }
        length={filteredAndSortedPackageCardIds.length}
        cardHeight={PACKAGE_CARD_HEIGHT}
        fullHeight
      />
    </MuiBox>
  );
}
