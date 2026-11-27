// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import MuiTypography from '@mui/material/Typography';
import { Fragment, useEffect, useState } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { Sizing } from '../../shared-styles';
import type { AttributionFormBodyProps } from '../AttributionForm/attribution-form.types';
import { aiReviewBodyClasses as classes } from './ai-review-attribution-form-body.style';

type ReviewField = { key: string; label: string; value: string };
const EMPTY_VALUE = '—';
const REVIEW_STATE_COLUMN_WIDTH = '92px';
const REVIEW_FIELD_COLUMN_WIDTH = '168px';

function getPackageFields(packageInfo: PackageInfo): Array<ReviewField> {
  return [
    {
      key: 'packageName',
      label: text.attributionColumn.packageName,
      value: packageInfo.packageName || EMPTY_VALUE,
    },
    {
      key: 'packageNamespace',
      label: text.attributionColumn.packageNamespace,
      value: packageInfo.packageNamespace || EMPTY_VALUE,
    },
    {
      key: 'packageVersion',
      label: text.attributionColumn.packageVersion,
      value: packageInfo.packageVersion || EMPTY_VALUE,
    },
    {
      key: 'packageType',
      label: text.attributionColumn.packageType,
      value: packageInfo.packageType || EMPTY_VALUE,
    },
    {
      key: 'url',
      label: 'Repository URL',
      value: packageInfo.url || EMPTY_VALUE,
    },
  ];
}

function getLegalFields(packageInfo: PackageInfo): Array<ReviewField> {
  const attributionType: ReviewField = {
    key: 'firstParty',
    label: 'Attribution type',
    value: packageInfo.firstParty ? 'First Party' : 'Third Party',
  };
  if (packageInfo.firstParty) {
    return [attributionType];
  }
  return [
    attributionType,
    {
      key: 'copyright',
      label: text.diffPopup.copyright,
      value: packageInfo.copyright || EMPTY_VALUE,
    },
    {
      key: 'licenseName',
      label: text.attributionColumn.licenseExpression,
      value: packageInfo.licenseName || EMPTY_VALUE,
    },
  ];
}

