// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Attributions,
  FrequentLicenses,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { setFrequentLicenses } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { generatePurl } from '../../../util/handle-purl';
import { AttributionForm } from '../AttributionForm';

describe('AttributionForm', () => {
  it('copies PURL to clipboard', async () => {
    const writeText = jest.fn();
    (navigator.clipboard as unknown) = { writeText };
    const packageInfo = faker.opossum.packageInfo();
    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    await userEvent.click(
      screen.getByLabelText(text.attributionColumn.copyToClipboard),
    );

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(generatePurl(packageInfo));
  });

  it('pastes PURL from clipboard', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const purl = generatePurl(packageInfo);
    const readText = jest.fn().mockReturnValue(purl.toString());
    (navigator.clipboard as unknown) = { readText };
    renderComponent(
      <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
    );

    await userEvent.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );

    expect(readText).toHaveBeenCalledTimes(1);
    expect(
      screen.getByDisplayValue(packageInfo.packageName!),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(packageInfo.packageVersion!),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(packageInfo.packageType!),
    ).toBeInTheDocument();
  });

  it('renders a source name, if it is defined', () => {
    const packageInfo: PackageInfo = {
      source: faker.opossum.source(),
      id: faker.string.uuid(),
    };
    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    expect(screen.getByText(packageInfo.source!.name)).toBeInTheDocument();
  });

  it('renders the name of the original source', () => {
    const packageInfo: PackageInfo = {
      source: faker.opossum.source({
        additionalName: faker.company.name(),
      }),
      id: faker.string.uuid(),
    };

    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    expect(
      screen.getByText(packageInfo.source!.additionalName!),
    ).toBeInTheDocument();
  });

  it('renders original signal source for manual attributions', () => {
    const resourceName = faker.opossum.resourceName();
    const resources = faker.opossum.resources({
      [resourceName]: 1,
    });
    const source = faker.opossum.source();
    const externalPackageInfo = faker.opossum.packageInfo({
      originIds: [faker.string.uuid()],
      source,
    });
    const externalAttributions = faker.opossum.attributions({
      [externalPackageInfo.id]: externalPackageInfo,
    });
    const resourcesToExternalAttributions: ResourcesToAttributions =
      faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName)]: [externalPackageInfo.id],
      });
    const packageInfo = faker.opossum.packageInfo({
      originIds: externalPackageInfo.originIds,
    });
    const manualAttributions: Attributions = faker.opossum.attributions({
      [packageInfo.id]: packageInfo,
    });
    const resourcesToManualAttributions: ResourcesToAttributions =
      faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName)]: [packageInfo.id],
      });

    renderComponent(<AttributionForm packageInfo={packageInfo} />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources,
            manualAttributions,
            resourcesToManualAttributions,
            externalAttributions,
            resourcesToExternalAttributions,
          }),
        ),
      ],
    });

    expect(
      screen.getByText(text.attributionColumn.originallyFrom + source.name),
    ).toBeInTheDocument();
  });

  it('renders a chip for follow-up', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = renderComponent(
      <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).followUp,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(screen.getByText(text.auditingOptions.followUp));
    await userEvent.keyboard('{Escape}');

    expect(getTemporaryDisplayPackageInfo(store.getState()).followUp).toBe(
      true,
    );
  });

  it('renders a chip for exclude from notice', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = renderComponent(
      <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).excludeFromNotice,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(
      screen.getByText(text.auditingOptions.excludedFromNotice),
    );
    await userEvent.keyboard('{Escape}');
    expect(
      getTemporaryDisplayPackageInfo(store.getState()).excludeFromNotice,
    ).toBe(true);
  });

  it('renders a chip for needs review', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = renderComponent(
      <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).needsReview,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(screen.getByText(text.auditingOptions.needsReview));
    await userEvent.keyboard('{Escape}');

    expect(getTemporaryDisplayPackageInfo(store.getState()).needsReview).toBe(
      true,
    );
  });

  it('renders a chip for modified preferred', () => {
    const originId = faker.string.uuid();
    const packageInfo = faker.opossum.packageInfo({
      originIds: [originId],
      wasPreferred: true,
      modifiedPreferred: true,
    });
    const filePath = faker.opossum.filePath();

    renderComponent(<AttributionForm packageInfo={packageInfo} />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: faker.opossum.attributions({
              [packageInfo.id]: packageInfo,
            }),
            resourcesToManualAttributions:
              faker.opossum.resourcesToAttributions({
                [filePath]: [packageInfo.id],
              }),
            externalAttributions: faker.opossum.attributions({
              [packageInfo.id]: packageInfo,
            }),
            resourcesToExternalAttributions:
              faker.opossum.resourcesToAttributions({
                [filePath]: [packageInfo.id],
              }),
          }),
        ),
      ],
    });

    expect(
      screen.getByText(text.auditingOptions.modifiedPreferred),
    ).toBeInTheDocument();
  });

  it('renders a URL icon and opens a link in browser', () => {
    const packageInfo: PackageInfo = {
      url: 'https://www.testurl.com/',
      id: faker.string.uuid(),
    };
    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    expect(screen.getByLabelText('Url icon')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Url icon'));
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      packageInfo.url,
    );
  });

  it('opens a link without protocol', () => {
    const packageInfo: PackageInfo = {
      url: 'www.testurl.com',
      id: faker.string.uuid(),
    };
    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    fireEvent.click(screen.getByLabelText('Url icon'));
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      `https://${packageInfo.url}`,
    );
  });

  it('hides url icon if empty url', () => {
    const packageInfo: PackageInfo = {
      url: '',
      id: faker.string.uuid(),
    };
    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    expect(screen.queryByLabelText('Url icon')).not.toBeInTheDocument();
  });

  it('shows standard text if editable and non frequent license', () => {
    const packageInfo: PackageInfo = {
      packageName: 'jQuery',
      id: faker.string.uuid(),
    };
    renderComponent(
      <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
    );

    expect(
      screen.getByLabelText('License Text (to appear in attribution document)'),
    ).toBeInTheDocument();
  });

  it('shows shortened text if not editable and frequent license', () => {
    const packageInfo: PackageInfo = {
      packageName: 'jQuery',
      licenseName: 'Mit',
      id: faker.string.uuid(),
    };
    const frequentLicenses: FrequentLicenses = {
      nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
      texts: { MIT: 'text' },
    };
    renderComponent(<AttributionForm packageInfo={packageInfo} />, {
      actions: [
        setFrequentLicenses(frequentLicenses),
        setSelectedAttributionId(packageInfo.id),
      ],
    });

    expect(
      screen.getByLabelText('Standard license text implied.'),
    ).toBeInTheDocument();
  });

  it('shows long text if editable and frequent license', () => {
    const packageInfo: PackageInfo = {
      packageName: 'jQuery',
      licenseName: 'mit',
      id: faker.string.uuid(),
    };
    const frequentLicenses: FrequentLicenses = {
      nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
      texts: { MIT: 'text' },
    };
    renderComponent(
      <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
      {
        actions: [setFrequentLicenses(frequentLicenses)],
      },
    );

    expect(
      screen.getByLabelText(
        'Standard license text implied. Insert notice text if necessary.',
      ),
    ).toBeInTheDocument();
  });

  it('does not show copyright or license name fields when attribution is first party', () => {
    const packageInfo = faker.opossum.packageInfo({ firstParty: true });
    renderComponent(<AttributionForm packageInfo={packageInfo} />);

    expect(screen.queryByLabelText('Copyright')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('License Name')).not.toBeInTheDocument();
  });
});
