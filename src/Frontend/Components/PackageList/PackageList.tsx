// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement, useMemo } from 'react';
import MuiTypography from '@mui/material/Typography';
import { List } from '../List/List';
import { useAppSelector } from '../../state/hooks';
import { getPackageSearchTerm } from '../../state/selectors/audit-view-resource-selectors';
import { getFilteredPackageCardIdsFromDisplayPackageInfos } from './package-list-helpers';
import { DisplayPackageInfos } from '../../types/types';

const CARD_VERTICAL_DISTANCE = 41;
const TYPICAL_SCROLLBAR_WIDTH = 13;

const classes = {
  paddingRight: {
    paddingRight: `${TYPICAL_SCROLLBAR_WIDTH}px`,
  },
};

interface PackageListProps {
  displayPackageInfos: DisplayPackageInfos;
  sortedPackageCardIds: Array<string>;
  getAttributionCard(attributionId: string): ReactElement | null;
  maxNumberOfDisplayedItems: number;
  listTitle: string;
}

export function PackageList(props: PackageListProps): ReactElement {
  const searchTerm = useAppSelector(getPackageSearchTerm);

  const filteredPackageCardIds: Array<string> = useMemo(
    () =>
      getFilteredPackageCardIdsFromDisplayPackageInfos(
        props.displayPackageInfos,
        props.sortedPackageCardIds,
        searchTerm,
      ),
    [props.displayPackageInfos, props.sortedPackageCardIds, searchTerm],
  );

  const currentHeight =
    props.sortedPackageCardIds.length * CARD_VERTICAL_DISTANCE;
  const maxHeight = props.maxNumberOfDisplayedItems * CARD_VERTICAL_DISTANCE;

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
            max={{ numberOfDisplayedItems: props.maxNumberOfDisplayedItems }}
            length={filteredPackageCardIds.length}
            cardVerticalDistance={CARD_VERTICAL_DISTANCE}
            sx={currentHeight < maxHeight ? classes.paddingRight : {}}
          />
        </>
      )}
    </>
  );
}
