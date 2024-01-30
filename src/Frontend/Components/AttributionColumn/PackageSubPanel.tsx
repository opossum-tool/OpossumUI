// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuiBox from '@mui/material/Box';
import { styled } from '@mui/system';
import { useMemo } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { clickableIcon } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { generatePurl, parsePurl } from '../../util/handle-purl';
import { openUrl } from '../../util/open-url';
import { PackageSearchHooks } from '../../util/package-search-hooks';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../IconButton/IconButton';
import { TextBox } from '../InputElements/TextBox';
import { toast } from '../Toaster';
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
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
}

export function PackageSubPanel({
  packageInfo,
  showHighlight,
  onEdit,
}: PackageSubPanelProps) {
  const dispatch = useAppDispatch();
  const defaultPackageTypes = useMemo(
    () =>
      COMMON_PACKAGE_TYPES.map<PackageInfo>((packageType) => ({
        id: packageType,
        synthetic: true,
        packageType,
        source: {
          name: text.attributionColumn.commonEcosystems,
          documentConfidence: 100,
        },
      })),
    [],
  );

  const debouncedPackageInfo = useDebouncedInput(packageInfo);

  const { packageNames } = PackageSearchHooks.usePackageNames(
    debouncedPackageInfo,
    { disabled: !onEdit },
  );
  const { packageNamespaces } = PackageSearchHooks.usePackageNamespaces(
    debouncedPackageInfo,
    { disabled: !onEdit },
  );
  const { packageVersions } = PackageSearchHooks.usePackageVersions(
    debouncedPackageInfo,
    { disabled: !onEdit },
  );
  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo({
    showToasts: true,
  });

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
        disabled={!onEdit}
        showHighlight={showHighlight}
        defaults={packageNames}
        onEdit={onEdit}
      />
    );
  }

  function renderPackageNamespace() {
    return (
      <PackageAutocomplete
        attribute={'packageNamespace'}
        title={text.attributionColumn.packageSubPanel.packageNamespace}
        highlight={'dark'}
        disabled={!onEdit}
        showHighlight={showHighlight}
        defaults={packageNamespaces}
        onEdit={onEdit}
      />
    );
  }

  function renderPackageVersion() {
    return (
      <PackageAutocomplete
        attribute={'packageVersion'}
        title={text.attributionColumn.packageSubPanel.packageVersion}
        disabled={!onEdit}
        showHighlight={showHighlight}
        defaults={packageVersions}
        onEdit={onEdit}
      />
    );
  }

  function renderPackageType() {
    return (
      <PackageAutocomplete
        attribute={'packageType'}
        title={text.attributionColumn.packageSubPanel.packageType}
        highlight={'dark'}
        disabled={!onEdit}
        showHighlight={showHighlight}
        defaults={defaultPackageTypes}
        onEdit={onEdit}
      />
    );
  }

  function renderPurl(): React.ReactElement {
    const purl = generatePurl(packageInfo);

    return (
      <TextBox
        sx={attributionColumnClasses.textBox}
        title={text.attributionColumn.packageSubPanel.purl}
        text={purl}
        isEditable={false}
        endIcon={
          <>
            <IconButton
              tooltipTitle={
                text.attributionColumn.packageSubPanel.copyToClipboard
              }
              tooltipPlacement="left"
              onClick={async () => {
                await navigator.clipboard.writeText(purl);
                toast.success(text.attributionColumn.copyToClipboardSuccess);
              }}
              icon={<ContentCopyIcon sx={clickableIcon} />}
              hidden={!purl}
              aria-label={
                text.attributionColumn.packageSubPanel.copyToClipboard
              }
            />
            <IconButton
              tooltipTitle={
                text.attributionColumn.packageSubPanel.pasteFromClipboard
              }
              hidden={!onEdit}
              tooltipPlacement="left"
              onClick={async () => {
                const parsedPurl = parsePurl(
                  await navigator.clipboard.readText(),
                );
                if (parsedPurl) {
                  dispatch(
                    setTemporaryDisplayPackageInfo({
                      ...packageInfo,
                      packageName: parsedPurl.name,
                      packageVersion: parsedPurl.version ?? undefined,
                      packageType: parsedPurl.type,
                      packageNamespace: parsedPurl.namespace ?? undefined,
                    }),
                  );
                  toast.success(text.attributionColumn.copyToClipboardSuccess);
                } else {
                  toast.error(text.attributionColumn.pasteFromClipboardFailed);
                }
              }}
              icon={<ContentPasteIcon sx={clickableIcon} />}
              aria-label={
                text.attributionColumn.packageSubPanel.pasteFromClipboard
              }
            />
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
        disabled={!onEdit}
        showHighlight={showHighlight}
        onEdit={onEdit}
        endAdornment={
          <>
            <IconButton
              tooltipTitle={text.attributionColumn.getUrlAndLegal}
              tooltipPlacement={'left'}
              hidden={
                !packageInfo.packageName ||
                !packageInfo.packageType ||
                !!(
                  packageInfo.url &&
                  packageInfo.copyright &&
                  packageInfo.licenseName
                )
              }
              onClick={() =>
                onEdit?.(async () => {
                  const enriched = await enrichPackageInfo({
                    ...packageInfo,
                    wasPreferred: undefined,
                  });
                  if (enriched) {
                    dispatch(setTemporaryDisplayPackageInfo(enriched));
                  }
                })
              }
              icon={<AutoFixHighIcon sx={clickableIcon} />}
            />
            <IconButton
              tooltipTitle={
                text.attributionColumn.packageSubPanel.openLinkInBrowser
              }
              tooltipPlacement={'left'}
              onClick={() => openUrl(packageInfo.url)}
              hidden={!packageInfo.url}
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
