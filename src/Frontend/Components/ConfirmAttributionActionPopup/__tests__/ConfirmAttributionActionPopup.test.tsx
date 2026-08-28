// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { noop } from 'lodash-es';

import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup';

describe('ConfirmAttributionActionPopup', () => {
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
});
