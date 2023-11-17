// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement, useMemo, useState } from 'react';

import { DisplayPackageInfos } from '../../types/types';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT } from '../PackageCard/PackageCard';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { getFilteredPackageCardIdsFromDisplayPackageInfos } from './package-list-helpers';

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
  getAttributionCard(
    packageCardId: string,
    props: { isScrolling: boolean },
  ): ReactElement | null;
}

export function AttributionsViewPackageList(
  props: AttributionsViewPackageListProps,
): ReactElement {
  const [search, setSearch] = useState('');

  const filteredAndSortedPackageCardIds = useMemo(
    (): Array<string> =>
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
        getListItem={(index, { isScrolling }): ReactElement | null =>
          props.getAttributionCard(filteredAndSortedPackageCardIds[index], {
            isScrolling,
          })
        }
        length={filteredAndSortedPackageCardIds.length}
        cardHeight={PACKAGE_CARD_HEIGHT}
        fullHeight
      />
    </MuiBox>
  );
}
