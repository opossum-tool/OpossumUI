// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ListCardContent } from '../types/types';

const prioritizedPackageInfoAttributes: Array<
  'name' | 'copyright' | 'licenseName' | 'licenseText' | 'comment' | 'url'
> = ['name', 'copyright', 'licenseName', 'licenseText', 'comment', 'url'];

export function getCardLabels(props: ListCardContent): Array<string> {
  const packageLabels: Array<string> = [];
  for (const attribute of prioritizedPackageInfoAttributes) {
    addPackageLabelsFromAttribute(props, attribute, packageLabels);
    if (packageLabels.length > 1) {
      break;
    }
  }
  return packageLabels || [];
}

function addPackageLabelsFromAttribute(
  props: ListCardContent,
  attribute:
    | 'name'
    | 'copyright'
    | 'licenseName'
    | 'licenseText'
    | 'comment'
    | 'url',
  packageLabels: Array<string>
): void {
  if (props[attribute]) {
    if (packageLabels.length === 0) {
      addFirstLineOfPackageLabelFromAttribute(attribute, props, packageLabels);
    } else {
      addSecondLineOfPackageLabelFromAttribute(attribute, props, packageLabels);
    }
  } else if (attribute === 'name' && !props['name'] && props['url']) {
    addFirstLineOfPackageLabelFromAttribute('url', props, packageLabels);
  }
}

export function addFirstLineOfPackageLabelFromAttribute(
  attribute:
    | 'name'
    | 'licenseName'
    | 'copyright'
    | 'licenseText'
    | 'comment'
    | 'url',
  packageCardContent: ListCardContent,
  packageLabels: Array<string>
): void {
  let firstLinePackageLabel;
  if (attribute === 'name') {
    firstLinePackageLabel = packageCardContent.packageVersion
      ? `${packageCardContent.name}, ${packageCardContent.packageVersion}`
      : `${packageCardContent.name}`;
  } else if (attribute === 'copyright') {
    firstLinePackageLabel = addPreambleToCopyright(
      `${packageCardContent.copyright}`
    );
  } else {
    firstLinePackageLabel = `${packageCardContent[attribute]}`;
  }
  packageLabels.push(firstLinePackageLabel);
}

export function addSecondLineOfPackageLabelFromAttribute(
  attribute:
    | 'name'
    | 'url'
    | 'licenseName'
    | 'copyright'
    | 'licenseText'
    | 'comment',
  packageCardContent: ListCardContent,
  packageLabels: Array<string>
): void {
  let secondLinePackageLabel;
  if (attribute === 'copyright') {
    secondLinePackageLabel = addPreambleToCopyright(
      `${packageCardContent.copyright}`
    );
  } else {
    secondLinePackageLabel = `${packageCardContent[attribute]}`;
  }
  if (
    !(
      attribute === 'url' && packageLabels[0] === `${packageCardContent['url']}`
    )
  ) {
    packageLabels.push(secondLinePackageLabel);
  }
}

export function addPreambleToCopyright(originalCopyright: string): string {
  let copyright = originalCopyright;
  if (
    originalCopyright.substring(0, 3).toLowerCase() !== '(c)' &&
    originalCopyright.substring(0, 9).toLowerCase() !== 'copyright'
  ) {
    copyright = `(c) ${originalCopyright}`;
  }
  return copyright;
}
