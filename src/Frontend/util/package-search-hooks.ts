// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMutation, useQuery } from '@tanstack/react-query';
import { isEqual } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { toast } from '../Components/Toaster';
import PackageSearchApi from './package-search-api';
import { tryit } from './tryit';

function usePackageNames(
  { id, criticality, packageName, packageNamespace, packageType }: PackageInfo,
  { disabled }: Partial<{ disabled: boolean }> = {},
) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-name-suggestions',
      id,
      criticality,
      packageName,
      packageNamespace,
      packageType,
    ],
    queryFn: () =>
      PackageSearchApi.getNames({
        id,
        criticality,
        packageName,
        packageNamespace,
        packageType,
      }),
    enabled: !!packageName && !disabled,
  });
  return {
    packageNames: data,
    packageNamesError: error,
    packageNamesLoading: isLoading,
  };
}

function usePackageNamespaces(
  { id, criticality, packageName, packageNamespace, packageType }: PackageInfo,
  { disabled }: Partial<{ disabled: boolean }> = {},
) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-namespace-suggestions',
      id,
      criticality,
      packageName,
      packageNamespace,
      packageType,
    ],
    queryFn: () =>
      PackageSearchApi.getNamespaces({
        id,
        criticality,
        packageName,
        packageNamespace,
        packageType,
      }),
    enabled: !!packageName && !!packageType && !disabled,
  });
  return {
    packageNamespaces: data,
    packageNamespacesError: error,
    packageNamespacesLoading: isLoading,
  };
}

function usePackageVersions(
  {
    id,
    criticality,
    packageName,
    packageNamespace,
    packageType,
    packageVersion,
  }: PackageInfo,
  { disabled }: Partial<{ disabled: boolean }> = {},
) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-version-suggestions',
      id,
      criticality,
      packageName,
      packageNamespace,
      packageType,
      packageVersion,
    ],
    queryFn: () =>
      PackageSearchApi.getVersions({
        id,
        criticality,
        packageName,
        packageNamespace,
        packageType,
        packageVersion,
      }),
    enabled: !!packageName && !!packageType && !disabled,
  });
  return {
    packageVersions: data,
    packageVersionsError: error,
    packageVersionsLoading: isLoading,
  };
}

function useEnrichPackageInfo({ showToasts }: { showToasts?: boolean } = {}) {
  const { mutateAsync, error, isPending } = useMutation({
    onError: showToasts
      ? () => toast.error(text.attributionColumn.enrichFailure)
      : undefined,
    mutationFn: (packageInfo: PackageInfo) =>
      PackageSearchApi.enrichPackageInfo(packageInfo),
  });

  return {
    enrichPackageInfo: (packageInfo: PackageInfo) =>
      tryit(mutateAsync)(packageInfo, {
        onSuccess: showToasts
          ? (result) => {
              if (isEqual(packageInfo, result)) {
                toast.info(text.attributionColumn.enrichNoop);
              } else {
                toast.success(text.attributionColumn.enrichSuccess);
              }
            }
          : undefined,
      }),
    enrichPackageInfoError: error,
    enrichPackageInfoLoading: isPending,
  };
}

export const PackageSearchHooks = {
  useEnrichPackageInfo,
  usePackageNames,
  usePackageNamespaces,
  usePackageVersions,
};
