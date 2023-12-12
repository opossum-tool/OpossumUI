// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useQuery } from '@tanstack/react-query';

import { PackageSearchApi } from './package-search-api';

function usePackageSearchSuggestions(searchTerm: string | undefined) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['search-suggestions', searchTerm],
    queryFn: () =>
      searchTerm ? PackageSearchApi.getSuggestions(searchTerm) : {},
    enabled: !!searchTerm,
  });
  return { data, error, isLoading };
}

export const PackageSearchHooks = {
  usePackageSearchSuggestions,
};
