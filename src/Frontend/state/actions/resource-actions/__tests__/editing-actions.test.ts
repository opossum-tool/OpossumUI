// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../../../testing/Faker';
import { createAppStore } from '../../../configure-store';
import {
  getIsPackageInfoDirty,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/resource-selectors';
import {
  initializePackageInfoEditing,
  setTemporaryDisplayPackageInfo,
} from '../all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../audit-view-simple-actions';
import { acceptSavedPackageInfoEditing } from '../editing-actions';

describe('acceptSavedPackageInfoEditing', () => {
  function createDirtyStore() {
    const attribution = faker.opossum.packageInfo();
    const submittedPackageInfo = {
      ...attribution,
      comment: 'submitted draft',
    };
    const resourceId = '/root/file.ts';
    const store = createAppStore();
    store.dispatch(setSelectedResourceId(resourceId, 'auto'));
    store.dispatch(setSelectedAttributionId(attribution.id));
    store.dispatch(initializePackageInfoEditing(attribution));
    store.dispatch(setTemporaryDisplayPackageInfo(submittedPackageInfo));

    return { store, attribution, submittedPackageInfo, resourceId };
  }

  it('marks a matching submitted draft clean while ignoring attribution IDs', () => {
    const { store, attribution, submittedPackageInfo, resourceId } =
      createDirtyStore();
    const submittedWithDifferentId = {
      ...submittedPackageInfo,
      id: faker.string.uuid(),
    };

    store.dispatch(
      acceptSavedPackageInfoEditing({
        attributionId: attribution.id,
        resourceId,
        submittedPackageInfo: submittedWithDifferentId,
      }),
    );

    expect(getIsPackageInfoDirty(store.getState())).toBe(false);
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      submittedWithDifferentId,
    );
  });

  it.each(['attribution', 'resource', 'draft'] as const)(
    'does not accept when the %s context changed',
    (changedContext) => {
      const { store, attribution, submittedPackageInfo, resourceId } =
        createDirtyStore();
      if (changedContext === 'attribution') {
        store.dispatch(setSelectedAttributionId(faker.string.uuid()));
      } else if (changedContext === 'resource') {
        store.dispatch(setSelectedResourceId('/other/file.ts', 'auto'));
      } else {
        store.dispatch(
          setTemporaryDisplayPackageInfo({
            ...submittedPackageInfo,
            comment: 'newer draft',
          }),
        );
      }
      const stateBeforeAcceptance = store.getState().resourceState;

      store.dispatch(
        acceptSavedPackageInfoEditing({
          attributionId: attribution.id,
          resourceId,
          submittedPackageInfo,
        }),
      );

      expect(store.getState().resourceState).toBe(stateBeforeAcceptance);
      expect(getIsPackageInfoDirty(store.getState())).toBe(true);
    },
  );
});
