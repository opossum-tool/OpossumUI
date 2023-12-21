// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement, useMemo, useState } from 'react';

import { useAppSelector } from '../../state/hooks';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { DisplayPackageInfos } from '../../types/types';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT } from '../PackageCard/PackageCard';
import { SearchTextField } from '../SearchTextField/SearchTextField';

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
  const selectedPackageCardIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );

  const filteredAndSortedPackageCardIds = useMemo(
    () =>
      props.sortedPackageCardIds.filter((packageCardId) =>
        packageInfoContainsSearchTerm(
          props.displayPackageInfos[packageCardId],
          search,
        ),
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
        indexToScrollTo={filteredAndSortedPackageCardIds.indexOf(
          selectedPackageCardIdInAttributionView,
        )}
      />
    </MuiBox>
  );
}
