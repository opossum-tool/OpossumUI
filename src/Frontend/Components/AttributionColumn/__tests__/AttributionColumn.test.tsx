// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';
import { act } from 'react-dom/test-utils';

import { faker } from '../../../../shared/Faker';
import {
  DiscreteConfidence,
  DisplayPackageInfo,
  FollowUp,
  FrequentLicenses,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { AttributionType, ButtonText } from '../../../enums/enums';
import {
  setFrequentLicenses,
  setTemporaryDisplayPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import {
  clickGoToLinkIcon,
  expectGoToLinkButtonIsDisabled,
  expectValueInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnButton } from '../../../test-helpers/general-test-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AttributionColumn } from '../AttributionColumn';

describe('The AttributionColumn', () => {
  it('renders TextBoxes with right titles and content', () => {
    const testTemporaryDisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
      packageName: 'jQuery',
      packageVersion: '16.5.0',
      packagePURLAppendix: '?appendix',
      packageNamespace: 'namespace',
      packageType: 'type',
      comments: ['some comment'],
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      licenseName: 'Made up license name',
      url: 'www.1999.com',
      attributionIds: [],
    } satisfies DisplayPackageInfo;
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByText(text.attributionColumn.packageSubPanel.confidence),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('confidence of 1')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.packageType),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageType),
    );
    expect(
      screen.queryAllByText(
        text.attributionColumn.packageSubPanel.packageNamespace,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(
        testTemporaryDisplayPackageInfo.packageNamespace,
      ),
    );
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.packageName),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageName),
    );
    expect(
      screen.queryAllByText(
        text.attributionColumn.packageSubPanel.packageVersion,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageVersion),
    );
    expect(
      screen.queryByText('(Defined in parent folder)'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Override parent')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Copyright'));
    expect(screen.getByDisplayValue(testTemporaryDisplayPackageInfo.copyright));
    expect(screen.getByLabelText('License Name'));
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.licenseName),
    );
    expect(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.repositoryUrl,
      ),
    );
    expect(screen.getByDisplayValue(testTemporaryDisplayPackageInfo.url));
    expect(screen.getByLabelText(/License Text/));
    expect(
      screen.getByDisplayValue('Permission is hereby granted', {
        exact: false,
      }),
    );
    expect(screen.getByLabelText('Comment'));
    const testComment = testTemporaryDisplayPackageInfo.comments
      ? testTemporaryDisplayPackageInfo.comments[0]
      : '';
    expect(screen.getByDisplayValue(testComment));
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.purl),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue('pkg:type/namespace/jQuery@16.5.0?appendix'),
    );
  });

  it('renders qualifier in the purl correctly', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
      packageName: 'jQuery',
      packageVersion: '16.5.0',
      packagePURLAppendix: '?appendix',
      packageNamespace: 'namespace',
      packageType: 'type',
      comments: ['some comment'],
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      licenseName: 'Made up license name',
      url: 'www.1999.com',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.purl,
      'pkg:type/namespace/jQuery@16.5.0?appendix&#test',
    );
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.purl,
      'pkg:type/namespace/jQuery@16.5.0?appendix=#test',
    );
  });

  it('sorts qualifier in the purl alphabetically', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
      packageName: 'jQuery',
      packageVersion: '16.5.0',
      packagePURLAppendix: '?appendix',
      packageNamespace: 'namespace',
      packageType: 'type',
      comments: ['some comment'],
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      licenseName: 'Made up license name',
      url: 'www.1999.com',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.purl,
      'pkg:type/namespace/jQuery@16.5.0?test=appendix&appendix=test#test',
    );
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.purl,
      'pkg:type/namespace/jQuery@16.5.0?appendix=test&test=appendix#test',
    );
  });

  it('removes special symbol from the end of the purl if nothing follows', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
      packageName: 'jQuery',
      packageVersion: '16.5.0',
      packagePURLAppendix: '?appendix',
      packageNamespace: 'namespace',
      packageType: 'type',
      comments: ['some comment'],
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      licenseName: 'Made up license name',
      url: 'www.1999.com',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    insertValueIntoTextBox(
      screen,
      text.attributionColumn.packageSubPanel.purl,
      'pkg:type/namespace/jQuery@16.5.0?',
    );
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(
      screen,
      text.attributionColumn.packageSubPanel.purl,
      'pkg:type/namespace/jQuery@16.5.0',
    );
  });

  it('renders a source name, if it is defined', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      source: faker.opossum.source(),
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(screen.getByText(testTemporaryDisplayPackageInfo.source!.name));
  });

  it('renders the name of the original source, if it is defined', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      source: faker.opossum.source({
        additionalName: faker.company.name(),
      }),
      attributionIds: [],
    };

    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByText(testTemporaryDisplayPackageInfo.source!.additionalName!),
    );
  });

  it('renders a chip for follow-up', async () => {
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).followUp,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(screen.getByText(text.auditingOptions.followUp));
    await userEvent.keyboard('{Escape}');

    expect(getTemporaryDisplayPackageInfo(store.getState()).followUp).toBe(
      FollowUp,
    );
  });

  it('renders a chip for exclude from notice', async () => {
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
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
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
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

  it('renders a URL icon and opens a link in browser', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: 'https://www.testurl.com/',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(screen.getByLabelText('Url icon'));
    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      testTemporaryDisplayPackageInfo.url,
    );
  });

  it('opens a link without protocol', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: 'www.testurl.com',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      `https://${testTemporaryDisplayPackageInfo.url}`,
    );
  });

  it('disables url icon if empty url', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: '',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).not.toHaveBeenCalled();
    expectGoToLinkButtonIsDisabled(screen);
  });

  describe('there are different license text labels', () => {
    it('shows standard text if editable and non frequent license', () => {
      const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
        packageName: 'jQuery',
        attributionIds: [],
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
      );
      act(() => {
        store.dispatch(
          setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
        );
      });

      expect(
        screen.getByLabelText(
          'License Text (to appear in attribution document)',
        ),
      );
    });

    it('shows shortened text if not editable and frequent license', () => {
      const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
        packageName: 'jQuery',
        licenseName: 'Mit',
        attributionIds: [],
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={false}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
      );
      act(() => {
        store.dispatch(
          setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
        );
      });
      const testFrequentLicenses: FrequentLicenses = {
        nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
        texts: { MIT: 'text' },
      };
      act(() => {
        store.dispatch(setFrequentLicenses(testFrequentLicenses));
      });

      expect(screen.getByLabelText('Standard license text implied.'));
    });

    it('shows long text if editable and frequent license', () => {
      const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
        packageName: 'jQuery',
        licenseName: 'mit',
        attributionIds: [],
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
      );
      act(() => {
        store.dispatch(
          setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
        );
      });
      const testFrequentLicenses: FrequentLicenses = {
        nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
        texts: { MIT: 'text' },
      };
      act(() => {
        store.dispatch(setFrequentLicenses(testFrequentLicenses));
      });

      expect(
        screen.getByLabelText(
          'Standard license text implied. Insert notice text if necessary.',
        ),
      );
    });
  });

  describe('while changing the first party value', () => {
    it('sets first party flag and hides third party inputs when choosing first party', async () => {
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
      );

      expect(
        getTemporaryDisplayPackageInfo(store.getState()).copyright,
      ).toBeUndefined();

      await userEvent.click(
        screen.getByRole('button', { name: AttributionType.FirstParty }),
      );

      expect(getTemporaryDisplayPackageInfo(store.getState()).firstParty).toBe(
        true,
      );
      expect(screen.queryByLabelText('Copyright')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('License Name')).not.toBeInTheDocument();
    });
  });

  describe('The ResolveButton', () => {
    it('saves resolved external attributions', () => {
      const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
        attributionIds: ['TestId'],
      };
      const expectedSaveFileArgs: SaveFileArgs = {
        manualAttributions: {},
        resolvedExternalAttributions: new Set<string>().add('TestId'),
        resourcesToAttributions: {},
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
          showHideButton
        />,
      );
      act(() => {
        store.dispatch(
          setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
        );
      });

      clickOnButton(screen, 'resolve attribution');
      expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
        expectedSaveFileArgs,
      );
    });
  });
});
