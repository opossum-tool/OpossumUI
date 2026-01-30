// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SpdxExpressionValidationResult } from '../../../../util/spdx/validate-spdx';
import { SpdxValidationDisplay } from '../SpdxValidationDisplay';

describe('SpdxValidationDisplay', () => {
  describe('valid type', () => {
    it('renders nothing when expression is valid', () => {
      const validationResult: SpdxExpressionValidationResult = {
        type: 'valid',
      };

      const { container } = render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={jest.fn()}
        />,
      );

      expect(container).toHaveTextContent('');
    });
  });

  describe('syntax-error type', () => {
    it('renders error message for syntax errors', () => {
      const validationResult: SpdxExpressionValidationResult = {
        type: 'syntax-error',
      };

      render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={jest.fn()}
        />,
      );

      expect(screen.getByText('Invalid SPDX expression.')).toBeVisible();
    });
  });

  describe('uncapitalized-conjunctions type', () => {
    it('renders clickable warning with fix suggestion', async () => {
      const onApplyFix = jest.fn();
      const validationResult: SpdxExpressionValidationResult = {
        type: 'uncapitalized-conjunctions',
        fix: 'MIT AND Apache-2.0',
      };

      render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={onApplyFix}
        />,
      );

      expect(screen.getByText(/AND, OR and WITH need to be/)).toBeVisible();
      expect(screen.getByText('capitalized')).toBeVisible();

      await userEvent.click(screen.getByText('capitalized'));
      expect(onApplyFix).toHaveBeenCalledWith('MIT AND Apache-2.0');
    });
  });

  describe('unknown-licenses type', () => {
    it('renders warning for unknown license without suggestion', () => {
      const validationResult: SpdxExpressionValidationResult = {
        type: 'unknown-licenses',
        unknownLicenseIds: [{ unknownId: 'Unknown-License' }],
      };

      render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={jest.fn()}
        />,
      );

      expect(screen.getByText('Unknown-License')).toBeVisible();
      expect(screen.getByText(/is not a known license id\./)).toBeVisible();
      expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
    });

    it('renders warning with a clickable suggestion for unknown license', async () => {
      const validationResult: SpdxExpressionValidationResult = {
        type: 'unknown-licenses',
        unknownLicenseIds: [
          { unknownId: 'apache2', suggestion: 'Apache-2.0', fix: 'Apache-2.0' },
        ],
      };
      const onApplyFix = jest.fn();
      render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={onApplyFix}
        />,
      );

      expect(screen.getByText('apache2')).toBeVisible();
      expect(screen.getByText(/Did you mean/)).toBeVisible();
      expect(screen.getByText('Apache-2.0')).toBeVisible();

      await userEvent.click(screen.getByText('Apache-2.0'));
      expect(onApplyFix).toHaveBeenCalledWith('Apache-2.0');
    });

    it('renders multiple unknown licenses', async () => {
      const validationResult: SpdxExpressionValidationResult = {
        type: 'unknown-licenses',
        unknownLicenseIds: [
          { unknownId: 'mit', suggestion: 'MIT', fix: 'MIT' },
          { unknownId: 'Unknown-Foo' },
        ],
      };

      render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={jest.fn()}
        />,
      );

      expect(screen.getByText('mit')).toBeVisible();
      expect(screen.getByText('Unknown-Foo')).not.toBeVisible();

      await userEvent.click(screen.getByLabelText('expand messages'));

      expect(screen.getByText('Unknown-Foo')).toBeVisible();
    });

    it('sorts licenses with suggestions before those without', async () => {
      const validationResult: SpdxExpressionValidationResult = {
        type: 'unknown-licenses',
        unknownLicenseIds: [
          { unknownId: 'NoSuggestion1' },
          { unknownId: 'mit', suggestion: 'MIT', fix: 'MIT' },
          { unknownId: 'NoSuggestion2' },
        ],
      };

      render(
        <SpdxValidationDisplay
          validationResult={validationResult}
          onApplyFix={jest.fn()}
        />,
      );

      await userEvent.click(screen.getByLabelText('expand messages'));

      expect(screen.getByText('mit')).toBeVisible();
      expect(screen.getByText('NoSuggestion1')).toBeVisible();
      expect(screen.getByText('NoSuggestion2')).toBeVisible();

      const allText = document.body.textContent || '';
      const mitIndex = allText.indexOf('mit');
      const noSuggestion1Index = allText.indexOf('NoSuggestion1');
      const noSuggestion2Index = allText.indexOf('NoSuggestion2');

      expect(mitIndex).toBeLessThan(noSuggestion1Index);
      expect(mitIndex).toBeLessThan(noSuggestion2Index);
    });
  });
});
