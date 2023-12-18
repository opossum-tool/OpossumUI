// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMutation, useQuery } from '@tanstack/react-query';

import { PackageInfo } from '../../shared/shared-types';
import PackageSearchApi from './package-search-api';
import { tryit } from './tryit';

function usePackageNames({
  packageName,
  packageNamespace,
  packageType,
}: PackageInfo) {
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
}: PackageInfo) {
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
}: PackageInfo) {
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'package-version-suggestions',
      packageName,
      packageNamespace,
      packageType,
    ],
    queryFn: () =>
      PackageSearchApi.getVersions({
        packageName,
        packageNamespace,
        packageType,
      }),
    enabled: !!packageName && !!packageType,
  });
  return {
    packageVersions: data,
    packageVersionsError: error,
    packageVersionsLoading: isLoading,
  };
}

function useGetPackageUrlAndLicense() {
  const { mutateAsync, error, isPending } = useMutation({
    mutationFn: (props: PackageInfo) =>
      PackageSearchApi.getUrlAndLicense(props),
  });

  return {
    getPackageUrlAndLicense: tryit(mutateAsync),
    getPackageUrlAndLicenseError: error,
    getPackageUrlAndLicenseLoading: isPending,
  };
}

export const PackageSearchHooks = {
  useGetPackageUrlAndLicense,
  usePackageNames,
  usePackageNamespaces,
  usePackageVersions,
};
