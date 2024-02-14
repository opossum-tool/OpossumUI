// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Divider } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { without } from 'lodash';

import { Relation } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getExternalAttributionSources,
  getResolvedExternalAttributions,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { useFilteredSignals } from '../../../state/variables/use-filtered-data';
import { getRelationPriority } from '../../../util/sort-attributions';
import { SourceIcon } from '../../Icons/Icons';
import { PackageCard } from '../../PackageCard/PackageCard';
import {
  PackageList,
  PackageListChildrenProps,
} from '../PackageList/PackageList';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { IncludeExcludeButton } from './IncludeExcludeButton/IncludeExcludeButton';
import { LinkButton } from './LinkButton/LinkButton';
import { RestoreButton } from './RestoreButton/RestoreButton';
import { Chip, GroupName } from './SignalList.style';

export function SignalList() {
  const dispatch = useAppDispatch();
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions,
  );
  const sources = useAppSelector(getExternalAttributionSources);
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  return (
    <PackageList
      orderBy={[
        ({ relation }) => getRelationPriority(relation),
        ({ source }) => (source && sources[source.name])?.priority ?? 0,
      ]}
      order={['desc', 'desc']}
      groupBy={({ source, relation }) =>
        [
          source ? sources[source.name]?.name || source.name : '',
          relation || '',
        ].join('::')
      }
      renderItemContent={renderAttributionCard}
      renderGroupName={renderGroupName}
      useFilteredData={useFilteredSignals}
    >
      {(props) => (
        <>
          <LinkButton {...props} />
          <DeleteButton {...props} />
          <RestoreButton {...props} />
          <MuiBox flex={1} />
          <IncludeExcludeButton />
        </>
      )}
    </PackageList>
  );

  function renderGroupName(key: string) {
    return (
      <>
        <SourceIcon noTooltip />
        <GroupName>
          {key.split('::')[0] || text.packageLists.unknownSource}
        </GroupName>
        <Chip
          label={text.relations[key.split('::')[1] as Relation]}
          size={'small'}
          variant={'outlined'}
          color={'default'}
        />
      </>
    );
  }

  function renderAttributionCard(
    attributionId: string,
    {
      attributions,
      selectedAttributionId,
      multiSelectedAttributionIds,
      setMultiSelectedAttributionIds,
    }: PackageListChildrenProps,
  ) {
    const attribution = attributions[attributionId];

    if (!attribution) {
      return null;
    }

    return (
      <>
        <PackageCard
          onClick={() => {
            if (selectedAttributionId === attributionId) {
              return;
            }
            dispatch(changeSelectedAttributionOrOpenUnsavedPopup(attribution));
          }}
          cardConfig={{
            isSelected: attributionId === selectedAttributionId,
            isResolved: resolvedExternalAttributionIds.has(attributionId),
          }}
          packageInfo={attribution}
          checkbox={{
            checked: multiSelectedAttributionIds.includes(attributionId),
            disabled: !!attributionIdsForReplacement.length,
            onChange: (event) => {
              setMultiSelectedAttributionIds(
                event.target.checked
                  ? [...multiSelectedAttributionIds, attributionId]
                  : without(multiSelectedAttributionIds, attributionId),
              );
              !selectedAttributionId &&
                dispatch(
                  changeSelectedAttributionOrOpenUnsavedPopup(attribution),
                );
            },
          }}
        />
        <Divider />
      </>
    );
  }
}
