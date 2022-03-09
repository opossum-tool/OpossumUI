// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useEffect, useState } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { SearchTextField } from '../SearchTextField/SearchTextField';
import { getTemporaryPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import { ClearlyDefinedPackageCard } from './ClearlyDefinedPackageCard';
import makeStyles from '@mui/styles/makeStyles';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Validator } from 'jsonschema';
import { PackageInfo } from '../../../shared/shared-types';
import { Spinner } from '../Spinner/Spinner';
import { Alert } from '../Alert/Alert';
import MuiTypography from '@mui/material/Typography';

const useStyles = makeStyles({
  root: {
    minWidth: '300px',
    marginTop: 5,
  },
  packages: {
    margin: '0px 10px 0px 10px',
  },
  noResultsFound: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

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
  searchTerm: string
): Promise<Array<string>> {
  const response = await axios.get(
    `https://api.clearlydefined.io/definitions?pattern=${searchTerm}`
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
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const temporaryPackageInfo = useAppSelector(getTemporaryPackageInfo);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>(
    getInitialSearchTerm(temporaryPackageInfo)
  );
  const debouncedSearchTerm = useDebounceInput(currentSearchTerm, 500);
  const { isLoading, data, isError, error } = useQuery(
    ['clearlyDefinedPackageSearch', debouncedSearchTerm],
    () => searchPackagesOnClearlyDefined(debouncedSearchTerm),
    {
      refetchOnWindowFocus: false,
      enabled: Boolean(currentSearchTerm),
    }
  );

  function close(): void {
    dispatch(closePopup());
  }

  function handleChange(search: string): void {
    setCurrentSearchTerm(search);
  }

  const content = (
    <div className={classes.root}>
      <SearchTextField
        onInputChange={handleChange}
        search={currentSearchTerm}
        autoFocus={false}
      />
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert
          errorMessage={`Failed while fetching data${
            error instanceof Error ? `: ${error.message}` : ''
          }`}
        />
      ) : (
        <div className={classes.packages}>
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
            <div className={classes.noResultsFound}>
              <MuiTypography>{'No results found'}</MuiTypography>
            </div>
          )}
        </div>
      )}
    </div>
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
