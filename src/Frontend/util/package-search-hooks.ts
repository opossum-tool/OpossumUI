// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMutation, useQuery } from '@tanstack/react-query';

import { PackageInfo } from '../../shared/shared-types';
import PackageSearchApi from './package-search-api';
import { tryit } from './tryit';

function usePackageNames({ packageName }: PackageInfo) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['package-name-suggestions', packageName],
    queryFn: () => PackageSearchApi.getPackages({ packageName }),
    enabled: !!packageName,
  });
  return {
    packageNames: data,
    packageNamesError: error,
    packageNamesLoading: isLoading,
  };
}

function usePackageVersions({ packageType, packageName }: PackageInfo) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['package-version-suggestions', packageType, packageName],
    queryFn: () => PackageSearchApi.getVersions({ packageName, packageType }),
    enabled: !!packageType && !!packageName,
  });
  return {
    packageVersions: data,
    packageVersionsError: error,
    packageVersionsLoading: isLoading,
  };
}

function usePackageVersion() {
  const { mutateAsync, error, isPending } = useMutation({
    mutationFn: (props: PackageInfo) => PackageSearchApi.getVersion(props),
  });

  return {
    getPackageVersion: tryit(mutateAsync),
    packageVersionError: error,
    packageVersionLoading: isPending,
  };
}

export const PackageSearchHooks = {
  usePackageNames,
  usePackageVersions,
  usePackageVersion,
};
