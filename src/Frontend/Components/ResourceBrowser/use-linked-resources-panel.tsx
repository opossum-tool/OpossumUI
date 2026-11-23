// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { View } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getSelectedView } from '../../state/selectors/view-selector';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { LoadingIndicator } from '../LoadingIndicator/loading-indicator';
import { LinkedResourcesTree } from './LinkedResourcesTree/LinkedResourcesTree';
import { useLinkedResourcesPanelState } from './use-linked-resources-panel-state';

export function useLinkedResourcesPanel(
  value: string,
  setValue: (value: string) => void,
) {
  const isAiReviewView = useAppSelector(getSelectedView) === View.AiReview;
  const debouncedSearch = useDebouncedInput(value);
  const panelState = useLinkedResourcesPanelState({ search: debouncedSearch });
  const search = {
    value,
    setValue,
    channel: AllowedFrontendChannels.SearchLinkedResources,
    inputLabel: text.menu.editSubmenu.searchResourceLinked,
  };

  return {
    title: panelState.treeState
      ? text.resourceBrowser.linkedResources(
          panelState.treeState.belowSelectedResource ?? 0,
          panelState.treeState.count,
        )
      : text.resourceBrowser.linkedResourcesTitle,
    search,
    hidden: panelState.isHidden,
    component: (
      <div
        aria-busy={panelState.isLoading}
        data-testid={'linked-resources-panel-content'}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {panelState.isIndicatorVisible && (
          <LoadingIndicator data-testid={'linked-resources-loading'} />
        )}
        <div inert={panelState.isLoading} style={{ height: '100%' }}>
          {panelState.treeState && (
            <LinkedResourcesTree
              state={panelState.treeState}
              disableHighlightSelected={isAiReviewView}
              disableNavigation={isAiReviewView}
            />
          )}
        </div>
      </div>
    ),
    headerDataAttributes: {
      'data-applied-search':
        value === debouncedSearch && panelState.isSearchApplied
          ? debouncedSearch
          : undefined,
    },
    headerTestId: 'linked-resources-tree-header',
  };
}
