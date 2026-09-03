// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useMemo } from 'react';

import { Criticality, type PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { clickableIcon } from '../../../shared-styles';
import { generatePurl, parsePurl } from '../../../util/handle-purl';
import { openUrl } from '../../../util/open-url';
import { PackageSearchHooks } from '../../../util/package-search-hooks';
import { useDebouncedInput } from '../../../util/use-debounced-input';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../../IconButton/IconButton';
import { TextBox } from '../../TextBox/TextBox';
import { toast } from '../../Toaster';
import type { PackagePatch } from '../attribution-form.types';
import { attributionColumnClasses } from '../AttributionForm.style';
import {
  type PackageAutocompleteAttribute,
  toPackagePatch,
} from '../PackageAutocomplete/PackageAutocomplete';

/** https://github.com/package-url/purl-spec/blob/main/purl-types-index.json */
const COMMON_PACKAGE_TYPES = [
  'alpm',
  'apk',
  'bazel',
  'bitbucket',
  'bitnami',
  'cargo',
  'cocoapods',
  'composer',
  'conan',
  'conda',
  'cpan',
  'cran',
  'deb',
  'docker',
  'gem',
  'generic',
  'github',
  'golang',
  'hackage',
  'hex',
  'huggingface',
  'julia',
  'luarocks',
  'maven',
  'mlflow',
  'npm',
  'nuget',
  'oci',
  'pub',
  'pypi',
  'qpkg',
  'rpm',
  'swid',
  'swift',
];

export type PackageFieldDefaults = Partial<
  Record<PackageAutocompleteAttribute, Array<PackageInfo>>
>;

export function usePackageFieldDefaults(
  packageInfo: PackageInfo,
  disabled: boolean,
): PackageFieldDefaults {
  const packageTypes = useMemo(
    () =>
      COMMON_PACKAGE_TYPES.map<PackageInfo>((packageType) => ({
        id: packageType,
        packageType,
        source: { name: text.attributionColumn.commonEcosystems },
        criticality: Criticality.None,
      })),
    [],
  );
  const debouncedPackageInfo = useDebouncedInput(packageInfo);
  const { packageNames } = PackageSearchHooks.usePackageNames(
    debouncedPackageInfo,
    { disabled },
  );
  const { packageNamespaces } = PackageSearchHooks.usePackageNamespaces(
    debouncedPackageInfo,
    { disabled },
  );
  const { packageVersions } = PackageSearchHooks.usePackageVersions(
    debouncedPackageInfo,
    { disabled },
  );
  return {
    packageName: packageNames ?? [],
    packageNamespace: packageNamespaces ?? [],
    packageVersion: packageVersions ?? [],
    packageType: packageTypes,
  };
}

export function PurlField({
  packageInfo,
  onUpdate,
  readOnly,
  disabled,
  sx = attributionColumnClasses.textBox,
}: {
  packageInfo: PackageInfo;
  onUpdate: (patch: PackagePatch) => void;
  readOnly?: boolean;
  disabled?: boolean;
  sx?: object;
}) {
  const purl = generatePurl(packageInfo);
  return (
    <TextBox
      sx={sx}
      title={text.attributionColumn.purl}
      text={purl}
      disabled={true}
      endIcon={[
        <IconButton
          tooltipTitle={text.attributionColumn.copyToClipboard}
          tooltipPlacement="left"
          onClick={async () => {
            await navigator.clipboard.writeText(purl);
            toast.success(text.attributionColumn.copyToClipboardSuccess);
          }}
          icon={<ContentCopyIcon sx={clickableIcon} />}
          hidden={!purl}
          aria-label={text.attributionColumn.copyToClipboard}
          key={text.attributionColumn.copyToClipboard}
        />,
        <IconButton
          tooltipTitle={text.attributionColumn.pasteFromClipboard}
          hidden={readOnly || disabled}
          tooltipPlacement="left"
          onClick={async () => {
            const parsedPurl = parsePurl(await navigator.clipboard.readText());
            if (parsedPurl) {
              onUpdate({
                packageName: parsedPurl.name,
                packageVersion: parsedPurl.version ?? undefined,
                packageType: parsedPurl.type,
                packageNamespace: parsedPurl.namespace ?? undefined,
              });
              toast.success(text.attributionColumn.copyToClipboardSuccess);
            } else {
              toast.error(text.attributionColumn.pasteFromClipboardFailed);
            }
          }}
          icon={<ContentPasteIcon sx={clickableIcon} />}
          aria-label={text.attributionColumn.pasteFromClipboard}
          key={text.attributionColumn.pasteFromClipboard}
        />,
      ]}
    />
  );
}

export function urlActions({
  packageInfo,
  onUpdate,
  onEdit,
  editable,
}: {
  packageInfo: PackageInfo;
  onUpdate: (patch: PackagePatch) => void;
  onEdit?: Confirm;
  editable: boolean;
}) {
  const needsEnrichment =
    editable &&
    !!packageInfo.packageName &&
    !!packageInfo.packageType &&
    !(packageInfo.url && packageInfo.copyright && packageInfo.licenseName);
  return [
    ...(needsEnrichment
      ? [
          <EnrichButton
            packageInfo={packageInfo}
            onUpdate={onUpdate}
            onEdit={onEdit}
            key={text.attributionColumn.getUrlAndLegal}
          />,
        ]
      : []),
    ...(packageInfo.url
      ? [
          <IconButton
            tooltipTitle={text.attributionColumn.openLinkInBrowser}
            tooltipPlacement="left"
            onClick={() => openUrl(packageInfo.url)}
            icon={<OpenInNewIcon aria-label="Url icon" sx={clickableIcon} />}
            key={text.attributionColumn.openLinkInBrowser}
          />,
        ]
      : []),
  ];
}

function EnrichButton({
  packageInfo,
  onUpdate,
  onEdit,
}: {
  packageInfo: PackageInfo;
  onUpdate: (patch: PackagePatch) => void;
  onEdit?: Confirm;
}) {
  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo({
    showToasts: true,
  });
  return (
    <IconButton
      tooltipTitle={text.attributionColumn.getUrlAndLegal}
      tooltipPlacement="left"
      onClick={async () => {
        const enrich = async () => {
          const enriched = await enrichPackageInfo(packageInfo);
          if (enriched) {
            onUpdate(toPackagePatch(enriched));
          }
        };
        if (onEdit) {
          await onEdit(enrich);
        } else {
          await enrich();
        }
      }}
      icon={<AutoFixHighIcon sx={clickableIcon} />}
    />
  );
}
