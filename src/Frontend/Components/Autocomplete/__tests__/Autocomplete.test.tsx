// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../shared/Faker';
import { Autocomplete } from '../Autocomplete';

describe('Autocomplete', () => {
  it('renders label and value', () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    render(
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

  it('renders options when clicked', async () => {
    const title = faker.string.alpha({ length: 8 });
    const options = faker.helpers.multiple(() =>
      faker.string.alpha({ length: 8 }),
    );
    render(
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
    render(
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
});
