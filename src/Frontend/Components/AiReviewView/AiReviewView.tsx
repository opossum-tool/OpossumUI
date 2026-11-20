// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionDetails } from '../AttributionDetails/AttributionDetails';
import { AttributionsPanel } from '../AttributionPanels/AttributionsPanel/AttributionsPanel';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';
import { useLinkedResourcesPanelState } from '../ResourceBrowser/use-linked-resources-panel-state';
import { ColumnsContainer } from './AiReviewView.style';

export const AiReviewView: React.FC = () => {
  const linkedResourcesPanelState = useLinkedResourcesPanelState();

  return (
    <ColumnsContainer>
      <AttributionsPanel />
      <AttributionDetails />
      <div
        aria-label={'linked resources column'}
        aria-busy={linkedResourcesPanelState.isLoading}
        data-testid={'ai-review-linked-resources-column'}
        style={{ flex: '0 0 30%', minHeight: 0, overflow: 'auto' }}
      >
        {linkedResourcesPanelState.treeState && (
          <LinkedResourcesTree state={linkedResourcesPanelState.treeState} />
        )}
      </div>
    </ColumnsContainer>
  );
};
