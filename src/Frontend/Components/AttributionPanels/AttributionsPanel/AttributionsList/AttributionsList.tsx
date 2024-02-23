// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import { without } from 'lodash';

import { TRANSITION } from '../../../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { isPackageInfoIncomplete } from '../../../../util/is-important-attribution-information-missing';
import { List, ListItemContentProps } from '../../../List/List';
import { PackageCard } from '../../../PackageCard/PackageCard';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const AttributionsList: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  activeAttributionIds,
  selectedAttributionId,
  contentHeight,
  loading,
  setMultiSelectedAttributionIds,
  multiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();

  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  return (
    <List
      renderItemContent={renderAttributionCard}
      data={activeAttributionIds}
      selected={selectedAttributionId}
      loading={loading}
      sx={{ transition: TRANSITION, height: contentHeight }}
    />
  );

  function renderAttributionCard(
    attributionId: string,
    { selected, focused }: ListItemContentProps,
  ) {
    const attribution = attributions?.[attributionId];

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
            selected,
            focused,
            resolved: attributionIdsForReplacement.includes(attributionId),
            incomplete: isPackageInfoIncomplete(attribution),
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
        <MuiDivider />
      </>
    );
  }
};
