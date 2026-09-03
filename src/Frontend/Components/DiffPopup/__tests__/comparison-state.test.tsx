// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, renderHook } from '@testing-library/react';

import { Criticality, type PackageInfo } from '../../../../shared/shared-types';
import type { ComparisonItem } from '../DiffPopup';
import {
  canTransfer,
  hasPackageInfoChanges,
  isEditable,
  isFieldVisible,
  valueForComparison,
} from '../DiffPopup.util';
import { useComparisonState } from '../use-comparison-state';

function packageInfo(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return {
    id: 'package',
    attributionConfidence: 50,
    criticality: Criticality.None,
    packageName: 'opening name',
    packageType: 'npm',
    comment: 'opening comment',
    ...overrides,
  };
}

function item(overrides: Partial<ComparisonItem> = {}): ComparisonItem {
  return {
    isExternal: false,
    label: 'attribution',
    packageInfo: packageInfo(),
    ...overrides,
  };
}

describe('comparison rules', () => {
  it.each([
    [item(), true],
    [item({ isExternal: true }), false],
    [item({ packageInfo: packageInfo({ resourceAccess: 'readonly' }) }), false],
    [item({ editable: false }), false],
  ])(
    'determines whether a destination is editable',
    (comparisonItem, expected) => {
      expect(isEditable(comparisonItem)).toBe(expected);
    },
  );

  it('normalizes optional values and compares editable drafts', () => {
    expect(valueForComparison('followUp', undefined)).toBe(false);
    expect(valueForComparison('followUp', false)).toBe(false);
    expect(valueForComparison('followUp', true)).toBe(true);
    expect(valueForComparison('attributionConfidence', 0)).toBe(0);
    expect(valueForComparison('attributionConfidence', undefined)).toBe('');
    expect(
      hasPackageInfoChanges(
        packageInfo({ followUp: false }),
        packageInfo(),
        true,
        ['followUp'],
      ),
    ).toBe(false);
    expect(
      hasPackageInfoChanges(
        packageInfo({ attributionConfidence: 0 }),
        packageInfo(),
        true,
        ['attributionConfidence'],
      ),
    ).toBe(true);
  });

  it.each([
    [
      'busy',
      true,
      item(),
      packageInfo({ packageVersion: '1' }),
      packageInfo({ packageVersion: '2' }),
      false,
    ],
    [
      'read-only destination',
      false,
      item({ packageInfo: packageInfo({ resourceAccess: 'readonly' }) }),
      packageInfo({ packageVersion: '1' }),
      packageInfo({ packageVersion: '2' }),
      false,
    ],
    [
      'matching values',
      false,
      item(),
      packageInfo({ packageVersion: '2' }),
      packageInfo({ packageVersion: '2' }),
      false,
    ],
    [
      'first-party comment',
      false,
      item(),
      packageInfo({ comment: 'left', firstParty: true }),
      packageInfo({ comment: 'right', firstParty: false }),
      true,
    ],
  ] as const)(
    'restricts transfer for %s',
    (_, isBusy, destination, left, right, comment) => {
      expect(
        canTransfer(
          'left',
          'right',
          comment ? 'comment' : 'packageVersion',
          { left, right },
          { left: item(), right: destination },
          isBusy,
        ),
      ).toBe(false);
    },
  );

  it('shows legal fields only for third-party drafts', () => {
    expect(isFieldVisible('licenseName', packageInfo())).toBe(true);
    expect(
      isFieldVisible('licenseName', packageInfo({ firstParty: true })),
    ).toBe(false);
  });
});

