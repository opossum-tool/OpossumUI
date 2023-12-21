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

import {
  AutocompleteSignal,
  DisplayPackageInfo,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
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
  displayPackageInfo: DisplayPackageInfo;
  isEditable: boolean;
  showHighlight?: boolean;
  confirmEditWasPreferred: Confirm;
}

export function PackageSubPanel({
  confirmEditWasPreferred,
  displayPackageInfo,
  isEditable,
  showHighlight,
}: PackageSubPanelProps) {
  const dispatch = useAppDispatch();
  const defaultPackageTypes = useMemo(
    () =>
      COMMON_PACKAGE_TYPES.map<AutocompleteSignal>((packageType) => ({
        attributionIds: [],
        default: true,
        packageType,
        source: {
          name: text.attributionColumn.commonEcosystems,
          documentConfidence: 100,
        },
      })),
    [],
  );

  const debouncedPackageInfo = useDebouncedInput(displayPackageInfo);

  const { packageNames } =
    PackageSearchHooks.usePackageNames(debouncedPackageInfo);
  const { packageNamespaces } =
    PackageSearchHooks.usePackageNamespaces(debouncedPackageInfo);
  const { packageVersions } =
    PackageSearchHooks.usePackageVersions(debouncedPackageInfo);
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
        disabled={!isEditable}
        showHighlight={showHighlight}
        defaults={packageNames}
        confirmEditWasPreferred={confirmEditWasPreferred}
      />
    );
  }

  function renderPackageNamespace() {
    return (
      <PackageAutocomplete
        attribute={'packageNamespace'}
        title={text.attributionColumn.packageSubPanel.packageNamespace}
        highlight={'dark'}
        disabled={!isEditable}
        showHighlight={showHighlight}
        defaults={packageNamespaces}
        confirmEditWasPreferred={confirmEditWasPreferred}
      />
    );
  }

  function renderPackageVersion() {
    return (
      <PackageAutocomplete
        attribute={'packageVersion'}
        title={text.attributionColumn.packageSubPanel.packageVersion}
        disabled={!isEditable}
        showHighlight={showHighlight}
        defaults={packageVersions}
        confirmEditWasPreferred={confirmEditWasPreferred}
      />
    );
  }

  function renderPackageType() {
    return (
      <PackageAutocomplete
        attribute={'packageType'}
        title={text.attributionColumn.packageSubPanel.packageType}
        highlight={'dark'}
        disabled={!isEditable}
        showHighlight={showHighlight}
        defaults={defaultPackageTypes}
        confirmEditWasPreferred={confirmEditWasPreferred}
      />
    );
  }

  function renderPurl(): React.ReactElement {
    const purl = generatePurl(displayPackageInfo);

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
              hidden={!isEditable}
              tooltipPlacement="left"
              onClick={async () => {
                const parsedPurl = parsePurl(
                  await navigator.clipboard.readText(),
                );
                if (parsedPurl) {
                  dispatch(
                    setTemporaryDisplayPackageInfo({
                      ...EMPTY_DISPLAY_PACKAGE_INFO,
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
        disabled={!isEditable}
        showHighlight={showHighlight}
        confirmEditWasPreferred={confirmEditWasPreferred}
        endAdornment={
          <>
            <IconButton
              tooltipTitle={text.attributionColumn.getUrlAndLegal}
              tooltipPlacement={'left'}
              hidden={
                !displayPackageInfo.packageName ||
                !displayPackageInfo.packageType ||
                !!(
                  displayPackageInfo.url &&
                  displayPackageInfo.copyright &&
                  displayPackageInfo.licenseName
                )
              }
              onClick={() =>
                confirmEditWasPreferred(async () => {
                  const enriched = await enrichPackageInfo({
                    ...displayPackageInfo,
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
              onClick={() => openUrl(displayPackageInfo.url)}
              hidden={!displayPackageInfo.url}
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