function ReviewFieldTable({
  sectionId,
  fields,
  expandedFields,
  onToggle,
}: {
  sectionId: string;
  fields: Array<ReviewField>;
  expandedFields: Set<string>;
  onToggle: (fieldKey: string) => void;
}) {
  const theme = useTheme();
  const fixedColumnWidths = [
    theme.spacing(Sizing.Row),
    REVIEW_STATE_COLUMN_WIDTH,
    REVIEW_FIELD_COLUMN_WIDTH,
  ];

  return (
    <MuiTable
      aria-label={`${sectionId} fields`}
      size={'small'}
      sx={classes.table}
    >
      <colgroup>
        {fixedColumnWidths.map((width) => (
          <col key={width} style={{ width }} />
        ))}
        <col />
        <col />
      </colgroup>
      <MuiTableHead>
        <MuiTableRow>
          <MuiTableCell aria-label={'Expand'} sx={classes.headCell} />
          <MuiTableCell component={'th'} scope={'col'} sx={classes.headCell}>
            State
          </MuiTableCell>
          <MuiTableCell component={'th'} scope={'col'} sx={classes.headCell}>
            Field
          </MuiTableCell>
          <MuiTableCell component={'th'} scope={'col'} sx={classes.headCell}>
            Value
          </MuiTableCell>
          <MuiTableCell component={'th'} scope={'col'} sx={classes.headCell}>
            Reason
          </MuiTableCell>
        </MuiTableRow>
      </MuiTableHead>
      <MuiTableBody>
        {fields.map((field) => {
          const isExpanded = expandedFields.has(field.key);
          const detailsId = `${sectionId}-${field.key}-details`;
          return (
            <Fragment key={field.key}>
              <MuiTableRow
                hover
                onClick={() => onToggle(field.key)}
                sx={isExpanded ? classes.expandedSummary : classes.summaryRow}
              >
                <MuiTableCell sx={classes.chevronCell}>
                  <MuiIconButton
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${field.label}`}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    size={'small'}
                    sx={classes.button}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(field.key);
                    }}
                  >
                    {isExpanded ? (
                      <KeyboardArrowDownIcon fontSize={'small'} />
                    ) : (
                      <KeyboardArrowRightIcon fontSize={'small'} />
                    )}
                  </MuiIconButton>
                </MuiTableCell>
                <MuiTableCell sx={classes.stateCell}>
                  <MuiBox component={'span'} sx={classes.emptyValue}>
                    {EMPTY_VALUE}
                  </MuiBox>
                </MuiTableCell>
                <MuiTableCell sx={classes.fieldCell}>
                  {field.label}
                </MuiTableCell>
                <MuiTableCell sx={classes.summaryCell}>
                  <MuiBox component={'span'} sx={classes.summaryValue}>
                    {field.value}
                  </MuiBox>
                </MuiTableCell>
                <MuiTableCell sx={classes.summaryCell}>
                  <MuiBox component={'span'} sx={classes.emptyValue}>
                    {EMPTY_VALUE}
                  </MuiBox>
                </MuiTableCell>
              </MuiTableRow>
              {isExpanded && (
                <MuiTableRow id={detailsId} sx={classes.expandedRow}>
                  <MuiTableCell colSpan={5} sx={classes.expandedCell}>
                    <MuiBox sx={classes.detailGrid}>
                      <MuiTypography sx={classes.detailLabel}>
                        Full Value
                      </MuiTypography>
                      <MuiTypography
                        sx={
                          field.value === EMPTY_VALUE
                            ? classes.emptyDetailValue
                            : classes.detailValue
                        }
                      >
                        {field.value}
                      </MuiTypography>
                      <MuiTypography sx={classes.detailLabel}>
                        Reason
                      </MuiTypography>
                      <MuiTypography sx={classes.emptyDetailValue}>
                        {EMPTY_VALUE}
                      </MuiTypography>
                      <MuiTypography sx={classes.detailLabel}>
                        Details
                      </MuiTypography>
                      <MuiTypography sx={classes.emptyDetailValue}>
                        {EMPTY_VALUE}
                      </MuiTypography>
                    </MuiBox>
                  </MuiTableCell>
                </MuiTableRow>
              )}
            </Fragment>
          );
        })}
      </MuiTableBody>
    </MuiTable>
  );
}

function ReviewSection({
  title,
  sectionId,
  fields,
  expandedFields,
  onToggle,
}: {
  title: string;
  sectionId: string;
  fields: Array<ReviewField>;
  expandedFields: Set<string>;
  onToggle: (fieldKey: string) => void;
}) {
  return (
    <MuiBox component={'section'} sx={classes.card}>
      <MuiTypography component={'h2'} sx={classes.cardHeader}>
        {title}
      </MuiTypography>
      <ReviewFieldTable
        sectionId={sectionId}
        fields={fields}
        expandedFields={expandedFields}
        onToggle={onToggle}
      />
    </MuiBox>
  );
}

export function AiReviewAttributionFormBody({
  packageInfo,
}: AttributionFormBodyProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(
    () => new Set(),
  );
  useEffect(() => setExpandedFields(new Set()), [packageInfo.id]);

  const toggleField = (fieldKey: string) => {
    setExpandedFields((current) => {
      const next = new Set(current);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  };

  return (
    <MuiBox sx={classes.bodyStack}>
      <ReviewSection
        title={'Package'}
        sectionId={'package'}
        fields={getPackageFields(packageInfo)}
        expandedFields={expandedFields}
        onToggle={toggleField}
      />
      <ReviewSection
        title={'Legal'}
        sectionId={'legal'}
        fields={getLegalFields(packageInfo)}
        expandedFields={expandedFields}
        onToggle={toggleField}
      />
      <MuiBox aria-label={'Comment'} component={'section'} sx={classes.card}>
        <MuiTypography component={'h2'} sx={classes.cardHeader}>
          Comment
        </MuiTypography>
        <MuiBox sx={classes.comment}>
          <MuiTypography
            sx={
              packageInfo.comment
                ? classes.commentValue
                : classes.commentEmptyValue
            }
          >
            {packageInfo.comment || EMPTY_VALUE}
          </MuiTypography>
        </MuiBox>
      </MuiBox>
    </MuiBox>
  );
}
