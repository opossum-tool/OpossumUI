// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMutation, useQuery } from '@tanstack/react-query';
import { isEqual } from 'lodash';

import { DisplayPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { toast } from '../Components/Toaster';
import PackageSearchApi from './package-search-api';
import { tryit } from './tryit';

function usePackageNames({
  packageName,
  packageNamespace,
  packageType,
}: DisplayPackageInfo) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-name-suggestions',
      packageName,
      packageNamespace,
      packageType,
    ],
    queryFn: () =>
      PackageSearchApi.getNames({ packageName, packageNamespace, packageType }),
    enabled: !!packageName,
  });
  return {
    packageNames: data,
    packageNamesError: error,
    packageNamesLoading: isLoading,
  };
}

function usePackageNamespaces({
  packageName,
  packageNamespace,
  packageType,
}: DisplayPackageInfo) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-namespace-suggestions',
      packageName,
      packageNamespace,
      packageType,
    ],
    queryFn: () =>
      PackageSearchApi.getNamespaces({
        packageName,
        packageNamespace,
        packageType,
      }),
    enabled: !!packageName && !!packageType,
  });
  return {
    packageNamespaces: data,
    packageNamespacesError: error,
    packageNamespacesLoading: isLoading,
  };
}

function usePackageVersions({
  packageName,
  packageNamespace,
  packageType,
  packageVersion,
}: DisplayPackageInfo) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-version-suggestions',
      packageName,
      packageNamespace,
      packageType,
      packageVersion,
    ],
    queryFn: () =>
      PackageSearchApi.getVersions({
        packageName,
        packageNamespace,
        packageType,
        packageVersion,
      }),
    enabled: !!packageName && !!packageType,
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
    mutationFn: (packageInfo: DisplayPackageInfo) =>
      PackageSearchApi.enrichPackageInfo(packageInfo),
  });

  return {
    enrichPackageInfo: (packageInfo: DisplayPackageInfo) =>
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
