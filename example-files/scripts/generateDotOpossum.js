// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const JSZip = require('jszip');
const glob = require('glob');
const path = require('path');

const exampleFilesDirectory = path.join(__dirname, '..');
const jsonFileExtension = '.json';
const dotOpossumFileExtension = '.opossum';
const attributionsFileSuffix = '_attributions.json';
const dotOpossumInputFileName = 'input.json';
const dotOpossumOutputFileName = 'output.json';

const { inputFilePaths, attributionFilePaths } =
  getInputAndAttributionFilePaths(exampleFilesDirectory);

for (const inputFilePath of inputFilePaths) {
  const inputFilePathParsed = path.parse(inputFilePath);
  const inputFileDirectory = inputFilePathParsed.dir;
  const dotOpossumFileName = `${inputFilePathParsed.name}${dotOpossumFileExtension}`;
  const dotOpossumFilePath = path.join(inputFileDirectory, dotOpossumFileName);

  if (!fs.existsSync(dotOpossumFilePath)) {
    const dotOpossumArchive = new JSZip();
    const dotOpossumWriteStream = fs.createWriteStream(dotOpossumFilePath);

    addInputJsonToArchive(dotOpossumArchive, inputFilePath);

    addAttributionsJsonToArchive(
      dotOpossumArchive,
      inputFilePath,
      attributionFilePaths,
    );

    dotOpossumArchive
      .generateAsync({
        type: 'nodebuffer',
        streamFiles: true,
        compression: 'DEFLATE',
        compressionOptions: { level: 5 },
      })
      .then((output) => dotOpossumWriteStream.write(output));

    console.log('Created: ' + dotOpossumFilePath);
  } else {
    console.log('File does already exist: ' + dotOpossumFilePath);
  }
}

function getInputAndAttributionFilePaths(exampleFilesDirectory) {
  const jsonFilePaths = glob.sync(
    `${exampleFilesDirectory}/**/*${jsonFileExtension}`,
  );
  const inputFilePaths = [];
  const attributionFilePaths = [];
  jsonFilePaths.forEach((filePath) =>
    filePath.endsWith(attributionsFileSuffix)
      ? attributionFilePaths.push(filePath)
      : checkIfJsonFileIsInputJson(filePath)
        ? inputFilePaths.push(filePath)
        : null,
  );
  return { inputFilePaths, attributionFilePaths };
}

function checkIfJsonFileIsInputJson(filePath) {
  return path.basename(filePath).split('.').length <= 2;
}

function addInputJsonToArchive(archive, inputFilePath) {
  const inputJson = fs.readFileSync(inputFilePath, { encoding: 'utf-8' });
  archive.file(dotOpossumInputFileName, inputJson);
}

function addAttributionsJsonToArchive(
  archive,
  inputFilePath,
  attributionFilePaths,
) {
  const expectedAssociatedAttributionFilePath =
    inputFilePath.slice(0, -5) + attributionsFileSuffix;
  if (attributionFilePaths.includes(expectedAssociatedAttributionFilePath)) {
    const outputJson = fs.readFileSync(expectedAssociatedAttributionFilePath, {
      encoding: 'utf-8',
    });
    archive.file(dotOpossumOutputFileName, outputJson);
  }
}
