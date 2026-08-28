// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { noop } from 'lodash-es';
import { Provider } from 'react-redux';
import { VirtuosoMockContext } from 'react-virtuoso';

import type { AllMatchingAttributionSelection } from '../../../../shared/attribution-selection';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { createTestStore, renderComponent } from '../../../test-helpers/render';
import { backend } from '../../../util/backendClient';
import { queryClient } from '../../AppContainer/queryClient';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup';

describe('ConfirmAttributionActionPopup', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('keeps actions disabled until resource information is ready', async () => {
    await renderComponent(
      <ConfirmAttributionActionPopup
        open
        onClose={noop}
        header={'Confirm action'}
        ariaLabel={'confirm action popup'}
        description={'Description'}
        mixedWarning={'Warning'}
        attributions={undefined}
        localAction={{
          buttonText: 'Save locally',
          onClick: noop,
          isPending: false,
          available: true,
        }}
        globalAction={{
          buttonText: 'Save globally',
          onClick: noop,
          isPending: false,
        }}
        linkedResourcesTreeState={undefined}
        mixedAttributionCount={0}
        isResourceInfoReady={false}
        isLocalActionAvailable={true}
        selection={{ mode: 'explicit', attributionUuids: [] }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save locally' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Save globally' }),
    ).toBeDisabled();
  });

  it('keeps a pending local action visible when availability is lost', async () => {
    await renderComponent(
      <ConfirmAttributionActionPopup
        open
        onClose={noop}
        header={'Confirm action'}
        ariaLabel={'confirm action popup'}
        description={'Description'}
        mixedWarning={'Warning'}
        attributions={undefined}
        localAction={{
          buttonText: 'Save locally',
          onClick: noop,
          isPending: true,
        }}
        globalAction={{
          buttonText: 'Save globally',
          onClick: noop,
          isPending: false,
        }}
        linkedResourcesTreeState={undefined}
        mixedAttributionCount={0}
        isResourceInfoReady
        isLocalActionAvailable={false}
        selection={{ mode: 'explicit', attributionUuids: [] }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save locally' })).toBeVisible();
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('previews query-wide selections while honoring exclusions', async () => {
    const included = faker.opossum.packageInfo({
      packageName: 'included',
      packageVersion: undefined,
    });
    const excluded = faker.opossum.packageInfo({
      packageName: 'excluded',
      packageVersion: undefined,
    });
    const resource = '/resource';

    await renderComponent(
      <ConfirmAttributionActionPopup
        open
        onClose={noop}
        header={'Confirm action'}
        ariaLabel={'confirm action popup'}
        description={'Description'}
        mixedWarning={'Warning'}
        attributions={undefined}
        globalAction={{
          buttonText: 'Confirm',
          onClick: noop,
          isPending: false,
        }}
        linkedResourcesTreeState={undefined}
        mixedAttributionCount={0}
        isResourceInfoReady
        isLocalActionAvailable={false}
        selection={{
          mode: 'allMatching',
          query: {
            external: false,
            filters: [],
            search: '',
            valueFilters: {},
            resourcePathForRelationships: resource,
            showResolved: false,
            excludeUnrelated: false,
            relation: 'resource',
          },
          excludedAttributionUuids: [excluded.id],
        }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [included.id]: included,
            [excluded.id]: excluded,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [included.id, excluded.id],
          }),
          resources: pathsToResources([resource]),
        }),
      },
    );

    expect(await screen.findByLabelText('package card included')).toBeVisible();
    expect(
      screen.queryByLabelText('package card excluded'),
    ).not.toBeInTheDocument();
  });

  it('refreshes a cached query-wide preview after an attribution mutation', async () => {
    const resource = '/resource';
    const attribution = faker.opossum.packageInfo({
      id: 'attribution-id',
      packageName: 'before',
      packageVersion: undefined,
    });
    const updatedAttribution = { ...attribution, packageName: 'after' };
    const selection: AllMatchingAttributionSelection = {
      mode: 'allMatching',
      query: {
        external: false,
        filters: [],
        search: '',
        valueFilters: {},
        resourcePathForRelationships: resource,
        showResolved: false,
        excludeUnrelated: false,
        relation: 'resource',
      },
      excludedAttributionUuids: [],
    };
    const data = getParsedInputFileEnrichedWithTestData({
      manualAttributions: { [attribution.id]: attribution },
      resourcesToManualAttributions: { [resource]: [attribution.id] },
      resources: pathsToResources([resource]),
    });
    const store = await createTestStore(data);
    const api = vi.mocked(window.electronAPI.api);
    const popup = (open: boolean) => {
      const selectionForRender: AllMatchingAttributionSelection = {
        ...selection,
        query: { ...selection.query },
        excludedAttributionUuids: [...selection.excludedAttributionUuids],
      };
      return (
        <ConfirmAttributionActionPopup
          open={open}
          onClose={noop}
          header={'Confirm action'}
          ariaLabel={'confirm action popup'}
          description={'Description'}
          mixedWarning={'Warning'}
          attributions={undefined}
          globalAction={{
            buttonText: 'Confirm',
            onClick: noop,
            isPending: false,
          }}
          linkedResourcesTreeState={undefined}
          mixedAttributionCount={0}
          isResourceInfoReady
          isLocalActionAvailable={false}
          selection={selectionForRender}
        />
      );
    };
    const view = render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <VirtuosoMockContext value={{ itemHeight: 40, viewportHeight: 1200 }}>
            {popup(true)}
          </VirtuosoMockContext>
        </QueryClientProvider>
      </Provider>,
    );

    expect(await screen.findByLabelText('package card before')).toBeVisible();
    expect(
      api.mock.calls.filter(
        ([command]) => command === 'listAttributionPreview',
      ),
    ).toHaveLength(1);

    view.rerender(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <VirtuosoMockContext value={{ itemHeight: 40, viewportHeight: 1200 }}>
            {popup(false)}
          </VirtuosoMockContext>
        </QueryClientProvider>
      </Provider>,
    );
    await backend.updateAttributions.mutate({
      attributions: { [attribution.id]: updatedAttribution },
    });
    view.rerender(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <VirtuosoMockContext value={{ itemHeight: 40, viewportHeight: 1200 }}>
            {popup(true)}
          </VirtuosoMockContext>
        </QueryClientProvider>
      </Provider>,
    );

    expect(await screen.findByLabelText('package card after')).toBeVisible();
    expect(
      api.mock.calls.filter(
        ([command]) => command === 'listAttributionPreview',
      ),
    ).toHaveLength(2);
  });
});
