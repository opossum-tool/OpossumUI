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
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { generatePurl } from '../../../util/handle-purl';
import { AttributionForm } from '../AttributionForm';

describe('AttributionForm', () => {
  describe('PURL handling', () => {
    it('copies PURL to clipboard', async () => {
      const writeText = vi.fn();
      vi.stubGlobal('navigator', {
        clipboard: { writeText },
      });
      const packageInfo = faker.opossum.packageInfo();
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      await userEvent.click(
        screen.getByLabelText(text.attributionColumn.copyToClipboard),
      );

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(generatePurl(packageInfo));
    });

    it('pastes PURL from clipboard', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const purl = generatePurl(packageInfo);
      const readText = vi.fn().mockReturnValue(purl.toString());
      vi.stubGlobal('navigator', {
        clipboard: { readText },
      });

      await renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={vi.fn()} />,
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
    it('renders a source name, if it is defined', async () => {
      const packageInfo: PackageInfo = {
        source: faker.opossum.source(),
        criticality: Criticality.None,
        id: faker.string.uuid(),
      };
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByText(packageInfo.source!.name)).toBeInTheDocument();
    });

    it('renders the name of the original source for external attributions', async () => {
      const source = faker.opossum.source({
        additionalName: faker.company.name(),
      });
      const packageInfo = faker.opossum.packageInfo({
        source,
      });

      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByText(source.additionalName!)).toBeInTheDocument();
    });

    it('renders original signal source for manual attributions', async () => {
      const source = faker.opossum.source();
      const packageInfo = faker.opossum.packageInfo({
        originalAttributionSource: source,
      });

      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByText(text.attributionColumn.originallyFrom + source.name),
      ).toBeInTheDocument();
    });

    it('renders a chip for follow-up', async () => {
      const packageInfo = faker.opossum.packageInfo();
      const { store } = await renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={vi.fn()} />,
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
      const { store } = await renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={vi.fn()} />,
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
      const { store } = await renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={vi.fn()} />,
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

    it('renders a chip for preferred', async () => {
      const packageInfo = faker.opossum.packageInfo({ preferred: true });
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-preferred'),
      ).toBeInTheDocument();
    });

    it('renders a chip for was-preferred', async () => {
      const packageInfo = faker.opossum.packageInfo({ wasPreferred: true });
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-was-preferred'),
      ).toBeInTheDocument();
    });

    it('renders a chip for pre-selected signals', async () => {
      const packageInfo = faker.opossum.packageInfo({ preSelected: true });
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-pre-selected'),
      ).toBeInTheDocument();
    });

    it('renders a chip showing the confidence', async () => {
      const packageInfo = faker.opossum.packageInfo({});
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByTestId('auditing-option-confidence'),
      ).toBeInTheDocument();
    });

    it('renders a chip for modified preferred', async () => {
      const packageInfo = faker.opossum.packageInfo({
        packageName: faker.lorem.word(),
        originalAttributionWasPreferred: true,
        wasPreferred: false,
      });

      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(
        screen.getByText(text.auditingOptions.modifiedPreferred),
      ).toBeInTheDocument();
    });

    describe('criticality chip', () => {
      [Criticality.Medium, Criticality.High].forEach((criticality) => {
        it(`renders a chip for ${RawCriticality[criticality]} criticality`, async () => {
          const packageInfo = faker.opossum.packageInfo({
            criticality,
          });

          await renderComponent(<AttributionForm packageInfo={packageInfo} />);

          const criticalityChip = screen.queryByTestId(
            'auditing-option-criticality',
          );
          expect(criticalityChip).toBeInTheDocument();
          expect(criticalityChip).toHaveTextContent(
            text.auditingOptions[
              criticality !== Criticality.None
                ? criticality
                : Criticality.Medium
            ] as string,
          );
        });
      });

      it('does not render a criticality chip if showing criticality is disabled', async () => {
        const packageInfo = faker.opossum.packageInfo({
          criticality: Criticality.Medium,
        });

        await renderComponent(<AttributionForm packageInfo={packageInfo} />, {
          actions: [setUserSetting({ showCriticality: false })],
        });

        const criticalityChip = screen.queryByTestId(
          'auditing-option-criticality',
        );
        expect(criticalityChip).not.toBeInTheDocument();
      });
    });

    describe('classification chip', () => {
      it('renders a chip for items with classification', async () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 1,
        });

        await renderComponent(<AttributionForm packageInfo={packageInfo} />, {
          actions: [setUserSetting({ showClassifications: true })],
        });

        const classificationChip = screen.getByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).toBeInTheDocument();
      });

      it('does not render a chip for if showing of classification items is disabled', async () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 1,
        });

        await renderComponent(<AttributionForm packageInfo={packageInfo} />, {
          actions: [setUserSetting({ showClassifications: false })],
        });

        const classificationChip = screen.queryByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).not.toBeInTheDocument();
      });

      it('Does not render a chip for items with classification 0', async () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 0,
        });

        await renderComponent(<AttributionForm packageInfo={packageInfo} />);

        const classificationChip = screen.queryByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).not.toBeInTheDocument();
      });

      it('shows the correct text if configured', async () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 1,
        });
        const classificationText = faker.word.words();

        await renderComponent(<AttributionForm packageInfo={packageInfo} />, {
          actions: [
            setConfig({
              classifications: {
                1: faker.opossum.classificationEntry({
                  description: classificationText,
                }),
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

      it('shows empty text if no configuration', async () => {
        const packageInfo = faker.opossum.packageInfo({
          classification: 1,
        });
        await renderComponent(<AttributionForm packageInfo={packageInfo} />);

        const classificationChip = screen.getByTestId(
          'auditing-option-classification',
        );
        expect(classificationChip).toBeInTheDocument();
        expect(classificationChip).toHaveTextContent('C');
      });
    });
  });

  describe('url handling', () => {
    it('renders a URL icon and opens a link in browser', async () => {
      const packageInfo: PackageInfo = {
        url: 'https://www.testurl.com/',
        criticality: Criticality.None,
        id: faker.string.uuid(),
      };
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByLabelText('Url icon')).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Url icon'));
      expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
        packageInfo.url,
      );
    });

    it('opens a link without protocol', async () => {
      const packageInfo: PackageInfo = {
        url: 'www.testurl.com',
        criticality: Criticality.None,
        id: faker.string.uuid(),
      };
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      fireEvent.click(screen.getByLabelText('Url icon'));
      expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
        `https://${packageInfo.url}`,
      );
    });

    it('hides url icon if empty url', async () => {
      const packageInfo: PackageInfo = {
        url: '',
        criticality: Criticality.None,
        id: faker.string.uuid(),
      };
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.queryByLabelText('Url icon')).not.toBeInTheDocument();
    });
  });

  describe('license handling', () => {
    it('shows default license text placeholder when frequent license name selected and no custom license text entered', async () => {
      const defaultLicenseText = faker.lorem.paragraphs();
      const packageInfo = faker.opossum.packageInfo();
      await renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={vi.fn()} />,
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
      await renderComponent(
        <AttributionForm packageInfo={packageInfo} onEdit={vi.fn()} />,
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

    it('does not show copyright or license name fields when attribution is first party', async () => {
      const packageInfo = faker.opossum.packageInfo({ firstParty: true });
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.queryByLabelText('Copyright')).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('License Expression'),
      ).not.toBeInTheDocument();
    });

    it('does show copyright or license name fields when attribution is third party', async () => {
      const packageInfo = faker.opossum.packageInfo({ firstParty: false });
      await renderComponent(<AttributionForm packageInfo={packageInfo} />);

      expect(screen.getByLabelText('Copyright')).toBeInTheDocument();
      expect(screen.getByLabelText('License Expression')).toBeInTheDocument();
    });
  });
});
