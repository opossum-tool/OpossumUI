// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import {
  Criticality,
  type PackageInfo,
} from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { renderHook } from '../../../../test-helpers/render';
import type { PackagePatch } from '../../attribution-form.types';
import { toPackagePatch } from '../../PackageAutocomplete/PackageAutocomplete';
import { useUrlEnrichmentAction } from '../PackageFields';

const enrichPackageInfo = vi.hoisted(() => vi.fn());
const toaster = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../../../util/package-search-api', () => ({
  default: { enrichPackageInfo },
}));
vi.mock('../../../../Components/Toaster', () => ({ toast: toaster }));

const reactAttribution: PackageInfo = {
  id: 'attribution-1',
  criticality: Criticality.None,
  packageName: 'react',
  packageType: 'npm',
  packageVersion: '18.2.0',
};

const switchTargetAttribution: PackageInfo = {
  ...reactAttribution,
  id: 'attribution-2',
  packageName: 'switch-target',
};

const enrichmentResult: PackageInfo = {
  ...reactAttribution,
  url: 'https://github.com/facebook/react',
  copyright: '(c) Meta Platforms, Inc.',
  licenseName: 'MIT',
};

describe('useUrlEnrichmentAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function mockPendingEnrichment() {
    let resolveEnrichment!: (result: PackageInfo) => void;
    enrichPackageInfo.mockImplementation(
      () =>
        new Promise<PackageInfo>((resolve) => {
          resolveEnrichment = resolve;
        }),
    );
    return () => resolveEnrichment(enrichmentResult);
  }

  async function startEnrichment(
    onUpdate: (patch: PackagePatch) => void,
    packageInfo: PackageInfo = reactAttribution,
  ) {
    const { result, rerender } = await renderHook(useUrlEnrichmentAction, {
      initialProps: { packageInfo, onUpdate },
    });

    let enrichmentHandler!: Promise<void>;
    act(() => {
      enrichmentHandler = result.current();
    });
    await waitFor(() => {
      expect(enrichPackageInfo).toHaveBeenCalledTimes(1);
    });

    return { rerender, waitForFinish: () => enrichmentHandler };
  }

  it('applies the enrichment result to the attribution it was requested for', async () => {
    enrichPackageInfo.mockResolvedValue(enrichmentResult);
    const onUpdate = vi.fn();
    const { result } = await renderHook(useUrlEnrichmentAction, {
      initialProps: { packageInfo: reactAttribution, onUpdate },
    });

    await act(async () => {
      await result.current();
    });

    expect(onUpdate).toHaveBeenCalledWith(toPackagePatch(enrichmentResult));
    expect(toaster.success).toHaveBeenCalledWith(
      text.attributionColumn.enrichSuccess,
    );
  });

  it('discards the enrichment result when another attribution is selected', async () => {
    const resolveEnrichment = mockPendingEnrichment();
    const onUpdate = vi.fn();
    const { rerender, waitForFinish } = await startEnrichment(onUpdate);

    rerender({ packageInfo: switchTargetAttribution, onUpdate });
    act(() => {
      resolveEnrichment();
    });
    await waitForFinish();

    expect(onUpdate).not.toHaveBeenCalled();
    expect(toaster.success).not.toHaveBeenCalled();
    expect(toaster.info).not.toHaveBeenCalled();
  });

  it('applies the enrichment result when the origin attribution is selected again', async () => {
    const resolveEnrichment = mockPendingEnrichment();
    const onUpdate = vi.fn();
    const { rerender, waitForFinish } = await startEnrichment(onUpdate);

    rerender({ packageInfo: switchTargetAttribution, onUpdate });
    rerender({ packageInfo: reactAttribution, onUpdate });
    act(() => {
      resolveEnrichment();
    });
    await waitForFinish();

    expect(onUpdate).toHaveBeenCalledWith(toPackagePatch(enrichmentResult));
  });
});
