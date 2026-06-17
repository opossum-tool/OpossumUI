<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->

---

name: add-copyright-headers
description: Use when creating or editing any source file in this repo. Every file must carry SPDX copyright and license headers enforced by the REUSE pre-commit hook and `yarn copyright-lint-check`.

---

# Add REUSE Copyright Headers

This repository uses the [REUSE](https://reuse.software/) specification for
copyright and license compliance. Every source file must contain valid SPDX
headers, and the pre-commit hook (`yarn copyright-lint-check`) will reject
commits that touch files missing them.

## Requirements

The [reuse](https://git.fsfe.org/reuse/tool#install) CLI must be installed on
the system. It is not a yarn dependency.

## Header format

Every file must have at least:

- `SPDX-FileCopyrightText:` line(s) naming the copyright holders
- `SPDX-License-Identifier:` line with the applicable license

### TypeScript / JavaScript / MJS files

<!-- REUSE-IgnoreStart -->

```ts
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
```

### HTML / Markdown / XML / CSS files

```html
<!--
SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>

SPDX-License-Identifier: CC0-1.0
-->
```

### Shell scripts

```sh
# SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0
```

<!-- REUSE-IgnoreEnd -->

### YAML / JSON / TOML (no comment syntax)

These files cannot carry inline headers. The copyright metadata lives in
[`.reuse/dep5`](../../.reuse/dep5). Do not add comment-based headers to JSON or
YAML files.

## License choice

| Path pattern                                           | License      |
| ------------------------------------------------------ | ------------ |
| Source code (`*.ts`, `*.tsx`, `*.js`, `*.mjs`, `*.sh`) | `Apache-2.0` |
| Documentation (`*.md`, `*.html`, docs)                 | `CC0-1.0`    |

When in doubt, check existing files in the same directory for the pattern.

## Verification

Run the full repo check:

```bash
yarn copyright-lint-check
```

Or check a single file:

```bash
reuse lint <file>
```

## Common failures

- Forgetting the header on a newly created file — the pre-commit hook runs
  `yarn copyright-lint-check` on every commit, even if the staged file has
  headers but other repo files don't.
- Using `Apache-2.0` for a documentation file that should use `CC0-1.0`, or
  vice versa.
- Adding comment-based headers to JSON/YAML files that cannot support them —
  rely on `.reuse/dep5` instead.
