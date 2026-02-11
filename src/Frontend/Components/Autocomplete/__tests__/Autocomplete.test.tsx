// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isEqual } from 'lodash';

import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { Autocomplete } from '../Autocomplete';

describe('Autocomplete', () => {
  it('renders label and value', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        optionText={{ primary: (option) => option }}
      />,
    );

    expect(screen.getByLabelText(title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(options[0])).toBeInTheDocument();
    options.forEach((option) => {
      expect(screen.queryByText(option)).not.toBeInTheDocument();
    });
  });

  it('renders popup indicator when not free solo', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        optionText={{ primary: (option) => option }}
      />,
    );

    expect(screen.getByLabelText('popup indicator')).toBeInTheDocument();
  });

  it('does not render popup indicator when free solo', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        optionText={{ primary: (option) => option }}
        freeSolo
      />,
    );

    expect(screen.queryByLabelText('popup indicator')).not.toBeInTheDocument();
  });

  it('renders custom end adornment even when free solo and not clearable', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    const testId = faker.string.sample();
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
        endAdornment={<div data-testid={testId} />}
        freeSolo
      />,
    );

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('renders options when clicked', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        optionText={{ primary: (option) => option }}
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));

    options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('displays only filtered options', async () => {
    const title = faker.string.alpha({ length: 8 });
    const option = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={[...options, option]}
        value={options[0]}
        optionText={{ primary: (option) => option }}
      />,
    );

    await userEvent.type(screen.getByRole('combobox'), option);

    expect(screen.getByText(option)).toBeInTheDocument();
    options.forEach((option) => {
      expect(screen.queryByText(option)).not.toBeInTheDocument();
    });
  });

  it('selects option with mouse', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText(options[0]));

    expect(screen.getByDisplayValue(options[0])).toBeInTheDocument();
    options
      .filter((option) => option !== options[0])
      .forEach((option) =>
        expect(screen.queryByDisplayValue(option)).not.toBeInTheDocument(),
      );
  });

  it('selects option with keyboard', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(screen.getByDisplayValue(options[0])).toBeInTheDocument();
    options
      .filter((option) => option !== options[0])
      .forEach((option) =>
        expect(screen.queryByDisplayValue(option)).not.toBeInTheDocument(),
      );
  });

  it('renders clear button when a value is selected', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        optionText={{ primary: (option) => option }}
      />,
    );

    expect(screen.getByLabelText('clear button')).toBeInTheDocument();
  });

  it('does not render clear button when no value is selected', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
      />,
    );

    expect(screen.queryByLabelText('clear button')).not.toBeInTheDocument();
  });

  it('does not render clear button when value is selected but clearing is disabled', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        optionText={{ primary: (option) => option }}
        disableClearable
      />,
    );

    expect(screen.queryByLabelText('clear button')).not.toBeInTheDocument();
  });

  it('does not render clear button when value is selected but autocomplete is disabled', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
        value={options[0]}
        disabled
      />,
    );

    expect(screen.queryByLabelText('clear button')).not.toBeInTheDocument();
  });

  it('renders multiple values', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options}
        optionText={{ primary: (option) => option }}
        multiple
      />,
    );

    options.forEach((option) => {
      expect(screen.getByTestId(`tag-${option}`)).toBeInTheDocument();
    });
  });

  it('adds one of multiple values', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
        multiple
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText(options[0]));

    expect(screen.getByTestId(`tag-${options[0]}`)).toBeInTheDocument();
  });

  it('clears one of multiple values', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
        multiple
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText(options[0]));
    await userEvent.click(
      within(screen.getByTestId(`tag-${options[0]}`)).getByTestId('CancelIcon'),
    );

    expect(screen.queryByText(options[0])).not.toBeInTheDocument();
  });

  it('closes popup when clicking on custom start icon', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    const testId = faker.string.sample();
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
        renderOptionStartIcon={(option, { closePopper }) => (
          <div onClick={closePopper} data-testid={`${option}-${testId}`} />
        )}
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText(options[0])).toBeInTheDocument();

    await userEvent.click(screen.getByTestId(`${options[0]}-${testId}`));

    expect(screen.queryByText(options[0])).not.toBeInTheDocument();
  });

  it('closes popup when clicking on custom end icon', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    const testId = faker.string.sample();
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        optionText={{ primary: (option) => option }}
        renderOptionEndIcon={(option, { closePopper }) => (
          <div onClick={closePopper} data-testid={`${option}-${testId}`} />
        )}
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText(options[0])).toBeInTheDocument();

    await userEvent.click(screen.getByTestId(`${options[0]}-${testId}`));

    expect(screen.queryByText(options[0])).not.toBeInTheDocument();
  });

  it('renders in grouped mode', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() => ({
      group: faker.string.alpha({ length: 8 }),
      value: faker.string.alpha({ length: 8 }),
    }));
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        value={options[0]}
        groupBy={(option) => option.group}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.value
        }
        optionText={{
          primary: (option) =>
            typeof option === 'string' ? option : option.value,
        }}
      />,
    );

    expect(screen.getByLabelText(title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(options[0].value)).toBeInTheDocument();
    options.forEach((option) => {
      expect(screen.queryByText(option.value)).not.toBeInTheDocument();
    });
  });

  it('selects option in grouped mode', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() => ({
      group: faker.string.alpha({ length: 8 }),
      value: faker.string.alpha({ length: 8 }),
    }));
    await renderComponent(
      <Autocomplete
        title={title}
        options={options}
        groupBy={(option) => option.group}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.value
        }
        optionText={{
          primary: (option) =>
            typeof option === 'string' ? option : option.value,
        }}
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText(options[0].group)).toBeInTheDocument();

    await userEvent.click(screen.getByText(options[0].value));

    expect(screen.getByDisplayValue(options[0].value)).toBeInTheDocument();
    options
      .filter((option) => !isEqual(option, options[0]))
      .forEach((option) =>
        expect(
          screen.queryByDisplayValue(option.value),
        ).not.toBeInTheDocument(),
      );
  });
});
