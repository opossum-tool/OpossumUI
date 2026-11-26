// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState } from 'react';

import {
  AI_REVIEW_FILTERS,
  type AiReviewFilter,
} from '../../../shared/ai-review';
import type { AttributionResultSetCriteria } from '../../../shared/attribution-result-set';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { ROOT_PATH } from '../../shared-constants';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getIsPackageInfoDirty,
  getSelectedAttributionId,
} from '../../state/selectors/resource-selectors';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { backend } from '../../util/backendClient';
import { useAttributionPages } from '../../util/use-attribution-pages';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { AttributionDetails } from '../AttributionDetails/AttributionDetails';
import { AttributionsList } from '../AttributionPanels/AttributionsPanel/AttributionsList/AttributionsList';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import { SearchablePanel } from '../ResizePanels/searchable-panel';
import { useLinkedResourcesPanel } from '../ResourceBrowser/use-linked-resources-panel';
import {
  AttributionsColumn,
  ColumnsContainer,
  DetailsColumn,
  EmptyState,
  FilterCount,
  FilterPill,
  FilterPills,
} from './AiReviewView.style';

export const AiReviewView: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const isPackageInfoDirty = useAppSelector(getIsPackageInfoDirty);
  const { panelSizes, setPanelSizes } = usePanelSizes();
  const [search, setSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState<AiReviewFilter>('all');
  const [linkedResourcesSearchValue, setLinkedResourcesSearchValue] =
    useState('');
  const linkedResourcesPanel = useLinkedResourcesPanel(
    linkedResourcesSearchValue,
    setLinkedResourcesSearchValue,
  );
  const debouncedSearch = useDebouncedInput(search);
  const baseCriteria = useMemo<AttributionResultSetCriteria>(
    () => ({
      external: false,
      aiOnly: true,
      filters: [],
      search: debouncedSearch,
      valueFilters: {},
      resourcePathForRelationships: ROOT_PATH,
      showResolved: false,
      excludeUnrelated: false,
    }),
    [debouncedSearch],
  );
  const criteria = useMemo(
    () => ({ ...baseCriteria, aiReviewFilter: reviewFilter }),
    [baseCriteria, reviewFilter],
  );
  const attributionCounts = backend.getAiReviewCounts.useQuery({
    ...baseCriteria,
    includeReadonly: true,
  });
  const totalAttributionCount = attributionCounts.data?.[reviewFilter];
  const attributionPages = useAttributionPages({
    criteria,
    scope: { mode: 'all' },
    sort: 'alphabetically',
    includeReadonly: true,
    totalCount: totalAttributionCount,
    targetAttributionUuid: selectedAttributionId || undefined,
  });
  const attributionIds = attributionPages.attributions
    ? Object.keys(attributionPages.attributions)
    : null;
  const selectedAttributionIsLoaded =
    selectedAttributionId !== '' &&
    Object.hasOwn(attributionPages.attributions ?? {}, selectedAttributionId);
  const selectedAttributionMatchesCriteria =
    selectedAttributionIsLoaded ||
    (attributionPages.navigationIsSuccess &&
      !attributionPages.navigationFetching &&
      !attributionPages.navigationIsError &&
      attributionPages.navigationResult?.found === true);

  useEffect(() => {
    if (
      !attributionPages.isSuccess ||
      attributionPages.isError ||
      attributionPages.isFetching ||
      isPackageInfoDirty
    ) {
      return;
    }

    if (selectedAttributionId) {
      if (selectedAttributionMatchesCriteria) {
        return;
      }
      if (
        attributionPages.navigationFetching ||
        attributionPages.navigationIsError ||
        !attributionPages.navigationIsSuccess ||
        !attributionPages.navigationResult
      ) {
        return;
      }
    }

    const firstAttributionId = attributionIds?.[0];
    const firstAttribution = firstAttributionId
      ? attributionPages.attributions?.[firstAttributionId]
      : null;
    if (!firstAttribution && !selectedAttributionId) {
      return;
    }
    dispatch(
      changeSelectedAttributionOrOpenUnsavedPopup(firstAttribution ?? null),
    );
  }, [
    attributionIds,
    attributionPages.attributions,
    attributionPages.isError,
    attributionPages.isFetching,
    attributionPages.isSuccess,
    attributionPages.navigationFetching,
    attributionPages.navigationIsError,
    attributionPages.navigationIsSuccess,
    attributionPages.navigationResult,
    dispatch,
    isPackageInfoDirty,
    selectedAttributionId,
    selectedAttributionMatchesCriteria,
  ]);

  const resultsAreSettled =
    attributionPages.isSuccess &&
    !attributionPages.isError &&
    !attributionPages.isFetching;
  const showEmptyState =
    !selectedAttributionId &&
    !isPackageInfoDirty &&
    resultsAreSettled &&
    attributionIds?.length === 0;
  return (
    <ColumnsContainer>
      <ResizableBox
        enable={{ right: true }}
        size={{ height: '100%', width: panelSizes.aiReviewPackageListsWidth }}
        minWidth={120}
        maxWidth="40%"
        onResizeStop={(_event, _direction, ref) =>
          setPanelSizes({ aiReviewPackageListsWidth: ref.offsetWidth })
        }
        sx={{ flexShrink: 0, overflow: 'visible', zIndex: 1 }}
      >
        <AttributionsColumn data-testid={'attributions-panel'}>
          <SearchablePanel
            title={text.packageLists.attributionsPanelTitle}
            headerTestId={'ai-review-attributions-header'}
            search={{
              value: search,
              setValue: setSearch,
              channel: AllowedFrontendChannels.SearchAttributions,
              inputLabel: text.menu.editSubmenu.searchAttributions,
            }}
          >
            <FilterPills
              role="group"
              aria-label={text.aiReviewView.statusFilters}
            >
              {AI_REVIEW_FILTERS.map((filter) => (
                <FilterPill
                  key={filter}
                  component="button"
                  type="button"
                  size="small"
                  clickable
                  aria-pressed={reviewFilter === filter}
                  color={reviewFilter === filter ? 'primary' : 'default'}
                  variant={reviewFilter === filter ? 'filled' : 'outlined'}
                  label={
                    <>
                      {text.aiReviewView.filters[filter]}
                      {attributionCounts.data && (
                        <>
                          {' '}
                          <FilterCount>
                            {attributionCounts.data[filter]}
                          </FilterCount>
                        </>
                      )}
                    </>
                  }
                  onClick={() => setReviewFilter(filter)}
                />
              ))}
            </FilterPills>
            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
              <AttributionsList
                activeAttributionIds={attributionIds}
                attributions={attributionPages.attributions}
                contentHeight={'100%'}
                loading={attributionPages.loading}
                loadingMore={attributionPages.isFetchingNextPage}
                loadMoreError={attributionPages.nextPageError}
                fetchNextPage={attributionPages.fetchNextPage}
                selectedAttributionId={selectedAttributionId}
                totalAttributionCount={totalAttributionCount}
                resultSetKey={attributionPages.resultSetKey}
                onSelect={(attribution) =>
                  dispatch(
                    changeSelectedAttributionOrOpenUnsavedPopup(attribution),
                  )
                }
              />
            </div>
          </SearchablePanel>
        </AttributionsColumn>
      </ResizableBox>
      {showEmptyState ? (
        <DetailsColumn>
          <EmptyState>
            {debouncedSearch || reviewFilter !== 'all'
              ? text.aiReviewView.noMatchingAttributions
              : text.aiReviewView.noAttributionsToReview}
          </EmptyState>
        </DetailsColumn>
      ) : (
        <>
          <DetailsColumn>
            {selectedAttributionId && <AttributionDetails />}
          </DetailsColumn>
          <ResizableBox
            enable={{ left: true }}
            size={{
              height: '100%',
              width: panelSizes.aiReviewResourceBrowserWidth,
            }}
            minWidth={120}
            maxWidth="40%"
            onResizeStop={(_event, _direction, ref) =>
              setPanelSizes({
                aiReviewResourceBrowserWidth: ref.offsetWidth,
              })
            }
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              minHeight: 0,
              overflow: 'visible',
            }}
          >
            <SearchablePanel
              title={linkedResourcesPanel.title}
              headerTestId={linkedResourcesPanel.headerTestId}
              headerDataAttributes={linkedResourcesPanel.headerDataAttributes}
              search={linkedResourcesPanel.search}
            >
              {linkedResourcesPanel.component}
            </SearchablePanel>
          </ResizableBox>
        </>
      )}
    </ColumnsContainer>
  );
};
