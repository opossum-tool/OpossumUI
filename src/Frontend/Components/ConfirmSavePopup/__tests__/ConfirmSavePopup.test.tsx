// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash-es';

import { executeCommand } from '../../../../ElectronBackend/api/commands';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getSelectedAttributionId } from '../../../state/selectors/resource-selectors';
import {
  expectManualAttributions,
  expectResourcesToManualAttributions,
} from '../../../test-helpers/expectations';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { toast } from '../../Toaster';
import { AttributionFormConfirmSavePopup } from '../AttributionFormConfirmSavePopup';
import { ConfirmSavePopup } from '../ConfirmSavePopup';

describe('AttributionFormConfirmSavePopup', () => {
  afterEach(() => {
    vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
  });

  it('uses explicit overrides only for attributions in the selection', async () => {
    const selected = faker.opossum.packageInfo({ packageName: 'selected' });
    const unselected = faker.opossum.packageInfo({ packageName: 'unselected' });
    const updatedSelected = { ...selected, packageName: 'updated selected' };
    const updatedUnselected = {
      ...unselected,
      packageName: 'updated unselected',
    };
    const resource = faker.opossum.filePath(faker.opossum.resourceName());

    await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [selected.id] }}
        attributions={{
          [selected.id]: updatedSelected,
          [unselected.id]: updatedUnselected,
        }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [selected.id]: selected,
            [unselected.id]: unselected,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [selected.id, unselected.id],
          }),
          resources: pathsToResources([resource]),
        }),
      },
    );

    const saveButton = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.save,
    });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await userEvent.click(saveButton);

    await expectManualAttributions({
      [selected.id]: updatedSelected,
      [unselected.id]: unselected,
    });
  });

  it('accepts drafts before closing the confirmation and completing the save', async () => {
    const attribution = faker.opossum.packageInfo();
    const updatedAttribution = {
      ...attribution,
      packageName: 'updated attribution',
    };
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const events: Array<string> = [];

    await renderComponent(
      <ConfirmSavePopup
        open
        onClose={() => events.push('close')}
        onAcceptDrafts={() => events.push('accept')}
        onSaveComplete={() => events.push('complete')}
        selection={{ mode: 'explicit', attributionUuids: [attribution.id] }}
        attributions={{ [attribution.id]: updatedAttribution }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attribution.id]: attribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [attribution.id],
          }),
          resources: pathsToResources([resource]),
        }),
      },
    );

    const saveButton = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.save,
    });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await userEvent.click(saveButton);

    await waitFor(() =>
      expect(events).toEqual(['accept', 'close', 'complete']),
    );
  });

  it('keeps the confirmation open and skips callbacks when saving fails', async () => {
    const attribution = faker.opossum.packageInfo();
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const onAcceptDrafts = vi.fn();
    const onClose = vi.fn();
    const onSaveComplete = vi.fn();
    const error = new Error('save failed');
    vi.mocked(window.electronAPI.api).mockImplementation((command, params) =>
      command === 'updateOrMatchAttributions'
        ? Promise.reject(error)
        : executeCommand(command, params as never),
    );
    const toastError = vi.spyOn(toast, 'error').mockImplementation(vi.fn());

    await renderComponent(
      <ConfirmSavePopup
        open
        onClose={onClose}
        onAcceptDrafts={onAcceptDrafts}
        onSaveComplete={onSaveComplete}
        selection={{ mode: 'explicit', attributionUuids: [attribution.id] }}
        attributions={{ [attribution.id]: attribution }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attribution.id]: attribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [attribution.id],
          }),
          resources: pathsToResources([resource]),
        }),
      },
    );

    const saveButton = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.save,
    });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await userEvent.click(saveButton);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(error.message));
    expect(onAcceptDrafts).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaveComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('offers only the global action when local saves are disabled', async () => {
    const attribution = faker.opossum.packageInfo();
    const firstResource = faker.opossum.filePath(faker.opossum.resourceName());
    const secondResource = faker.opossum.filePath(faker.opossum.resourceName());

    await renderComponent(
      <ConfirmSavePopup
        open
        onClose={noop}
        allowLocalSave={false}
        selection={{ mode: 'explicit', attributionUuids: [attribution.id] }}
        attributions={{ [attribution.id]: attribution }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [attribution.id]: attribution,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [firstResource]: [attribution.id],
            [secondResource]: [attribution.id],
          }),
          resources: pathsToResources([firstResource, secondResource]),
        }),
      },
    );

    expect(
      await screen.findByRole('button', {
        name: text.saveAttributionsPopup.saveGlobally,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: text.saveAttributionsPopup.saveLocally,
      }),
    ).not.toBeInTheDocument();
  });

  it('confirms a query-wide selection without loading its IDs in the renderer', async () => {
    const first = faker.opossum.packageInfo({
      packageName: 'first',
      preSelected: true,
    });
    const second = faker.opossum.packageInfo({
      packageName: 'second',
      preSelected: true,
    });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());

    await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{
          mode: 'allMatching',
          query: {
            external: false,
            filters: ['preSelected'],
            search: '',
            valueFilters: {},
            resourcePathForRelationships: resource,
            showResolved: false,
            excludeUnrelated: false,
            relation: 'resource',
          },
          excludedAttributionUuids: [],
        }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [first.id]: first,
            [second.id]: second,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [first.id, second.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setSelectedAttributionId(first.id),
          setSelectedResourceId(resource),
          setTemporaryDisplayPackageInfo({
            ...first,
            packageName: 'edited-first',
          }),
        ],
      },
    );

    const confirmButton = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.confirm,
    });
    expect(
      await screen.findByText(
        text.saveAttributionsPopup.confirmAttributions({
          attributions: '2 attributions',
          resources: '1 resource',
        }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(confirmButton).toBeEnabled());
    await userEvent.click(confirmButton);

    await expectManualAttributions({
      [first.id]: {
        ...first,
        packageName: 'edited-first',
        preSelected: undefined,
      },
      [second.id]: { ...second, preSelected: undefined },
    });
  });

  it('preserves focus when a query-wide save matches an existing attribution', async () => {
    const focused = faker.opossum.packageInfo({
      packageName: 'matching-package',
      preSelected: true,
    });
    const matching = {
      ...focused,
      id: faker.string.uuid(),
      preSelected: undefined,
    };
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{
          mode: 'allMatching',
          query: {
            external: false,
            filters: ['preSelected'],
            search: '',
            valueFilters: {},
            resourcePathForRelationships: resource,
            showResolved: false,
            excludeUnrelated: false,
            relation: 'resource',
          },
          excludedAttributionUuids: [],
        }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [focused.id]: focused,
            [matching.id]: matching,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [focused.id, matching.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(focused),
          setSelectedAttributionId(focused.id),
          setSelectedResourceId(resource),
        ],
      },
    );

    const confirmButton = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.confirm,
    });
    await waitFor(() => expect(confirmButton).toBeEnabled());
    await userEvent.click(confirmButton);

    await waitFor(() =>
      expect(getSelectedAttributionId(store.getState())).toBe(matching.id),
    );
  });

  it('saves attribution linked to a single resource', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [packageInfo1.id] }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource]: [packageInfo1.id],
          }),
          resources: pathsToResources([resource]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
        ],
      },
    );

    const saveButton = screen.getByRole('button', {
      name: text.saveAttributionsPopup.save,
    });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await userEvent.click(saveButton);

    await expectManualAttributions({
      [packageInfo1.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resource]: [packageInfo1.id],
    });
  });

  it('saves attribution linked to multiple resources on all resources', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [packageInfo1.id] }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo1.id],
            [resource2]: [packageInfo1.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
        ],
      },
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.saveAttributionsPopup.saveGlobally,
      }),
    );

    await expectManualAttributions({
      [packageInfo1.id]: packageInfo2,
    });
    await expectResourcesToManualAttributions({
      [resource1]: [packageInfo1.id],
      [resource2]: [packageInfo1.id],
    });
  });

  it('saves attribution linked to multiple resources only on selected resource', async () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({ id: packageInfo1.id });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [packageInfo1.id] }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo1.id]: packageInfo1,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo1.id],
            [resource2]: [packageInfo1.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo2),
          setSelectedAttributionId(packageInfo1.id),
          setSelectedResourceId(resource1),
        ],
      },
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.saveAttributionsPopup.saveLocally,
      }),
    );

    const newId = getSelectedAttributionId(store.getState());

    await expectManualAttributions({
      [packageInfo1.id]: packageInfo1,
      [newId]: { ...packageInfo2, id: newId },
    });
    await expectResourcesToManualAttributions({
      [resource1]: [newId],
      [resource2]: [packageInfo1.id],
    });
  });

  it('confirms attribution linked to a single resource', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resource = faker.opossum.filePath(faker.opossum.resourceName());
    const parsedInputFileEnrichedWithTestData =
      getParsedInputFileEnrichedWithTestData({
        manualAttributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
        resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
          [resource]: [packageInfo.id],
          [resource]: [packageInfo.id],
        }),
        resources: pathsToResources([resource, resource]),
      });

    await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [packageInfo.id] }}
      />,
      {
        data: parsedInputFileEnrichedWithTestData,
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
        ],
      },
    );

    const confirmButton = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.confirm,
    });
    await waitFor(() => expect(confirmButton).toBeEnabled());
    await userEvent.click(confirmButton);

    await expectManualAttributions({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    await expectResourcesToManualAttributions({
      [resource]: [packageInfo.id],
    });
  });

  it('confirms attribution linked to multiple resources on all resources', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [packageInfo.id] }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo.id]: packageInfo,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo.id],
            [resource2]: [packageInfo.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
        ],
      },
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.saveAttributionsPopup.confirmGlobally,
      }),
    );
    await expectManualAttributions({
      [packageInfo.id]: { ...packageInfo, preSelected: undefined },
    });
    await expectResourcesToManualAttributions({
      [resource1]: [packageInfo.id],
      [resource2]: [packageInfo.id],
    });
  });

  it('confirms attribution linked to multiple resources only on selected resource', async () => {
    const packageInfo = faker.opossum.packageInfo({ preSelected: true });
    const resource1 = faker.opossum.filePath(faker.opossum.resourceName());
    const resource2 = faker.opossum.filePath(faker.opossum.resourceName());
    const { store } = await renderComponent(
      <AttributionFormConfirmSavePopup
        open
        onClose={noop}
        selection={{ mode: 'explicit', attributionUuids: [packageInfo.id] }}
      />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: faker.opossum.attributions({
            [packageInfo.id]: packageInfo,
          }),
          resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
            [resource1]: [packageInfo.id],
            [resource2]: [packageInfo.id],
          }),
          resources: pathsToResources([resource1, resource2]),
        }),
        actions: [
          setTemporaryDisplayPackageInfo(packageInfo),
          setSelectedAttributionId(packageInfo.id),
          setSelectedResourceId(resource1),
        ],
      },
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: text.saveAttributionsPopup.confirmLocally,
      }),
    );

    const newId = getSelectedAttributionId(store.getState());

    await expectManualAttributions({
      [packageInfo.id]: packageInfo,
      [newId]: { ...packageInfo, id: newId, preSelected: undefined },
    });
    await expectResourcesToManualAttributions({
      [resource1]: [newId],
      [resource2]: [packageInfo.id],
    });
  });
});
