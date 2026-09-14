// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import useEventCallback from '@mui/utils/useEventCallback';
import { memo, useMemo } from 'react';

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

const EMPTY_PACKAGE_SUGGESTIONS: Array<PackageInfo> = [];

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
  const packageSearchInput = useMemo(
    () => ({
      id: packageInfo.id,
      criticality: packageInfo.criticality,
      packageName: packageInfo.packageName,
      packageNamespace: packageInfo.packageNamespace,
      packageType: packageInfo.packageType,
      packageVersion: packageInfo.packageVersion,
    }),
    [
      packageInfo.criticality,
      packageInfo.id,
      packageInfo.packageName,
      packageInfo.packageNamespace,
      packageInfo.packageType,
      packageInfo.packageVersion,
    ],
  );
  const debouncedPackageSearchInput = useDebouncedInput(packageSearchInput);
  const { packageNames } = PackageSearchHooks.usePackageNames(
    debouncedPackageSearchInput,
    { disabled },
  );
  const { packageNamespaces } = PackageSearchHooks.usePackageNamespaces(
    debouncedPackageSearchInput,
    { disabled },
  );
  const { packageVersions } = PackageSearchHooks.usePackageVersions(
    debouncedPackageSearchInput,
    { disabled },
  );
  return {
    packageName: packageNames ?? EMPTY_PACKAGE_SUGGESTIONS,
    packageNamespace: packageNamespaces ?? EMPTY_PACKAGE_SUGGESTIONS,
    packageVersion: packageVersions ?? EMPTY_PACKAGE_SUGGESTIONS,
    packageType: packageTypes,
  };
}

export function PurlField({
  packageInfo,
  onUpdate,
  onEdit,
  readOnly,
  disabled,
  sx = attributionColumnClasses.textBox,
}: {
  packageInfo: PackageInfo;
  onUpdate: (patch: PackagePatch) => void;
  onEdit?: Confirm;
  readOnly?: boolean;
  disabled?: boolean;
  sx?: object;
}) {
  const purl = generatePurl(packageInfo);
  const onCopy = useEventCallback(async () => {
    await navigator.clipboard.writeText(purl);
    toast.success(text.attributionColumn.copyToClipboardSuccess);
  });
  const onPaste = useEventCallback(async () => {
    const parsedPurl = parsePurl(await navigator.clipboard.readText());
    if (parsedPurl) {
      const patch = {
        packageName: parsedPurl.name,
        packageVersion: parsedPurl.version ?? undefined,
        packageType: parsedPurl.type,
        packageNamespace: parsedPurl.namespace ?? undefined,
      };
      const update = () => {
        onUpdate(patch);
        toast.success(text.attributionColumn.copyToClipboardSuccess);
      };
      if (onEdit) {
        await onEdit(update);
      } else {
        update();
      }
    } else {
      toast.error(text.attributionColumn.pasteFromClipboardFailed);
    }
  });
  return (
    <PurlInput
      purl={purl}
      readOnly={readOnly}
      disabled={disabled}
      sx={sx}
      onCopy={onCopy}
      onPaste={onPaste}
    />
  );
}

const PurlInput = memo(
  ({
    purl,
    readOnly,
    disabled,
    sx,
    onCopy,
    onPaste,
  }: {
    purl: string;
    readOnly?: boolean;
    disabled?: boolean;
    sx: object;
    onCopy: () => Promise<void>;
    onPaste: () => Promise<void>;
  }) => (
    <TextBox
      sx={sx}
      title={text.attributionColumn.purl}
      text={purl}
      disabled={true}
      endIcon={[
        <IconButton
          tooltipTitle={text.attributionColumn.copyToClipboard}
          tooltipPlacement="left"
          onClick={() => void onCopy()}
          icon={<ContentCopyIcon sx={clickableIcon} />}
          hidden={!purl}
          aria-label={text.attributionColumn.copyToClipboard}
          key={text.attributionColumn.copyToClipboard}
        />,
        <IconButton
          tooltipTitle={text.attributionColumn.pasteFromClipboard}
          hidden={readOnly || disabled}
          tooltipPlacement="left"
          onClick={() => void onPaste()}
          icon={<ContentPasteIcon sx={clickableIcon} />}
          aria-label={text.attributionColumn.pasteFromClipboard}
          key={text.attributionColumn.pasteFromClipboard}
        />,
      ]}
    />
  ),
);

export function urlActions({
  url,
  needsEnrichment,
  onEnrich,
}: {
  url?: string;
  needsEnrichment: boolean;
  onEnrich: () => Promise<void>;
}) {
  return [
    ...(needsEnrichment
      ? [
          <EnrichButtonFromAction
            onEnrich={onEnrich}
            key={text.attributionColumn.getUrlAndLegal}
          />,
        ]
      : []),
    ...(url
      ? [
          <IconButton
            tooltipTitle={text.attributionColumn.openLinkInBrowser}
            tooltipPlacement="left"
            onClick={() => openUrl(url)}
            icon={<OpenInNewIcon aria-label="Url icon" sx={clickableIcon} />}
            key={text.attributionColumn.openLinkInBrowser}
          />,
        ]
      : []),
  ];
}

export function useUrlEnrichmentAction({
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
  return useEventCallback(async () => {
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
  });
}

function EnrichButtonFromAction({
  onEnrich,
}: {
  onEnrich: () => Promise<void>;
}) {
  return (
    <IconButton
      tooltipTitle={text.attributionColumn.getUrlAndLegal}
      tooltipPlacement="left"
      onClick={() => void onEnrich()}
      icon={<AutoFixHighIcon sx={clickableIcon} />}
    />
  );
}
