// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { faker } from '../../../../shared/Faker';
import {
  DiscreteConfidence,
  DisplayPackageInfo,
  FollowUp,
  FrequentLicenses,
  SaveFileArgs,
  Source,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { ButtonText, CheckboxLabel } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
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
import {
  clickOnButton,
  clickOnCheckbox,
} from '../../../test-helpers/general-test-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(screen.queryAllByText('Confidence')).toHaveLength(2);
    expect(
      screen.getByDisplayValue(
        testTemporaryDisplayPackageInfo.attributionConfidence.toString(),
      ),
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
    expect(screen.queryByText('Source')).not.toBeInTheDocument();
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.source!.name),
    );
  });

  it('renders the name of the original source, if it is defined', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      source: faker.opossum.source({
        additionalName: 'Original Source',
      }),
      attributionIds: [],
    };

    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByDisplayValue(
        testTemporaryDisplayPackageInfo.source!.additionalName!,
      ),
    );
  });

  it('renders a TextBox with the original source, if it is defined', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      source: {
        name: 'The Source',
        documentConfidence: 10,
        additionalName: 'Original Source',
      },
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByDisplayValue(
        (testTemporaryDisplayPackageInfo.source as Source)
          .additionalName as string,
      ),
    );
  });

  it('renders a checkbox for Follow-up', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).followUp,
    ).toBeUndefined();

    clickOnCheckbox(screen, CheckboxLabel.FollowUp);
    expect(getTemporaryDisplayPackageInfo(store.getState()).followUp).toBe(
      FollowUp,
    );
  });

  it('renders a checkbox for Exclude from notice', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).excludeFromNotice,
    ).toBeUndefined();

    clickOnCheckbox(screen, CheckboxLabel.ExcludeFromNotice);
    expect(
      getTemporaryDisplayPackageInfo(store.getState()).excludeFromNotice,
    ).toBe(true);
  });

  it('renders a checkbox for needs review', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).needsReview,
    ).toBeUndefined();

    clickOnCheckbox(screen, CheckboxLabel.NeedsReview);
    expect(getTemporaryDisplayPackageInfo(store.getState()).needsReview).toBe(
      true,
    );
  });

  it('renders an url icon and opens a link in browser', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: 'https://www.testurl.com/',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />,
    );
    act(() => {
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      'https://' + testTemporaryDisplayPackageInfo.url,
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
        onSaveButtonClick={doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
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
          onSaveButtonClick={doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
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
          onSaveButtonClick={doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
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
          onSaveButtonClick={doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
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
    it('sets first party flag when checking first party', () => {
      const testTemporaryDisplayPackageInfo: DisplayPackageInfo =
        EMPTY_DISPLAY_PACKAGE_INFO;
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />,
      );
      act(() => {
        store.dispatch(
          setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
        );
      });

      expect(
        getTemporaryDisplayPackageInfo(store.getState()).copyright,
      ).toBeUndefined();

      clickOnCheckbox(screen, CheckboxLabel.FirstParty);
      expect(getTemporaryDisplayPackageInfo(store.getState()).firstParty).toBe(
        true,
      );
    });

    it('leaves copyright unchanged when checking first party', () => {
      const testCopyright = 'Test Copyright';
      const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
        copyright: testCopyright,
        firstParty: true,
        attributionIds: [],
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />,
      );
      act(() => {
        store.dispatch(
          setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
        );
      });

      expect(getTemporaryDisplayPackageInfo(store.getState()).copyright).toBe(
        testCopyright,
      );

      clickOnCheckbox(screen, CheckboxLabel.FirstParty);
      expect(getTemporaryDisplayPackageInfo(store.getState()).copyright).toBe(
        testCopyright,
      );
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
          onSaveButtonClick={doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={false}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
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
