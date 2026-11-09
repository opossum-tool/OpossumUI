// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash-es';

import { executeCommand } from '../../../../ElectronBackend/api/commands';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { getSelectedAttributionId } from '../../../state/selectors/resource-selectors';
import { ATTRIBUTION_SELECTION_FOR_REPLACEMENT } from '../../../state/variables/use-attribution-selection-for-replacement';
import {
  expectManualAttributions,
  expectResourcesToManualAttributions,
} from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmReplacePopup } from '../ConfirmReplacePopup';

describe('ConfirmReplacePopup', () => {
  afterEach(() => {
    vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
  });

  it.each(['success', 'error'])(
    'disables Replace while the resource tree loads and handles %s',
    async (outcome) => {
      const source = faker.opossum.packageInfo();
      const replacement = faker.opossum.packageInfo({ preSelected: true });
      const treeResponse = Promise.withResolvers<void>();
      const treeRequested = vi.fn();
      vi.mocked(window.electronAPI.api).mockImplementation(
        async (command, params) => {
          if (command === 'getLinkedResourceTree') {
            treeRequested();
            await treeResponse.promise;
          }
          return executeCommand(command, params as never);
        },
      );
      const { queryClient } = await renderComponent(
        <ConfirmReplacePopup
          open
          onClose={noop}
          selectedAttribution={replacement}
        />,
        {
          data: getParsedInputFileEnrichedWithTestData({
            resources: pathsToResources(['/source', '/replacement']),
            manualAttributions: faker.opossum.attributions({
              [source.id]: source,
              [replacement.id]: replacement,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                '/source': [source.id],
                '/replacement': [replacement.id],
              }),
          }),
          actions: [
            setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
              mode: 'explicit',
              attributionUuids: [source.id],
            }),
          ],
        },
      );
      await waitFor(() => expect(treeRequested).toHaveBeenCalled());
      const replaceButton = screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      });
      expect(replaceButton).toBeDisabled();
      act(() => {
        if (outcome === 'error') {
          treeResponse.reject(new Error('Resource tree failed'));
        } else {
          treeResponse.resolve();
        }
      });
      await waitFor(() => {
        expect(
          queryClient
            .getQueryCache()
            .getAll()
            .some((query) => query.state.status === 'error'),
        ).toBe(outcome === 'error');
        expect(replaceButton).toHaveProperty('disabled', outcome === 'error');
      });
    },
  );

  it.each([false, true])(
    'shows replacement-only resources only when confirming the replacement (preSelected: %s)',
    async (preSelected) => {
      const source = faker.opossum.packageInfo({
        packageName: 'source',
        packageVersion: undefined,
      });
      const replacement = faker.opossum.packageInfo({
        packageName: 'replacement',
        preSelected,
      });
      await renderComponent(
        <ConfirmReplacePopup
          open
          onClose={noop}
          selectedAttribution={replacement}
        />,
        {
          data: getParsedInputFileEnrichedWithTestData({
            resources: pathsToResources([
              '/selected',
              '/affected',
              '/replacement-only',
              '/replacement-only-2',
              '/readonly',
            ]),
            manualAttributions: faker.opossum.attributions({
              [source.id]: source,
              [replacement.id]: replacement,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                '/selected': [source.id, replacement.id],
                '/affected': [source.id],
                '/replacement-only': [replacement.id],
                '/replacement-only-2': [replacement.id],
                '/readonly': [source.id],
              }),
            readonlyRules: [{ path: '/readonly', readonly: true }],
          }),
          actions: [
            setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
              mode: 'explicit',
              attributionUuids: [source.id],
            }),
          ],
        },
      );
      const tree = await screen.findByTestId('linked-resources-tree');
      expect(await within(tree).findByText('affected')).toBeVisible();
      expect(Boolean(within(tree).queryByText('replacement-only'))).toBe(
        preSelected,
      );
      expect(Boolean(within(tree).queryByText('replacement-only-2'))).toBe(
        preSelected,
      );
      const removedAttributions = within(
        await screen.findByTestId('removed-attributions'),
      );
      expect(
        removedAttributions.getByLabelText('package card source'),
      ).toBeVisible();
      expect(
        removedAttributions.queryByLabelText('package card replacement'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          text.replaceAttributionsPopup.removeAttributions('attribution'),
        ),
      ).toBeVisible();
      expect(within(tree).queryByText('readonly')).not.toBeInTheDocument();
      const sourceCard = await screen.findByLabelText('package card source');
      expect(
        within(sourceCard).getByLabelText('2 editable linked resources'),
      ).toBeVisible();
      const replacementCard = within(screen.getByTestId('added attributions'));
      expect(
        await replacementCard.findByLabelText('3 editable linked resources'),
      ).toBeVisible();
    },
  );

  it('warns when replacing a mixed attribution', async () => {
    const attributionToReplace = faker.opossum.packageInfo();
    const replacementAttribution = faker.opossum.packageInfo();
    const editableResource = '/editable/file.ts';
    const readonlyResource = '/readonly/file.ts';

    await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={replacementAttribution}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attributionToReplace.id]: attributionToReplace,
            [replacementAttribution.id]: replacementAttribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [editableResource]: [attributionToReplace.id],
            [readonlyResource]: [attributionToReplace.id],
          }),
          resources: pathsToResources([editableResource, readonlyResource]),
          readonlyRules: [{ path: '/readonly', readonly: true }],
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [attributionToReplace.id],
          }),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.confirmAttributionActionPopup.mixedWarning(1),
      ),
    ).toBeVisible();
  });

  it('includes a mixed pre-selected replacement in the warning count', async () => {
    const attributionToReplace = faker.opossum.packageInfo();
    const replacementAttribution = faker.opossum.packageInfo({
      preSelected: true,
      resourceAccess: 'mixed',
    });
    const editableResource = '/editable/file.ts';
    const readonlyResource = '/readonly/file.ts';

    await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={replacementAttribution}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attributionToReplace.id]: attributionToReplace,
            [replacementAttribution.id]: replacementAttribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [editableResource]: [replacementAttribution.id],
            [readonlyResource]: [replacementAttribution.id],
          }),
          resources: pathsToResources([editableResource, readonlyResource]),
          readonlyRules: [{ path: '/readonly', readonly: true }],
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [attributionToReplace.id],
          }),
        ],
      },
    );

    const tree = await screen.findByTestId('linked-resources-tree');
    expect(await within(tree).findByText('editable')).toBeVisible();
    expect(within(tree).queryByText('readonly')).not.toBeInTheDocument();

    expect(
      await screen.findByText(
        text.confirmAttributionActionPopup.mixedWarning(1),
      ),
    ).toBeVisible();
  });

  it('replaces selected attribution with non-pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={packageInfo2}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo1.id, packageInfo2.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [packageInfo1.id],
          }),
        ],
      },
    );

    await screen.findByTestId('removed-attributions');
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: text.replaceAttributionsPopup.replace,
        }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({
      [packageInfo2.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resource]: [packageInfo2.id],
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo2.id);
  });

  it('replaces a query-wide selection without materializing source IDs', async () => {
    const first = faker.opossum.packageInfo({
      packageName: 'first',
      packageVersion: undefined,
      preSelected: true,
    });
    const second = faker.opossum.packageInfo({
      packageName: 'second',
      packageVersion: undefined,
      preSelected: true,
    });
    const replacement = faker.opossum.packageInfo({
      packageName: 'replacement',
      packageVersion: undefined,
    });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={replacement}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [first.id]: first,
            [second.id]: second,
            [replacement.id]: replacement,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [first.id, second.id, replacement.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'allMatching',
            query: {
              external: false,
              filters: [],
              search: '',
              valueFilters: {},
              resourcePathForRelationships: resource,
              showResolved: true,
              excludeUnrelated: false,
              relation: 'resource',
            },
            excludedAttributionUuids: [],
          }),
        ],
      },
    );

    expect(
      await screen.findByText(
        text.replaceAttributionsPopup.removeAttributions('2 attributions'),
      ),
    ).toBeVisible();

    const removedAttributions = within(
      await screen.findByTestId('removed-attributions'),
    );
    expect(
      await removedAttributions.findByLabelText(
        `package card ${first.packageName}`,
      ),
    ).toBeVisible();
    expect(
      await removedAttributions.findByLabelText(
        `package card ${second.packageName}`,
      ),
    ).toBeVisible();
    expect(
      removedAttributions.queryByLabelText(
        `package card ${replacement.packageName}`,
      ),
    ).not.toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({ [replacement.id]: replacement });
    await expectResourcesToManualAttributions({
      [resource]: [replacement.id],
    });
    expect(
      store.getState().variablesState[ATTRIBUTION_SELECTION_FOR_REPLACEMENT],
    ).toBeNull();
  });

  it('replaces selected attribution with pre-selected one', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <ConfirmReplacePopup
        open
        onClose={noop}
        selectedAttribution={packageInfo2}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
            [packageInfo2.id]: packageInfo2,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo1.id, packageInfo2.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setVariable(ATTRIBUTION_SELECTION_FOR_REPLACEMENT, {
            mode: 'explicit',
            attributionUuids: [packageInfo1.id],
          }),
        ],
      },
    );

    await screen.findByTestId('removed-attributions');
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: text.replaceAttributionsPopup.replace,
        }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.replaceAttributionsPopup.replace,
      }),
    );

    await expectManualAttributions({
      [packageInfo2.id]: { ...packageInfo2, preSelected: undefined },
    });
    await expectResourcesToManualAttributions({
      [resource]: [packageInfo2.id],
    });
    expect(getSelectedAttributionId(store.getState())).toBe(packageInfo2.id);
  });
});
