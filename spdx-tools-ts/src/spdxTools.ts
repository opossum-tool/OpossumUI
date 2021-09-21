// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { v4 as uuid4 } from 'uuid';
import {
  Package,
  SpdxAttributions,
  SpdxDocument,
  SpdxExternalRef,
  SpdxExternalRelationship,
  SpdxLicenseInfo,
  SpdxPackage,
} from './types';
import yaml from 'js-yaml';
import { PackageURL } from 'packageurl-js';

const DEFAULT_PACKAGE_RELATION = 'DEPENDENCY_OF';
const DEFAULT_DOCUMENT_ID = 'SPDXRef-DOCUMENT';
const SPDX_VERSION = 'SPDX-2.2';
const SPDX_DEFAULT_DATA_LICENSE = 'CC0-1.0';
const ROOT_PACKAGE_SPDX_ID = 'SPDXRef-RootPackage';

export function createSpdxPackage(
  dependencies?: Array<Package>,
  copyright?: string,
  license?: string,
  licenseText?: string,
  name?: string,
  version?: string,
  namespace?: string,
  type?: string,
  appendix?: string,
  url?: string,
  comment?: string
): Package {
  return {
    dependencies: dependencies || [],
    copyright,
    license,
    licenseText,
    name,
    version,
    namespace,
    type,
    appendix,
    url,
    comment,
  };
}

export function createSpdxYaml(spdxDocument: SpdxDocument): string {
  return yaml.dump(spdxDocument);
}

export function createSpdxJson(spdxDocument: SpdxDocument): string {
  return JSON.stringify(spdxDocument, null, 2);
}

// For now, we assume a single root package.
// The root package is hard coded for now. No fields are parsed except for its dependencies.
export function createSpdxDocument(
  creatorTool: string,
  rootPackage: Package,
  documentName?: string,
  dataLicense: string = SPDX_DEFAULT_DATA_LICENSE
): SpdxDocument {
  const creationDate = new Date().toISOString();
  const documentNamespace = uuid4();
  const documentID = DEFAULT_DOCUMENT_ID;

  const spdxAttributions = parsePackages(rootPackage);

  return {
    SPDXID: documentID,
    spdxVersion: SPDX_VERSION,
    creationInfo: {
      created: creationDate,
      creators: [`Tool: ${creatorTool}`],
    },
    documentDescribes: [ROOT_PACKAGE_SPDX_ID], // c.f. https://github.com/spdx/spdx-spec/issues/395
    dataLicense: dataLicense,
    ...(documentName && { name: documentName }),
    documentNamespace: documentNamespace,
    ...spdxAttributions,
  };
}

function parsePackages(rootPackage: Package): SpdxAttributions {
  const spdxLicenseInfos: Array<SpdxLicenseInfo> = [];
  const spdxExternalRelationships: Array<SpdxExternalRelationship> = [];
  const spdxPackages: Array<SpdxPackage> = [];

  addDefaultRootPackage(spdxExternalRelationships, spdxPackages);
  addNonRootPackages(
    rootPackage.dependencies,
    spdxLicenseInfos,
    spdxPackages,
    spdxExternalRelationships
  );

  return {
    hasExtractedLicensingInfos: spdxLicenseInfos,
    packages: spdxPackages,
    relationships: spdxExternalRelationships,
  };
}

function addDefaultRootPackage(
  spdxExternalRelationships: Array<SpdxExternalRelationship>,
  spdxPackages: Array<SpdxPackage>
): void {
  const spdxRootPackage: SpdxPackage = {
    SPDXID: ROOT_PACKAGE_SPDX_ID,
    name: 'NOASSERTION',
    versionInfo: 'NOASSERTION',
    licenseConcluded: 'NOASSERTION',
    licenseDeclared: 'NOASSERTION',
    copyrightText: 'NOASSERTION',
    externalRefs: [],
    licenseInfoFromFiles: 'NOASSERTION',
    downloadLocation: 'NOASSERTION',
    filesAnalyzed: false,
  };
  const spdxExternalRelationship: SpdxExternalRelationship = {
    spdxElementId: DEFAULT_DOCUMENT_ID,
    relatedSpdxElement: ROOT_PACKAGE_SPDX_ID,
    relationshipType: 'DESCRIBES',
  };

  spdxExternalRelationships.push(spdxExternalRelationship);
  spdxPackages.push(spdxRootPackage);
}

