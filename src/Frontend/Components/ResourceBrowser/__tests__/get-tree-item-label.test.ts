// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Criticality } from '../../../../shared/shared-types';
import { getCriticality } from '../get-tree-item-label';

describe('Tree item labels', () => {
  it('checks resource getCriticality', () => {
    const resourcesToExternalAttributions = {
      '/test_file1.ts': ['attr1', 'attr2'],
      '/test_file2.ts': ['attr3'],
      '/test_file3.ts': ['attr2', 'attr3'],
    };
    const externalAttributions = {
      attr1: { criticality: Criticality.High },
      attr2: { criticality: Criticality.Medium },
      attr3: {},
    };
    const expectedCriticalities: {
      [resource: string]: Criticality | undefined;
    } = {
      '/test_file1.ts': Criticality.High,
      '/test_file2.ts': undefined,
      '/test_file3.ts': Criticality.Medium,
    };

    for (const nodeId of Object.keys(resourcesToExternalAttributions)) {
      const criticality = getCriticality(
        nodeId,
        resourcesToExternalAttributions,
        externalAttributions
      );
      expect(criticality).toEqual(expectedCriticalities[nodeId]);
    }
  });
});
