// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuiBox from '@mui/material/Box';
import { styled } from '@mui/system';
import { useMemo } from 'react';

import { DisplayPackageInfo, PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { clickableIcon } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { generatePurl, parsePurl } from '../../util/handle-purl';
import { openUrl } from '../../util/open-url';
import { PackageSearchHooks } from '../../util/package-search-hooks';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { FetchLicenseInformationButton } from '../FetchLicenseInformationButton/FetchLicenseInformationButton';
import { IconButton } from '../IconButton/IconButton';
import { TextBox } from '../InputElements/TextBox';
import { PackageAutocomplete } from './PackageAutocomplete';
import { attributionColumnClasses } from './shared-attribution-column-styles';

/** https://github.com/package-url/purl-spec/blob/master/PURL-TYPES.rst */
const COMMON_PACKAGE_TYPES = [
  'bitbucket',
  'cargo',
  'composer',
  'conan',
  'conda',
  'cran',
  'deb',
  'docker',
  'gem',
  'generic',
  'github',
  'gitlab',
  'golang',
  'hackage',
  'hex',
  'huggingface',
  'maven',
  'mlflow',
  'npm',
  'nuget',
  'oci',
  'pub',
  'pypi',
  'qpkg',
  'rpm',
  'rpm',
  'swid',
  'swift',
];

const DisplayRow = styled('div')({
  display: 'flex',
  gap: '8px',
});

interface PackageSubPanelProps {
  displayPackageInfo: DisplayPackageInfo;
  isEditable: boolean;
  showHighlight?: boolean;
}

export function PackageSubPanel(props: PackageSubPanelProps) {
  const dispatch = useAppDispatch();
  const defaultPackageTypes = useMemo(
    () =>
      COMMON_PACKAGE_TYPES.map<PackageInfo>((packageType) => ({
        packageType,
        source: {
          name: text.attributionColumn.commonEcosystems,
          documentConfidence: 100,
        },
      })),
    [],
  );

  const debouncedPackageInfo = useDebouncedInput(props.displayPackageInfo);

  const { packageNames } =
    PackageSearchHooks.usePackageNames(debouncedPackageInfo);
  const { packageNamespaces } =
    PackageSearchHooks.usePackageNamespaces(debouncedPackageInfo);
  const { packageVersions } =
    PackageSearchHooks.usePackageVersions(debouncedPackageInfo);

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      <DisplayRow>
        {renderPackageName()}
        {renderPackageNamespace()}
      </DisplayRow>
      <DisplayRow>
        {renderPackageVersion()}
        {renderPackageType()}
      </DisplayRow>
      {renderPurl()}
      {renderRepositoryUrl()}
    </MuiBox>
  );

  function renderPackageName() {
    return (
      <PackageAutocomplete
        attribute={'packageName'}
        title={text.attributionColumn.packageSubPanel.packageName}
        highlight={'dark'}
        disabled={!props.isEditable}
        showHighlight={props.showHighlight}
        defaults={packageNames}
      />
    );
  }

  function renderPackageNamespace() {
    return (
      <PackageAutocomplete
        attribute={'packageNamespace'}
        title={text.attributionColumn.packageSubPanel.packageNamespace}
        highlight={'dark'}
        disabled={!props.isEditable}
        showHighlight={props.showHighlight}
        defaults={packageNamespaces}
      />
    );
  }

  function renderPackageVersion() {
    return (
      <PackageAutocomplete
        attribute={'packageVersion'}
        title={text.attributionColumn.packageSubPanel.packageVersion}
        disabled={!props.isEditable}
        showHighlight={props.showHighlight}
        defaults={
          packageVersions
            ? [...packageVersions.default, ...packageVersions.other]
            : []
        }
      />
    );
  }

  function renderPackageType() {
    return (
      <PackageAutocomplete
        attribute={'packageType'}
        title={text.attributionColumn.packageSubPanel.packageType}
        highlight={'dark'}
        disabled={!props.isEditable}
        showHighlight={props.showHighlight}
        defaults={defaultPackageTypes}
      />
    );
  }

  function renderPurl(): React.ReactElement {
    const purl = generatePurl(props.displayPackageInfo);
    const pasteFromClipboard = async () => {
      const parsedPurl = parsePurl(await navigator.clipboard.readText());
      if (parsedPurl) {
        dispatch(
          setTemporaryDisplayPackageInfo({
            ...props.displayPackageInfo,
            packageName: parsedPurl.name,
            packageVersion: parsedPurl.version ?? undefined,
            packageType: parsedPurl.type,
            packageNamespace: parsedPurl.namespace ?? undefined,
          }),
        );
      }
    };

    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.purl}
        text={purl}
        isEditable={false}
        endIcon={
          <>
            {!!purl && (
              <IconButton
                tooltipTitle={
                  text.attributionColumn.packageSubPanel.copyToClipboard
                }
                tooltipPlacement="left"
                onClick={() => navigator.clipboard.writeText(purl)}
                icon={<ContentCopyIcon sx={clickableIcon} />}
                aria-label={
                  text.attributionColumn.packageSubPanel.copyToClipboard
                }
              />
            )}
            {props.isEditable && (
              <IconButton
                tooltipTitle={
                  text.attributionColumn.packageSubPanel.pasteFromClipboard
                }
                tooltipPlacement="left"
                onClick={pasteFromClipboard}
                icon={<ContentPasteIcon sx={clickableIcon} />}
                aria-label={
                  text.attributionColumn.packageSubPanel.pasteFromClipboard
                }
              />
            )}
          </>
        }
      />
    );
  }

  function renderRepositoryUrl() {
    return (
      <PackageAutocomplete
        attribute={'url'}
        title={text.attributionColumn.packageSubPanel.repositoryUrl}
        disabled={!props.isEditable}
        showHighlight={props.showHighlight}
        endAdornment={
          <>
            <FetchLicenseInformationButton
              url={props.displayPackageInfo.url}
              version={props.displayPackageInfo.packageVersion}
              disabled={!props.isEditable}
            />
            <IconButton
              tooltipTitle={
                text.attributionColumn.packageSubPanel.openLinkInBrowser
              }
              tooltipPlacement="right"
              onClick={(): void => {
                props.displayPackageInfo.url &&
                  openUrl(props.displayPackageInfo.url);
              }}
              hidden={!props.displayPackageInfo.url}
              icon={
                <OpenInNewIcon aria-label={'Url icon'} sx={clickableIcon} />
              }
            />
          </>
        }
      />
    );
  }
}
