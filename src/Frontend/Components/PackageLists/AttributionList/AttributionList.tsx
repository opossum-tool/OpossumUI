// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Divider from '@mui/material/Divider';
import { without } from 'lodash';
import { useMemo } from 'react';

import { Relation } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { HighlightingColor } from '../../../enums/enums';
import { OpossumColors } from '../../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getManualAttributions,
  getResourcesToManualAttributions,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../state/variables/use-attribution-ids-for-replacement';
import { useFilteredAttributions } from '../../../state/variables/use-filtered-data';
import { isPackageInfoIncomplete } from '../../../util/is-important-attribution-information-missing';
import { getRelationPriority } from '../../../util/sort-attributions';
import { PackageCard } from '../../PackageCard/PackageCard';
import {
  Alert,
  PackageList,
  PackageListChildrenProps,
} from '../PackageList/PackageList';
import { Chip, ChipContainer } from './AttributionList.style';
import { ConfirmButton } from './ConfirmButton/ConfirmButton';
import { CreateButton } from './CreateButton/CreateButton';
import { DeleteButton } from './DeleteButton/DeleteButton';
import { LinkButton } from './LinkButton/LinkButton';
import { ReplaceButton } from './ReplaceButton/ReplaceButton';

export function AttributionList() {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions,
  );
  const manualAttributions = useAppSelector(getManualAttributions);

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  const alert = useMemo<Alert | undefined>(() => {
    if (attributionIdsForReplacement.length) {
      return {
        text: text.packageLists.selectReplacement,
        color: OpossumColors.green,
      };
    }
    if (
      resourcesToManualAttributions[selectedResourceId]?.some(
        (id) =>
          manualAttributions[id] &&
          isPackageInfoIncomplete(manualAttributions[id]),
      )
    ) {
      return {
        text: text.packageLists.incompleteAttributions,
        color: OpossumColors.lightOrange,
        textColor: OpossumColors.black,
      };
    }

    return undefined;
  }, [
    attributionIdsForReplacement.length,
    manualAttributions,
    resourcesToManualAttributions,
    selectedResourceId,
  ]);

  return (
    <PackageList
      orderBy={[({ relation }) => getRelationPriority(relation)]}
      order={['desc']}
      groupBy={({ relation }) => relation || 'outside'}
      renderItemContent={renderAttributionCard}
      renderGroupName={renderGroupName}
      useFilteredData={useFilteredAttributions}
      alert={alert}
    >
      {(props) => (
        <>
          <CreateButton {...props} />
          <LinkButton {...props} />
          <DeleteButton {...props} />
          <ConfirmButton {...props} />
          <ReplaceButton {...props} />
        </>
      )}
    </PackageList>
  );

  function renderGroupName(key: string) {
    return (
      <ChipContainer>
        <Chip
          label={text.relations[key as Relation]}
          size={'small'}
          variant={'outlined'}
          color={'default'}
        />
      </ChipContainer>
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
            selectedAttributionId !== attributionId &&
              dispatch(
                changeSelectedAttributionOrOpenUnsavedPopup(attribution),
              );
          }}
          cardConfig={{
            isSelected: attributionId === selectedAttributionId,
            isPreSelected: attribution.preSelected,
            isResolved: attributionIdsForReplacement.includes(attributionId),
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
          highlighting={
            isPackageInfoIncomplete(attribution)
              ? HighlightingColor.LightOrange
              : undefined
          }
        />
        <Divider />
      </>
    );
  }
}
