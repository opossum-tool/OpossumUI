// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ProjectMetadata } from '../../../../shared/shared-types';
import { EMPTY_PROJECT_METADATA } from '../../../shared-constants';
import {
  setAttributionBreakpoints,
  setFilesWithChildren,
  setProjectMetadata,
} from '../../actions/resource-actions/all-views-simple-actions';
import { createAppStore } from '../../configure-store';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getProjectMetadata,
} from '../resource-selectors';

describe('Attribution breakpoints', () => {
  const testAttributionBreakpoints: Set<string> = new Set([
    '/path/breakpoint/',
    '/node_modules/',
  ]);

  it('can be created and listed.', () => {
    const testStore = createAppStore();
    expect(getAttributionBreakpoints(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setAttributionBreakpoints(testAttributionBreakpoints));

    expect(getAttributionBreakpoints(testStore.getState())).toEqual(
      testAttributionBreakpoints,
    );
  });
});

describe('Files with children', () => {
  const testFileWithChildren = '/package.json/';
  const testFilesWithChildren: Set<string> = new Set<string>().add(
    testFileWithChildren,
  );

  it('can be created, listed and checked.', () => {
    const testStore = createAppStore();

    expect(getFilesWithChildren(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setFilesWithChildren(testFilesWithChildren));

    expect(getFilesWithChildren(testStore.getState())).toEqual(
      testFilesWithChildren,
    );
  });
});

describe('ProjectMetadata', () => {
  const testMetadata: ProjectMetadata = {
    projectTitle: 'Title',
    projectId: 'test-id',
    fileCreationDate: 'test-date',
  };

  it('can be set and get from store.', () => {
    const testStore = createAppStore();
    expect(getProjectMetadata(testStore.getState())).toEqual(
      EMPTY_PROJECT_METADATA,
    );

    testStore.dispatch(setProjectMetadata(testMetadata));

    expect(getProjectMetadata(testStore.getState())).toEqual(testMetadata);
  });
});