function addNonRootPackages(
  packages: Array<Package>,
  spdxLicenseInfos: Array<SpdxLicenseInfo>,
  spdxPackages: Array<SpdxPackage>,
  spdxExternalRelationships: Array<SpdxExternalRelationship>
): void {
  packages.forEach((pkg, index) => {
    if (isPackageEmpty(pkg)) {
      return;
    }

    let licenseSpdxId = '';
    if (pkg.license || pkg.licenseText) {
      licenseSpdxId = getLicenseSpdxId(pkg, index);
      const spdxLicenseInfo: SpdxLicenseInfo = {
        licenseId: licenseSpdxId,
        extractedText: pkg.licenseText || 'NOASSERTION',
        name: pkg.license || 'NOASSERTION',
      };
      spdxLicenseInfos.push(spdxLicenseInfo);
    }

    const packageSpdxId = getPackageSpdxId(pkg, index);
    const spdxPackage: SpdxPackage = {
      SPDXID: packageSpdxId,
      name: pkg.name || 'NOASSERTION',
      versionInfo: pkg.version || 'NOASSERTION',
      licenseConcluded: licenseSpdxId || 'NOASSERTION',
      licenseDeclared: 'NOASSERTION',
      copyrightText: pkg.copyright || 'NONE',
      comment: pkg.comment,
      homepage: pkg.url,
      externalRefs: getExternalRefs(pkg),
      licenseInfoFromFiles: 'NOASSERTION',
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
    };
    if (!spdxPackage.comment) {
      delete spdxPackage.comment;
    }
    if (!spdxPackage.homepage) {
      delete spdxPackage.homepage;
    }
    spdxPackages.push(spdxPackage);

    const spdxExternalRelationship: SpdxExternalRelationship = {
      spdxElementId: packageSpdxId,
      relatedSpdxElement: ROOT_PACKAGE_SPDX_ID,
      relationshipType: DEFAULT_PACKAGE_RELATION,
    };
    spdxExternalRelationships.push(spdxExternalRelationship);
  });
}

function getPackageSpdxId(pkg: Package, index: number): string {
  return `SPDXRef-Package-${
    (pkg.name && pkg.name.replace(/[\s]+/g, '-')) || 'unnamed'
  }-${index}`;
}

function getLicenseSpdxId(pkg: Package, index: number): string {
  return `LicenseRef-${
    pkg.license ? pkg.license.replace(/[^a-zA-Z0-9-.]+/g, '-') : ''
  }-${index}`;
}

function getExternalRefs(pkg: Package): Array<SpdxExternalRef> {
  const purl = generatePurlFromPackage(pkg);

  return purl
    ? [
        {
          referenceCategory: 'PACKAGE_MANAGER',
          referenceLocator: purl,
          referenceType: 'purl',
        },
      ]
    : [];
}

function generatePurlFromPackage(pkg: Package): string {
  return pkg.type && pkg.name
    ? new PackageURL(
        pkg.type,
        pkg.namespace,
        pkg.name,
        pkg.version,
        undefined,
        undefined
      ).toString() + (pkg.appendix || '')
    : '';
}

function isPackageEmpty(pkg: Package): boolean {
  function shouldNotBeCalled(neverCalled: never): never {
    throw new Error();
  }
  function getIsValueNonEmpty(
    key: keyof Package
  ): ((arg: string) => boolean) | ((arg: Array<Package>) => boolean) {
    switch (key) {
      case 'appendix':
      case 'copyright':
      case 'license':
      case 'licenseText':
      case 'namespace':
      case 'type':
      case 'name':
      case 'url':
      case 'version':
      case 'comment':
        return Boolean;
      case 'dependencies':
        return (dependencies: Array<Package>) => dependencies.length !== 0;
      default:
        shouldNotBeCalled(key);
    }
  }

  return (
    Object.entries(pkg).filter((entry) =>
      getIsValueNonEmpty(entry[0] as keyof Package)(entry[1])
    ).length === 0
  );
}
