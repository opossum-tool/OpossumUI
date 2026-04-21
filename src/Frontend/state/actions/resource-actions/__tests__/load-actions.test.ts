// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ParsedFrontendFileContent,
  type ProjectConfig,
  type RawProjectConfig,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { EMPTY_PROJECT_METADATA } from '../../../../shared-constants';
import { OpossumColors } from '../../../../shared-styles';
import { createAppStore } from '../../../configure-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import { getClassifications } from '../../../selectors/resource-selectors';
import { loadFromFile } from '../load-actions';

const testConfig: RawProjectConfig = {
  classifications: {
    0: faker.word.words(),
    1: faker.word.words(),
  },
};

describe('loadFromFile', () => {
  it('loads from file into state', () => {
    const testParsedFileContent: ParsedFrontendFileContent = {
      metadata: EMPTY_PROJECT_METADATA,
      config: testConfig,
    };
    const expectedConfig: ProjectConfig = {
      classifications: {
        0: {
          description: testConfig.classifications[0],
          color: OpossumColors.pastelLightGreen,
        },
        1: {
          description: testConfig.classifications[1],
          color: '#ff0000',
        },
      },
    };

    const testStore = createAppStore();
    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState,
    );

    testStore.dispatch(loadFromFile(testParsedFileContent));
    expect(getClassifications(testStore.getState())).toEqual(
      expectedConfig.classifications,
    );
  });
});
