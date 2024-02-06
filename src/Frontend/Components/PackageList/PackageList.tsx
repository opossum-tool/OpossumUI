// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { ReactElement, useMemo } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { useAppSelector } from '../../state/hooks';
import { getPackageSearchTerm } from '../../state/selectors/audit-view-resource-selectors';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT } from '../PackageCard/PackageCard';

interface PackageListProps {
  displayPackageInfos: Array<PackageInfo>;
  getAttributionCard(attributionId: string): ReactElement | null;
  maxNumberOfDisplayedItems?: number;
  listTitle: string;
  fullHeight?: boolean;
}

export function PackageList(props: PackageListProps): ReactElement {
  const searchTerm = useAppSelector(getPackageSearchTerm);

  const filteredPackages = useMemo(
    () =>
      props.displayPackageInfos.filter((packageInfo) =>
        packageInfoContainsSearchTerm(packageInfo, searchTerm),
      ),
    [props.displayPackageInfos, searchTerm],
  );

  return (
    <>
      {filteredPackages.length === 0 ? null : (
        <>
          {props.listTitle ? (
            <MuiTypography variant={'body2'}>{props.listTitle}</MuiTypography>
          ) : null}
          <List
            getListItem={(index) =>
              props.getAttributionCard(filteredPackages[index].id)
            }
            maxNumberOfItems={props.maxNumberOfDisplayedItems}
            length={filteredPackages.length}
            cardHeight={PACKAGE_CARD_HEIGHT}
            fullHeight={props.fullHeight}
          />
        </>
      )}
    </>
  );
}
