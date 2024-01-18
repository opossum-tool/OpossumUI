// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import MuiBadge from '@mui/material/Badge';
import MuiIconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { difference, intersection, isEqual } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import { PopupType } from '../../enums/enums';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setMultiSelectSelectedAttributionIds } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getProjectMetadata } from '../../state/selectors/all-views-resource-selectors';
import {
  getMultiSelectSelectedAttributionIds,
  getSelectedAttributionIdInAttributionView,
} from '../../state/selectors/attribution-view-resource-selectors';
import {
  SORT_ICONS,
  useAttributionSorting,
} from '../../state/variables/use-active-sorting';
import { useFilteredAttributions } from '../../state/variables/use-filtered-attributions';
import { usePrevious } from '../../util/use-previous';
import { Checkbox } from '../Checkbox/Checkbox';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT, PackageCard } from '../PackageCard/PackageCard';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { SelectMenu } from '../SelectMenu/SelectMenu';
import { Spinner } from '../Spinner/Spinner';
import { ActionBar, ButtonGroup, Container } from './AttributionList.style';
import { useFilterMenuOptions } from './AttributionList.util';

export function AttributionList() {
  const dispatch = useAppDispatch();
  const multiSelectSelectedAttributionIds = useAppSelector(
    getMultiSelectSelectedAttributionIds,
  );
  const selectedAttributionIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const projectMetadata = useAppSelector(getProjectMetadata);

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement>();
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement>();

  const { attributionSorting, options: sortingOptions } =
    useAttributionSorting();
  const [
    { attributions, attributionIds, loading, search },
    setFilteredAttributions,
  ] = useFilteredAttributions();

  const effectiveSelectedIds = useMemo(
    () => intersection(attributionIds, multiSelectSelectedAttributionIds),
    [attributionIds, multiSelectSelectedAttributionIds],
  );
  const prevEffectiveSelectedIds = usePrevious(
    effectiveSelectedIds,
    effectiveSelectedIds,
  );

  useEffect(() => {
    if (!isEqual(effectiveSelectedIds, prevEffectiveSelectedIds)) {
      dispatch(setMultiSelectSelectedAttributionIds(effectiveSelectedIds));
    }
  }, [dispatch, effectiveSelectedIds, prevEffectiveSelectedIds]);

  const { selectedFilters, options: filterMenuOptions } =
    useFilterMenuOptions();
  const someSelectedAttributionsArePreSelected = useMemo(
    () =>
      multiSelectSelectedAttributionIds.some(
        (id) => attributions[id]?.preSelected,
      ),
    [attributions, multiSelectSelectedAttributionIds],
  );

  const areAllAttributionsSelected = useMemo(
    () =>
      !!attributionIds.length &&
      !difference(attributionIds, multiSelectSelectedAttributionIds).length,
    [attributionIds, multiSelectSelectedAttributionIds],
  );

  if (!projectMetadata.projectId) {
    return null;
  }

  return (
    <Container
      aria-label={'attribution list'}
      defaultSize={{ width: '30%', height: 'auto' }}
    >
      <SearchTextField
        onInputChange={(value) => {
          setFilteredAttributions((prev) => ({ ...prev, search: value }));
        }}
        search={search}
      />
      {renderActionBar()}
      <List
        getListItem={(index, { isScrolling }) =>
          renderAttributionCard(attributionIds[index], isScrolling)
        }
        length={attributionIds.length}
        cardHeight={PACKAGE_CARD_HEIGHT}
        fullHeight
        indexToScrollTo={attributionIds.indexOf(
          selectedAttributionIdInAttributionView,
        )}
      />
      <SelectMenu
        anchorEl={filterAnchorEl}
        setAnchorEl={setFilterAnchorEl}
        options={filterMenuOptions}
        horizontal={'right'}
        multiple
      />
      <SelectMenu
        anchorEl={sortAnchorEl}
        setAnchorEl={setSortAnchorEl}
        options={sortingOptions}
        horizontal={'right'}
      />
    </Container>
  );

  function renderAttributionCard(attributionId: string, isScrolling: boolean) {
    const displayPackageInfo = attributions[attributionId];

    return (
      <PackageCard
        cardId={`attribution-list-${attributionId}`}
        onClick={() => {
          if (selectedAttributionIdInAttributionView === attributionId) {
            return;
          }
          dispatch(
            changeSelectedAttributionIdOrOpenUnsavedPopup(attributionId),
          );
        }}
        cardConfig={{
          isSelected: attributionId === selectedAttributionIdInAttributionView,
          isPreSelected: displayPackageInfo.preSelected,
        }}
        key={`AttributionCard-${displayPackageInfo.packageName}-${attributionId}`}
        displayPackageInfo={displayPackageInfo}
        showCheckBox
        isScrolling={isScrolling}
      />
    );
  }

  function renderActionBar() {
    return (
      <ActionBar>
        <ButtonGroup>
          {renderSelectAllCheckbox()}
          {renderDeleteButton()}
          {renderConfirmButton()}
          {renderReplaceButton()}
        </ButtonGroup>
        <ButtonGroup>
          {renderSortButton()}
          {renderFilterButton()}
        </ButtonGroup>
      </ActionBar>
    );
  }

  function renderSelectAllCheckbox() {
    return (
      <Tooltip title={'Select'} disableInteractive>
        <span>
          <Checkbox
            disabled={!attributionIds.length}
            checked={areAllAttributionsSelected}
            onChange={() =>
              dispatch(
                setMultiSelectSelectedAttributionIds(
                  areAllAttributionsSelected ? [] : attributionIds,
                ),
              )
            }
          />
        </span>
      </Tooltip>
    );
  }

  function renderDeleteButton() {
    return (
      <Tooltip title={text.attributionList.deleteSelected} disableInteractive>
        <span>
          <MuiIconButton
            aria-label={'delete button'}
            disabled={
              !multiSelectSelectedAttributionIds.length &&
              (!selectedAttributionIdInAttributionView ||
                !attributionIds.includes(
                  selectedAttributionIdInAttributionView,
                ))
            }
            onClick={() => {
              dispatch(openPopup(PopupType.ConfirmMultiSelectDeletionPopup));
            }}
          >
            <DeleteIcon />
          </MuiIconButton>
        </span>
      </Tooltip>
    );
  }

  function renderConfirmButton() {
    return (
      <Tooltip title={text.attributionList.confirmSelected} disableInteractive>
        <span>
          <MuiIconButton
            aria-label={'confirm button'}
            disabled={
              (!multiSelectSelectedAttributionIds.length ||
                !someSelectedAttributionsArePreSelected) &&
              (!attributions[selectedAttributionIdInAttributionView]
                ?.preSelected ||
                !attributionIds.includes(
                  selectedAttributionIdInAttributionView,
                ))
            }
            onClick={() => {
              (multiSelectSelectedAttributionIds.length
                ? multiSelectSelectedAttributionIds
                : [selectedAttributionIdInAttributionView]
              ).forEach((attributionId) => {
                attributions[attributionId]?.preSelected &&
                  dispatch(
                    savePackageInfo(
                      null,
                      attributionId,
                      attributions[attributionId],
                      attributionId !== selectedAttributionIdInAttributionView,
                    ),
                  );
              });
            }}
          >
            <DoneAllIcon />
          </MuiIconButton>
        </span>
      </Tooltip>
    );
  }

  function renderReplaceButton() {
    return (
      <Tooltip title={text.attributionList.replaceSelected} disableInteractive>
        <span>
          <MuiIconButton
            aria-label={'replace button'}
            disabled={
              (!multiSelectSelectedAttributionIds.length &&
                (!selectedAttributionIdInAttributionView ||
                  !attributionIds.includes(
                    selectedAttributionIdInAttributionView,
                  ))) ||
              !(
                attributionIds.length - multiSelectSelectedAttributionIds.length
              ) ||
              attributionIds.length < 2
            }
            onClick={() => {
              dispatch(openPopup(PopupType.ReplaceAttributionsPopup));
            }}
          >
            <ChangeCircleIcon />
          </MuiIconButton>
        </span>
      </Tooltip>
    );
  }

  function renderSortButton() {
    return (
      <Tooltip title={text.buttons.sort} disableInteractive>
        <span>
          <MuiIconButton
            aria-label={'sort button'}
            onClick={(event) => setSortAnchorEl(event.currentTarget)}
            disabled={!filterMenuOptions.length}
          >
            <MuiBadge
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              badgeContent={SORT_ICONS[attributionSorting]}
            >
              <SortIcon />
            </MuiBadge>
          </MuiIconButton>
        </span>
      </Tooltip>
    );
  }

  function renderFilterButton() {
    return (
      <Tooltip title={text.buttons.filter} disableInteractive>
        <span>
          <MuiIconButton
            aria-label={'filter button'}
            onClick={(event) => setFilterAnchorEl(event.currentTarget)}
            disabled={!filterMenuOptions.length}
          >
            <MuiBadge
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              color={'success'}
              variant={'dot'}
              invisible={!selectedFilters.length || loading}
            >
              <MuiBadge
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                invisible={!loading}
                badgeContent={<Spinner size={8} />}
              >
                <FilterAltIcon />
              </MuiBadge>
            </MuiBadge>
          </MuiIconButton>
        </span>
      </Tooltip>
    );
  }
}
