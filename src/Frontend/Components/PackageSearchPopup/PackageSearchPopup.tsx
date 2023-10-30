// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Validator } from 'jsonschema';
import { ReactElement, useEffect, useState } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getTemporaryDisplayPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import { Alert } from '../Alert/Alert';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { Spinner } from '../Spinner/Spinner';
import { ClearlyDefinedPackageCard } from './ClearlyDefinedPackageCard';

const classes = {
  root: {
    minWidth: '300px',
  },
  packages: {
    margin: '0px 10px 0px 10px',
  },
  noResultsFound: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

function useDebounceInput(input: string, delay: number): string {
  const [debouncedInput, setDebouncedInput] = useState<string>(input);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(input);
    }, delay);

    return (): void => {
      clearTimeout(handler);
    };
  }, [delay, input]);

  return debouncedInput;
}

const jsonSchemaValidator = new Validator();
const definitionsSchema = {
  type: 'array',
  items: { type: 'string' },
};

async function searchPackagesOnClearlyDefined(
  searchTerm: string,
): Promise<Array<string>> {
  const response = await axios.get(
    `https://api.clearlydefined.io/definitions?pattern=${searchTerm}`,
  );
  jsonSchemaValidator.validate(response.data, definitionsSchema, {
    throwError: true,
  });
  return response.data as Array<string>;
}

function getInitialSearchTerm(packageInfo: PackageInfo): string {
  if (!packageInfo.packageName) {
    return '';
  }

  return `${
    packageInfo.packageNamespace ? packageInfo.packageNamespace + '/' : ''
  }${packageInfo.packageName}/${packageInfo.packageVersion ?? ''}`;
}

export function PackageSearchPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>(
    getInitialSearchTerm(temporaryDisplayPackageInfo),
  );
  const debounceDelayInMs = 500;
  const debouncedSearchTerm = useDebounceInput(
    currentSearchTerm,
    debounceDelayInMs,
  );
  const { isLoading, data, isError, error } = useQuery({
    queryKey: ['clearlyDefinedPackageSearch', debouncedSearchTerm],
    queryFn: () => searchPackagesOnClearlyDefined(debouncedSearchTerm),
    refetchOnWindowFocus: false,
    enabled: Boolean(debouncedSearchTerm),
  });

  function close(): void {
    dispatch(closePopup());
  }

  function handleChange(search: string): void {
    setCurrentSearchTerm(search);
  }

  const content = (
    <MuiBox sx={classes.root}>
      <SearchTextField
        onInputChange={handleChange}
        search={currentSearchTerm}
        autoFocus={false}
      />
      {isLoading && Boolean(currentSearchTerm) ? (
        <Spinner />
      ) : isError ? (
        <Alert
          errorMessage={`Failed while fetching data${
            error instanceof Error ? `: ${error.message}` : ''
          }`}
        />
      ) : (
        <MuiBox sx={classes.packages}>
          {data && data.length > 0 ? (
            data.map((packageCoordinates: string, idx: number) => {
              return (
                <ClearlyDefinedPackageCard
                  key={`clearlyDefinedSearch-${debouncedSearchTerm}-${idx}`}
                  coordinate={packageCoordinates}
                />
              );
            })
          ) : (
            <MuiBox sx={classes.noResultsFound}>
              <MuiTypography>{'No results found'}</MuiTypography>
            </MuiBox>
          )}
        </MuiBox>
      )}
    </MuiBox>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Search for packages'}
      isOpen={true}
      fullWidth={true}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Cancel,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
