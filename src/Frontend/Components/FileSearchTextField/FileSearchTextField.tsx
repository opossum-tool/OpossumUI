// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFileSearch } from '../../state/actions/resource-actions/file-search-actions';
import { getFileSearch } from '../../state/selectors/file-search-selectors';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { getResources } from '../../state/selectors/all-views-resource-selectors';
import { getPathsFromResources } from '../../state/helpers/file-search-helpers';
import { debounce } from 'lodash';
import { PathPredicate } from '../../types/types';

interface FileSearchTextFieldProps {
  setFilteredPaths(filteredPaths: Array<string>): void;
}

export function FileSearchTextField(
  props: FileSearchTextFieldProps
): ReactElement {
  const dispatch = useDispatch();
  const search = useSelector(getFileSearch);
  const resources = useSelector(getResources);
  const debounceWaitTimeInMs = 200;

  const paths: Array<string> = useMemo(() => {
    return getPathsFromResources(resources ?? {});
  }, [resources]);

  const filterPathsDebounced = useRef(
    debounce((value: string) => filterPaths(value), debounceWaitTimeInMs)
  ).current;

  useEffect(() => {
    filterPathsDebounced(search);
    return (): void => {
      filterPathsDebounced.cancel();
    };
  }, [filterPathsDebounced, search]);

  function getSearchTermFilter(search: string): PathPredicate {
    return function (path: string): boolean {
      return path.toLowerCase().indexOf(search) !== -1;
    };
  }

  function filterPaths(search: string): void {
    const searchTermFilter = getSearchTermFilter(search.toLowerCase());
    const filteredPaths = paths.filter(searchTermFilter);
    props.setFilteredPaths(filteredPaths);
  }

  function handleChange(search: string): void {
    dispatch(setFileSearch(search));
  }

  return (
    <SearchTextField
      onInputChange={handleChange}
      search={search}
      autoFocus={true}
    />
  );
}