describe('useComparisonState', () => {
  it('isolates drafts, copies values, and restores a field changed after opening', () => {
    const { result } = renderHook(() =>
      useComparisonState(
        item({ packageInfo: packageInfo({ id: 'left', packageName: 'left' }) }),
        item({
          packageInfo: packageInfo({ id: 'right', packageName: 'right' }),
        }),
        false,
      ),
    );

    act(() => result.current.onCopy('left', 'right', 'packageName'));
    expect(result.current.drafts).toMatchObject({
      left: { packageName: 'left' },
      right: { packageName: 'left' },
    });
    act(() => result.current.onChange('right', { packageName: 'changed' }));
    expect(result.current.drafts.right.packageName).toBe('changed');
    act(() => result.current.onUndo('right', 'packageName'));
    expect(result.current.drafts.right.packageName).toBe('right');
  });

  it('restores changed auditing values without discarding a field draft', () => {
    const { result } = renderHook(() =>
      useComparisonState(item(), item(), false),
    );

    act(() =>
      result.current.onChange('right', {
        comment: 'field draft',
        followUp: true,
        attributionConfidence: 0,
      }),
    );
    expect(result.current.drafts.right).toMatchObject({
      comment: 'field draft',
      followUp: true,
      attributionConfidence: 0,
    });
    act(() => result.current.onUndoAuditing('right'));
    expect(result.current.drafts.right).toMatchObject({
      comment: 'field draft',
      followUp: undefined,
      attributionConfidence: 50,
    });
  });

  it('distinguishes opening, persisted, restored, and changed draft states', () => {
    const leftPersisted = packageInfo({
      id: 'left',
      packageName: 'left persisted',
    });
    const rightPersisted = packageInfo({
      id: 'right',
      packageName: 'right persisted',
    });
    const { result } = renderHook(() =>
      useComparisonState(
        item({
          packageInfo: packageInfo({
            id: 'left',
            packageName: 'left pre-edited',
          }),
          originalPackageInfo: leftPersisted,
        }),
        item({
          packageInfo: packageInfo({ id: 'right', packageName: 'right draft' }),
          originalPackageInfo: rightPersisted,
        }),
        false,
      ),
    );

    expect(result.current.mutationCandidates).toEqual({
      left: expect.objectContaining({ packageName: 'left pre-edited' }),
      right: expect.objectContaining({ packageName: 'right draft' }),
    });
    act(() =>
      result.current.onChange('right', { packageName: 'right persisted' }),
    );
    expect(result.current.mutationCandidates).toEqual({
      left: expect.objectContaining({ packageName: 'left pre-edited' }),
    });
    expect(result.current.acceptedAttributions).toEqual({
      left: expect.objectContaining({ packageName: 'left pre-edited' }),
      right: rightPersisted,
    });
  });

  it('accepts a restored-only attribution without a mutation candidate', () => {
    const persisted = packageInfo({ id: 'right', packageName: 'persisted' });
    const { result } = renderHook(() =>
      useComparisonState(
        item({ isExternal: true }),
        item({
          packageInfo: packageInfo({ id: 'right', packageName: 'draft' }),
          originalPackageInfo: persisted,
        }),
        false,
      ),
    );

    act(() => result.current.onChange('right', { packageName: 'persisted' }));
    expect(result.current.mutationCandidates).toEqual({});
    expect(result.current.acceptedAttributions).toEqual({ right: persisted });
    expect(result.current.canSave).toBe(true);
  });

  it('keeps zero confidence, permits incomplete values, blocks invalid values, and preserves opening snapshots', () => {
    const right = item({ packageInfo: packageInfo({ id: 'right' }) });
    const { result, rerender } = renderHook(
      ({ rightItem }) =>
        useComparisonState(item({ isExternal: true }), rightItem, false),
      { initialProps: { rightItem: right } },
    );

    act(() => result.current.onChange('right', { attributionConfidence: 0 }));
    expect(result.current.mutationCandidates).toEqual({
      right: expect.objectContaining({ attributionConfidence: 0 }),
    });
    act(() => result.current.onChange('right', { packageName: '' }));
    expect(result.current.canSave).toBe(true);
    act(() => result.current.onChange('right', { url: 'not a url' }));
    expect(result.current.canSave).toBe(false);
    rerender({
      rightItem: item({
        packageInfo: packageInfo({ id: 'right', packageName: 'refreshed' }),
      }),
    });
    act(() => result.current.onUndo('right', 'packageName'));
    expect(result.current.drafts.right.packageName).toBe('opening name');
  });
});
