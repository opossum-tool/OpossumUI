// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Criticality,
  PackageInfo,
  RawCriticality,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  setConfig,
  setFrequentLicenses,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { generatePurl } from '../../../util/handle-purl';
import { AttributionForm } from '../AttributionForm';

describe('AttributionForm', () => {
  describe('PURL handling', () => {
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
  });

  describe('chips at the top of the attribution form', () => {
    it('renders a source name, if it is defined', () => {
      const packageInfo: PackageInfo = {
        source: faker.opossum.source(),
        criticality: Criticality.None,
        id: faker.string.uuid(),
      };
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByText(packageInfo.source!.name)).toBeInTheDocument();
    });

    it('renders the name of the original source for external attributions', () => {
      const source = faker.opossum.source({
        additionalName: faker.company.name(),
      });
      const packageInfo = faker.opossum.packageInfo({
        source,
      });

      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByText(source.additionalName!)).toBeInTheDocument();
    });

    it('renders original signal source for manual attributions', () => {
      const source = faker.opossum.source();
      const packageInfo = faker.opossum.packageInfo({
        originalAttributionSource: source,
      });

      renderComponent(<AttributionForm packageInfo={packageInfo} />);

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

    it('renders a chip for preferred', () => {
      const packageInfo = faker.opossum.packageInfo({ preferred: true });
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-preferred'),
      ).toBeInTheDocument();
    });

    it('renders a chip for was-preferred', () => {
      const packageInfo = faker.opossum.packageInfo({ wasPreferred: true });
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-was-preferred'),
      ).toBeInTheDocument();
    });

    it('renders a chip for pre-selected signals', () => {
      const packageInfo = faker.opossum.packageInfo({ preSelected: true });
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-pre-selected'),
      ).toBeInTheDocument();
    });

    it('renders a chip showing the confidence', () => {
      const packageInfo = faker.opossum.packageInfo({});
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-confidence'),
      ).toBeInTheDocument();
    });

    it('renders a chip for modified preferred', () => {
      const packageInfo = faker.opossum.packageInfo({
        packageName: faker.lorem.word(),
        originalAttributionWasPreferred: true,
        wasPreferred: false,
      });

      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByText(text.auditingOptions.modifiedPreferred),
      ).toBeInTheDocument();
    });

    [Criticality.Medium, Criticality.High].forEach((criticality) => {
      it(`renders a chip for ${RawCriticality[criticality]} criticality`, () => {
        const packageInfo = faker.opossum.packageInfo({
          criticality,
        });

        renderComponent(<AttributionForm packageInfo={packageInfo} />);

        const criticalityChip = screen.queryByTestId(
          'auditing-option-criticality',
        );
        expect(criticalityChip).toBeInTheDocument();
        expect(criticalityChip).toHaveTextContent(
          text.auditingOptions[
            criticality !== Criticality.None ? criticality : Criticality.Medium
          ] as string,
        );
      });
    });

    describe('classification chip', () => {
      it('renders a chip for items with classification', () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 1,
        });

        renderComponent(<AttributionForm packageInfo={packageInfo} />);

        const classificationChip = screen.queryByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).toBeInTheDocument();
      });

      it('renders a chip for items with classification 0', () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 0,
        });

        renderComponent(<AttributionForm packageInfo={packageInfo} />);

        const classificationChip = screen.getByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).toBeInTheDocument();
      });

      it('shows the correct text if configured', () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 0,
        });
        const classificationText = faker.word.words();

        renderComponent(<AttributionForm packageInfo={packageInfo} />, {
          actions: [
            setConfig({
              classifications: {
                0: classificationText,
              },
            }),
          ],
        });

        const classificationChip = screen.getByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).toBeInTheDocument();
        expect(classificationChip).toHaveTextContent(classificationText);
      });

      it('shows the backup text if no configuration', () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 0,
        });
        renderComponent(<AttributionForm packageInfo={packageInfo} />);

        const classificationChip = screen.getByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).toBeInTheDocument();
        expect(classificationChip).toHaveTextContent('0 - not configured');
      });
    });
  });

  describe('url handling', () => {
    it('renders a URL icon and opens a link in browser', () => {
      const packageInfo: PackageInfo = {
        url: 'https://www.testurl.com/',
        criticality: Criticality.None,
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
        criticality: Criticality.None,
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
        criticality: Criticality.None,
        id: faker.string.uuid(),
      };
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.queryByLabelText('Url icon')).not.toBeInTheDocument();
    });
  });

  describe('license handling', () => {
    it('shows default license text placeholder when frequent license name selected and no custom license text entered', async () => {
      const defaultLicenseText = faker.lorem.paragraphs();
      const packageInfo = faker.opossum.packageInfo();
      renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
        {
          actions: [
            setFrequentLicenses({
              nameOrder: [],
              texts: { [packageInfo.licenseName!]: defaultLicenseText },
            }),
          ],
        },
      );

      await userEvent.click(
        screen.getByLabelText('license-text-toggle-button'),
      );

      expect(
        screen.getByRole('textbox', {
          name: text.attributionColumn.licenseTextDefault,
        }),
      ).toHaveAttribute('placeholder', defaultLicenseText);
      expect(
        screen.getByLabelText(text.attributionColumn.licenseTextDefault),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(text.attributionColumn.licenseText),
      ).not.toBeInTheDocument();
    });

    it('does not show default license text placeholder when custom license text entered', async () => {
      const defaultLicenseText = faker.lorem.paragraphs();
      const packageInfo = faker.opossum.packageInfo({
        licenseText: faker.lorem.paragraphs(),
      });
      renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={jest.fn()} />,
        {
          actions: [
            setFrequentLicenses({
              nameOrder: [],
              texts: { [packageInfo.licenseName!]: defaultLicenseText },
            }),
          ],
        },
      );

      await userEvent.click(
        screen.getByLabelText('license-text-toggle-button'),
      );

      expect(
        screen.getByRole('textbox', {
          name: text.attributionColumn.licenseText,
        }),
      ).not.toHaveAttribute('placeholder', defaultLicenseText);
      expect(
        screen.queryByLabelText(text.attributionColumn.licenseTextDefault),
      ).not.toBeInTheDocument();
      expect(
        screen.getByLabelText(text.attributionColumn.licenseText),
      ).toBeInTheDocument();
    });

    it('does not show copyright or license name fields when attribution is first party', () => {
      const packageInfo = faker.opossum.packageInfo({ firstParty: true });
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.queryByLabelText('Copyright')).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('License Expression'),
      ).not.toBeInTheDocument();
    });

    it('does show copyright or license name fields when attribution is third party', () => {
      const packageInfo = faker.opossum.packageInfo({ firstParty: false });
      renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByLabelText('Copyright')).toBeInTheDocument();
      expect(screen.getByLabelText('License Expression')).toBeInTheDocument();
    });
  });
});
