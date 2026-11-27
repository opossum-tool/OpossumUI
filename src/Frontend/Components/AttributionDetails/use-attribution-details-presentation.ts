// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { initializePackageInfoEditing } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { backend, useDatabaseInitialized } from '../../util/backendClient';

export interface AttributionDetailsSelection {
  attributionId: string;
  resourceId: string;
  isPending: boolean;
}

export interface AttributionDetailsPresentation {
  attributionId?: string;
  resourceId: string;
  packageInfo: PackageInfo;
  isExternal: boolean;
  isAttributionReadonly: boolean;
  isResourceReadonly: boolean;
  isBreakpoint: boolean;
  originalAttribution?: PackageInfo;
  originalAttributionIsExternal?: boolean;
  resolvedExternalAttributions?: Set<string>;
  linkRelationshipEligible: boolean;
  hasResourceInfo: boolean;
  hasResolvedAttributions: boolean;
  hasOriginalAttribution: boolean;
  hasMultipleResources: boolean;
}

function isSettled(query: { isSuccess: boolean; isError: boolean }): boolean {
  return query.isSuccess || query.isError;
}

export function useAttributionDetailsPresentation(
  selection: AttributionDetailsSelection,
) {
  const dispatch = useAppDispatch();
  const databaseInitialized = useDatabaseInitialized();
  const { attributionId, resourceId } = selection;

  const selectedAttributionQuery = backend.getAttributionData.useQuery(
    attributionId ? { attributionUuid: attributionId } : skipToken,
  );
  const selectedPackageInfo = selectedAttributionQuery.data?.packageInfo;
  const originalAttributionQuery = backend.getAttributionData.useQuery(
    selectedPackageInfo?.originalAttributionId
      ? { attributionUuid: selectedPackageInfo.originalAttributionId }
      : skipToken,
  );
  const resourceInfoQuery = backend.getResourceInfoOnAttributions.useQuery(
    selectedPackageInfo?.id
      ? { attributionUuids: [selectedPackageInfo.id] }
      : skipToken,
  );
  const linkageQuery = backend.getAttributionLinkStatus.useQuery(
    selectedPackageInfo?.id
      ? {
          resourcePath: resourceId,
          attributionUuid: selectedPackageInfo.id,
        }
      : skipToken,
  );
  const resolvedQuery = backend.resolvedAttributionUuids.useQuery();
  const readonlyPathsQuery = backend.getReadonlyResourcePaths.useQuery();
  const breakpointsQuery = backend.getAttributionBreakpoints.useQuery();

  const selectionIsPending =
    selection.isPending ||
    (!!attributionId &&
      !selectedPackageInfo &&
      selectedAttributionQuery.isPending);
  const applicableQueriesSettled =
    (!attributionId || isSettled(selectedAttributionQuery)) &&
    (!selectedPackageInfo?.originalAttributionId ||
      isSettled(originalAttributionQuery)) &&
    (!selectedPackageInfo?.id || isSettled(resourceInfoQuery)) &&
    (!selectedPackageInfo?.id || isSettled(linkageQuery)) &&
    isSettled(resolvedQuery) &&
    isSettled(readonlyPathsQuery) &&
    isSettled(breakpointsQuery);
  const isLoading = selectionIsPending || !applicableQueriesSettled;

  const currentPresentation = useMemo<
    AttributionDetailsPresentation | undefined
  >(() => {
    if (attributionId && !selectedPackageInfo) {
      return undefined;
    }
    const resourceKey = resourceId.replace(/\/$/, '');
    const resourceInfo = selectedPackageInfo?.id
      ? resourceInfoQuery.data?.[selectedPackageInfo.id]
      : undefined;
    return {
      attributionId: attributionId || undefined,
      resourceId,
      packageInfo: selectedPackageInfo ?? EMPTY_DISPLAY_PACKAGE_INFO,
      isExternal: selectedAttributionQuery.data?.isExternal === true,
      isAttributionReadonly: selectedPackageInfo?.resourceAccess === 'readonly',
      isResourceReadonly: readonlyPathsQuery.data?.has(resourceKey) === true,
      isBreakpoint: breakpointsQuery.data?.has(resourceKey) ?? false,
      originalAttribution: originalAttributionQuery.data?.packageInfo,
      originalAttributionIsExternal: originalAttributionQuery.data?.isExternal,
      resolvedExternalAttributions: resolvedQuery.data,
      linkRelationshipEligible:
        linkageQuery.isSuccess &&
        (selectedAttributionQuery.data?.isExternal === true
          ? (linkageQuery.data.onResource || linkageQuery.data.onDescendants) &&
            !linkageQuery.data.matchingManualOnResource &&
            !linkageQuery.data.linkWouldBeRedundant
          : selectedAttributionQuery.data?.isExternal === false &&
            !linkageQuery.data.onResource),
      hasResourceInfo: !selectedPackageInfo?.id || resourceInfoQuery.isSuccess,
      hasResolvedAttributions: resolvedQuery.isSuccess,
      hasOriginalAttribution:
        !!selectedPackageInfo?.originalAttributionId &&
        originalAttributionQuery.isSuccess,
      hasMultipleResources:
        resourceInfo?.isManual === true &&
        ((resourceInfo.resourceCount ?? 0) > 1 ||
          selectedPackageInfo?.resourceAccess === 'mixed'),
    };
  }, [
    attributionId,
    selectedPackageInfo,
    resourceId,
    selectedAttributionQuery.data,
    originalAttributionQuery.data,
    resourceInfoQuery.data,
    resourceInfoQuery.isSuccess,
    linkageQuery.data,
    linkageQuery.isSuccess,
    resolvedQuery.data,
    resolvedQuery.isSuccess,
    originalAttributionQuery.isSuccess,
    readonlyPathsQuery.data,
    breakpointsQuery.data,
  ]);
  const [presentation, setPresentation] =
    useState<AttributionDetailsPresentation>();
  const initializedContextRef = useRef<
    | {
        attributionId: string;
        resourceId: string;
        packageInfo: PackageInfo;
      }
    | undefined
  >(undefined);

  useLayoutEffect(() => {
    if (databaseInitialized && !isLoading && currentPresentation) {
      setPresentation(currentPresentation);
      const nextContext = {
        attributionId,
        resourceId,
        packageInfo: currentPresentation.packageInfo,
      };
      const previousContext = initializedContextRef.current;
      if (
        previousContext?.attributionId === nextContext.attributionId &&
        previousContext.resourceId === nextContext.resourceId &&
        previousContext.packageInfo === nextContext.packageInfo
      ) {
        return;
      }
      initializedContextRef.current = nextContext;
      dispatch(initializePackageInfoEditing(currentPresentation.packageInfo));
    }
  }, [
    dispatch,
    databaseInitialized,
    isLoading,
    currentPresentation,
    attributionId,
    resourceId,
  ]);

  useLayoutEffect(() => {
    if (!databaseInitialized) {
      setPresentation(undefined);
      initializedContextRef.current = undefined;
      return;
    }
    if (
      attributionId &&
      !selectedPackageInfo &&
      !selectedAttributionQuery.isPending &&
      !selectionIsPending
    ) {
      setPresentation(undefined);
      initializedContextRef.current = undefined;
    }
  }, [
    databaseInitialized,
    attributionId,
    selectedPackageInfo,
    selectedAttributionQuery.isPending,
    selectionIsPending,
  ]);

  const initialPresentation = useMemo<AttributionDetailsPresentation>(
    () => ({
      attributionId: attributionId || undefined,
      resourceId,
      packageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
      isExternal: true,
      isAttributionReadonly: true,
      isResourceReadonly: false,
      isBreakpoint: false,
      hasResourceInfo: false,
      hasResolvedAttributions: false,
      hasOriginalAttribution: false,
      hasMultipleResources: false,
      linkRelationshipEligible: false,
    }),
    [attributionId, resourceId],
  );

  return {
    presentation: isLoading
      ? (presentation ?? initialPresentation)
      : (currentPresentation ?? presentation ?? initialPresentation),
    isLoading,
    selectionIsPending,
    hasMainAttribution: !attributionId || !!selectedPackageInfo,
  };
}
