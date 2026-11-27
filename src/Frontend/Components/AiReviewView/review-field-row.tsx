// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableRow from '@mui/material/TableRow';
import MuiTypography from '@mui/material/Typography';
import { Fragment, useState } from 'react';

import type { AttributionFormBodyProps } from '../AttributionForm/attribution-form.types';
import { AttributionTypeField } from '../AttributionForm/attribution-type-field';
import { aiReviewBodyClasses as classes } from './ai-review-attribution-form-body.style';
import { AttributionFieldValueEditor } from './attribution-field-value-editor';
import type { ReviewFieldAttribute } from './review-field-input';

export interface ReviewField {
  key: Exclude<ReviewFieldAttribute, 'comment'> | 'firstParty';
  label: string;
  value: string;
}

export function ReviewFieldRow({
  field,
  sectionId,
  ...formProps
}: AttributionFormBodyProps & { field: ReviewField; sectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `${sectionId}-${field.key}-details`;
  const toggle = () => setExpanded((current) => !current);

  function renderValue(multiline = false) {
    if (field.key === 'firstParty') {
      if (!formProps.onEdit) {
        return field.value;
      }
      return (
        <MuiBox
          sx={{ display: 'flex' }}
          onClick={(event) => event.stopPropagation()}
        >
          <AttributionTypeField
            compact
            value={formProps.packageInfo.firstParty}
            onChange={(firstParty) => {
              void formProps.onEdit?.(() => formProps.onUpdate({ firstParty }));
            }}
          />
        </MuiBox>
      );
    }
    return (
      <AttributionFieldValueEditor
        attribute={field.key}
        title={field.label}
        multiline={multiline}
        {...formProps}
      />
    );
  }

  return (
    <>
      <MuiTableRow
        hover
        selected={expanded}
        onClick={toggle}
        sx={{ cursor: 'pointer' }}
      >
        <MuiTableCell sx={classes.chevronCell}>
          <MuiIconButton
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${field.label}`}
            aria-expanded={expanded}
            aria-controls={detailsId}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
          >
            {expanded ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowRightIcon fontSize="small" />
            )}
          </MuiIconButton>
        </MuiTableCell>
        <MuiTableCell>
          <MuiBox component="span" sx={classes.emptyValue}>
            —
          </MuiBox>
        </MuiTableCell>
        <MuiTableCell sx={classes.fieldCell}>{field.label}</MuiTableCell>
        <MuiTableCell>{renderValue()}</MuiTableCell>
        <MuiTableCell>
          <MuiBox component="span" sx={classes.emptyValue}>
            —
          </MuiBox>
        </MuiTableCell>
      </MuiTableRow>
      {expanded && (
        <MuiTableRow id={detailsId}>
          <MuiTableCell colSpan={5}>
            <MuiBox sx={classes.detailGrid}>
              <MuiTypography sx={classes.detailLabel}>Full Value</MuiTypography>
              <MuiBox
                sx={[
                  classes.detailValue,
                  !field.value ? classes.emptyValue : {},
                ]}
              >
                {renderValue(true)}
              </MuiBox>
              {['Reason', 'Details'].map((label) => (
                <Fragment key={label}>
                  <MuiTypography sx={classes.detailLabel}>
                    {label}
                  </MuiTypography>
                  <MuiTypography sx={[classes.detailValue, classes.emptyValue]}>
                    —
                  </MuiTypography>
                </Fragment>
              ))}
            </MuiBox>
          </MuiTableCell>
        </MuiTableRow>
      )}
    </>
  );
}
