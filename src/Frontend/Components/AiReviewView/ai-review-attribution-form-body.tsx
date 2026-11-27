// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import MuiStack from '@mui/material/Stack';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import MuiTypography from '@mui/material/Typography';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import type { AttributionFormBodyProps } from '../AttributionForm/attribution-form.types';
import {
  PACKAGE_FIELD_KEYS,
  PACKAGE_FIELD_METADATA,
} from '../AttributionForm/PackageAutocomplete/PackageAutocomplete';
import { aiReviewBodyClasses as classes } from './ai-review-attribution-form-body.style';
import { AttributionFieldValueEditor } from './attribution-field-value-editor';
import { type ReviewField, ReviewFieldRow } from './review-field-row';

function getPackageFields(packageInfo: PackageInfo): Array<ReviewField> {
  return PACKAGE_FIELD_KEYS.map((key) => ({
    key,
    label: key === 'url' ? 'Repository URL' : PACKAGE_FIELD_METADATA[key].label,
    value: packageInfo[key] || '',
  }));
}

function getLegalFields(packageInfo: PackageInfo): Array<ReviewField> {
  const attributionType: ReviewField = {
    key: 'firstParty',
    label: 'Attribution type',
    value: packageInfo.firstParty ? 'First Party' : 'Third Party',
  };
  return packageInfo.firstParty
    ? [attributionType]
    : [
        attributionType,
        {
          key: 'copyright',
          label: text.diffPopup.copyright,
          value: packageInfo.copyright || '—',
        },
        {
          key: 'licenseName',
          label: text.attributionColumn.licenseExpression,
          value: packageInfo.licenseName || '—',
        },
      ];
}

function ReviewSection({
  title,
  sectionId,
  fields,
  ...formProps
}: AttributionFormBodyProps & {
  title: string;
  sectionId: string;
  fields: Array<ReviewField>;
}) {
  const columnWidths = ['5%', '15%', '25%'];

  return (
    <MuiPaper component="section" variant="outlined" sx={classes.card}>
      <MuiTypography component="h2" variant="subtitle2" sx={classes.cardHeader}>
        {title}
      </MuiTypography>
      <MuiTable
        aria-label={`${sectionId} fields`}
        size="small"
        sx={classes.table}
      >
        <colgroup>
          {columnWidths.map((width) => (
            <col key={width} style={{ width }} />
          ))}
          <col />
          <col />
        </colgroup>
        <MuiTableHead>
          <MuiTableRow>
            <MuiTableCell aria-label="Expand" sx={classes.headCell} />
            {['State', 'Field', 'Value', 'Reason'].map((label) => (
              <MuiTableCell key={label} scope="col" sx={classes.headCell}>
                {label}
              </MuiTableCell>
            ))}
          </MuiTableRow>
        </MuiTableHead>
        <MuiTableBody>
          {fields.map((field) => (
            <ReviewFieldRow
              key={`${formProps.packageInfo.id}-${field.key}`}
              field={field}
              sectionId={sectionId}
              {...formProps}
            />
          ))}
        </MuiTableBody>
      </MuiTable>
    </MuiPaper>
  );
}

export function AiReviewAttributionFormBody(props: AttributionFormBodyProps) {
  const { packageInfo } = props;
  return (
    <MuiStack spacing={3}>
      <ReviewSection
        title="Package"
        sectionId="package"
        fields={getPackageFields(packageInfo)}
        {...props}
      />
      <ReviewSection
        title="Legal"
        sectionId="legal"
        fields={getLegalFields(packageInfo)}
        {...props}
      />
      <MuiPaper
        aria-label="Comment"
        component="section"
        variant="outlined"
        sx={classes.card}
      >
        <MuiTypography
          component="h2"
          variant="subtitle2"
          sx={classes.cardHeader}
        >
          Comment
        </MuiTypography>
        <MuiBox sx={{ p: 2 }}>
          <MuiBox
            sx={[
              classes.detailValue,
              !packageInfo.comment ? classes.emptyValue : {},
            ]}
          >
            <AttributionFieldValueEditor
              attribute="comment"
              title="Comment"
              multiline
              {...props}
            />
          </MuiBox>
        </MuiBox>
      </MuiPaper>
    </MuiStack>
  );
}
