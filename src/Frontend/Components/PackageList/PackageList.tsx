// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { ReactElement, useMemo } from 'react';

import { useAppSelector } from '../../state/hooks';
import { getPackageSearchTerm } from '../../state/selectors/audit-view-resource-selectors';
import { DisplayPackageInfos } from '../../types/types';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT } from '../PackageCard/PackageCard';

interface PackageListProps {
  displayPackageInfos: DisplayPackageInfos;
  sortedPackageCardIds: Array<string>;
  getAttributionCard(attributionId: string): ReactElement | null;
  maxNumberOfDisplayedItems?: number;
  listTitle: string;
  fullHeight?: boolean;
}

export function PackageList(props: PackageListProps): ReactElement {
  const searchTerm = useAppSelector(getPackageSearchTerm);

  const filteredPackageCardIds: Array<string> = useMemo(
    () =>
      props.sortedPackageCardIds.filter((packageCardId) =>
        packageInfoContainsSearchTerm(
          props.displayPackageInfos[packageCardId],
          searchTerm,
        ),
      ),
    [props.displayPackageInfos, props.sortedPackageCardIds, searchTerm],
  );

  return (
    <>
      {filteredPackageCardIds.length === 0 ? null : (
        <>
          {props.listTitle ? (
            <MuiTypography variant={'body2'}>{props.listTitle}</MuiTypography>
          ) : null}
          <List
            getListItem={(index: number): ReactElement | null =>
              props.getAttributionCard(filteredPackageCardIds[index])
            }
            maxNumberOfItems={props.maxNumberOfDisplayedItems}
            length={filteredPackageCardIds.length}
            cardHeight={PACKAGE_CARD_HEIGHT}
            fullHeight={props.fullHeight}
          />
        </>
      )}
    </>
  );
}
