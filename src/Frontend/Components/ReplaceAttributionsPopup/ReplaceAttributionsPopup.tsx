// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { compact, pickBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setMultiSelectSelectedAttributionIds } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getCurrentAttributionId,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { getMultiSelectSelectedAttributionIds } from '../../state/selectors/attribution-view-resource-selectors';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { maybePluralize } from '../../util/maybe-pluralize';
import { getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos } from '../AttributionList/AttributionList.util';
import { List } from '../List/List';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PACKAGE_CARD_HEIGHT, PackageCard } from '../PackageCard/PackageCard';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { ContentContainer } from './ReplaceAttributionsPopup.style';

const TOTAL_MAX_NUMBER_OF_PACKAGE_CARDS = 10;
const MAX_NUMBER_OF_PACKAGE_CARDS_PER_LIST = 5;

export function ReplaceAttributionsPopup() {
  const dispatch = useAppDispatch();
  const attributions = useAppSelector(getManualAttributions);
  const multiSelectSelectedAttributionIds = useAppSelector(
    getMultiSelectSelectedAttributionIds,
  );
  const selectedAttributionId = useAppSelector(getCurrentAttributionId);
  const idsToReplace = compact(
    multiSelectSelectedAttributionIds.length
      ? multiSelectSelectedAttributionIds
      : [selectedAttributionId],
  );

  const [search, setSearch] = useState('');
  const [targetAttributionId, setTargetAttributionId] = useState<string>();

  const filteredAttributions = useMemo(
    () =>
      pickBy(
        attributions,
        (_, attributionId) => !idsToReplace.includes(attributionId),
      ),
    [attributions, idsToReplace],
  );
  const { filteredAndSortedIds, filteredAndSortedAttributions } = useMemo(
    () =>
      getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
        filteredAttributions,
        search,
        false,
      ),
    [filteredAttributions, search],
  );

  useEffect(() => {
    if (
      targetAttributionId &&
      !filteredAndSortedIds.includes(targetAttributionId)
    ) {
      setTargetAttributionId(undefined);
    }
  }, [filteredAndSortedIds, targetAttributionId]);

  const handleReplace = () => {
    if (!targetAttributionId) {
      return;
    }
    dispatch(setMultiSelectSelectedAttributionIds([]));
    dispatch(closePopup());
    dispatch(
      changeSelectedAttributionIdOrOpenUnsavedPopup(targetAttributionId),
    );
    if (attributions[targetAttributionId].preSelected) {
      dispatch(
        savePackageInfo(
          null,
          targetAttributionId,
          attributions[targetAttributionId],
        ),
      );
    }
    idsToReplace.forEach((markedAttributionId) => {
      dispatch(
        savePackageInfo(
          null,
          markedAttributionId,
          attributions[targetAttributionId],
          markedAttributionId !== targetAttributionId,
        ),
      );
    });
  };

  return (
    <NotificationPopup
      content={renderContent()}
      header={text.replaceAttributionsPopup.title}
      leftButtonConfig={{
        disabled: !targetAttributionId,
        onClick: handleReplace,
        buttonText: text.replaceAttributionsPopup.replace,
      }}
      rightButtonConfig={{
        onClick: () => dispatch(closePopup()),
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen
      aria-label={'replace attributions popup'}
      width={500}
    />
  );

  function renderContent() {
    return (
      <ContentContainer>
        {renderAttributionsToRemove()}
        {renderAttributionsToAdd()}
      </ContentContainer>
    );
  }

  function renderAttributionsToRemove() {
    return (
      <MuiBox data-testid={'removed-attributions'}>
        <MuiTypography paragraph>
          {text.replaceAttributionsPopup.removeAttributions(
            maybePluralize(
              idsToReplace.length,
              text.attributionList.attribution,
            ),
          )}
        </MuiTypography>
        <List
          getListItem={(index) => {
            const attributionId = idsToReplace[index];
            const attribution = attributions[attributionId];

            if (!attribution) {
              return null;
            }

            return (
              <PackageCard
                cardId={attributionId}
                cardConfig={{
                  isPreSelected: attribution.preSelected,
                }}
                displayPackageInfo={convertPackageInfoToDisplayPackageInfo(
                  attribution,
                  [],
                )}
                hideResourceSpecificButtons
                hideContextMenuAndMultiSelect
              />
            );
          }}
          length={idsToReplace.length}
          cardHeight={PACKAGE_CARD_HEIGHT}
          maxNumberOfItems={MAX_NUMBER_OF_PACKAGE_CARDS_PER_LIST}
        />
      </MuiBox>
    );
  }

  function renderAttributionsToAdd() {
    return (
      <MuiBox data-testid={'added-attributions'}>
        <MuiTypography paragraph>
          {text.replaceAttributionsPopup.selectReplacement}
        </MuiTypography>
        <SearchTextField
          onInputChange={(value) => setSearch(value)}
          search={search}
          sx={{ marginTop: 0, marginBottom: '4px' }}
        />
        <List
          getListItem={(index) => {
            const attributionId = filteredAndSortedIds[index];
            const attribution = filteredAndSortedAttributions[attributionId];

            if (!attribution) {
              return null;
            }

            return (
              <PackageCard
                cardId={attributionId}
                onClick={() =>
                  targetAttributionId && targetAttributionId === attributionId
                    ? setTargetAttributionId(undefined)
                    : setTargetAttributionId(attributionId)
                }
                cardConfig={{
                  isSelected: attributionId === targetAttributionId,
                  isPreSelected: attribution.preSelected,
                }}
                displayPackageInfo={attribution}
                hideResourceSpecificButtons
                hideContextMenuAndMultiSelect
              />
            );
          }}
          length={filteredAndSortedIds.length}
          cardHeight={PACKAGE_CARD_HEIGHT}
          maxNumberOfItems={Math.max(
            TOTAL_MAX_NUMBER_OF_PACKAGE_CARDS - idsToReplace.length,
            MAX_NUMBER_OF_PACKAGE_CARDS_PER_LIST,
          )}
          minNumberOfItems={Object.keys(filteredAttributions).length}
        />
      </MuiBox>
    );
  }
}
