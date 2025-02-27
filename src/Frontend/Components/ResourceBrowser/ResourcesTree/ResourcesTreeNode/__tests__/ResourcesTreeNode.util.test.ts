// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  ResourcesToAttributions,
} from '../../../../../../shared/shared-types';
import { getClassification, getCriticality } from '../ResourcesTreeNode.util';

describe('getting criticality from ResourcesTreeNode', () => {
  const resourcesToExternalAttributions: ResourcesToAttributions = {
    '/test_file_missing.ts': ['ciriticality_missing'],
    '/test_file_missing_medium.ts': [
      'ciriticality_missing',
      'ciriticality_medium',
    ],
    '/test_file_medium_high.ts': ['ciriticality_medium', 'ciriticality_high'],
  };
  const externalAttributions: Attributions = {
    ciriticality_missing: { id: 'attr3' },
    ciriticality_medium: { criticality: Criticality.Medium, id: 'attr2' },
    ciriticality_high: { criticality: Criticality.High, id: 'attr1' },
  };

  it('is undefined if there is no information', () => {
    const criticality = getCriticality(
      '/test_file_missing.ts',
      resourcesToExternalAttributions,
      externalAttributions,
      new Set(),
    );
    expect(criticality).toBeUndefined();
  });
  it('is medium if at least one attribute has medium criticality and there is no highly critical one', () => {
    const criticality = getCriticality(
      '/test_file_missing_medium.ts',
      resourcesToExternalAttributions,
      externalAttributions,
      new Set(),
    );
    expect(criticality).toEqual(Criticality.Medium);
  });
  it('is high if any attribute is highly critical', () => {
    const criticality = getCriticality(
      '/test_file_medium_high.ts',
      resourcesToExternalAttributions,
      externalAttributions,
      new Set(),
    );
    expect(criticality).toEqual(Criticality.High);
  });
});

describe('getting classification from ResourcesTreeNode', () => {
  const resourcesToExternalAttributions: ResourcesToAttributions = {
    '/test_file_missing.ts': ['classification_missing'],
    '/test_file_missing_0.ts': ['classification_missing', 'classification_0'],
    '/test_file_0_2.ts': ['classification_0', 'classification_2'],
  };
  const externalAttributions: Attributions = {
    classification_missing: { id: 'attr3' },
    classification_0: { classification: 0, id: 'attr2' },
    classification_2: { classification: 2, id: 'attr1' },
  };

  it('is undefined if there is no information', () => {
    const classification = getClassification(
      '/test_file_missing.ts',
      resourcesToExternalAttributions,
      externalAttributions,
      new Set(),
    );
    expect(classification).toBeUndefined();
  });
  it('gives classification if some info is missing', () => {
    const classification = getClassification(
      '/test_file_missing_0.ts',
      resourcesToExternalAttributions,
      externalAttributions,
      new Set(),
    );
    expect(classification).toBe(0);
  });
  it('is equal to the highest classification', () => {
    const classification = getClassification(
      '/test_file_0_2.ts',
      resourcesToExternalAttributions,
      externalAttributions,
      new Set(),
    );
    expect(classification).toBe(2);
  });
});
