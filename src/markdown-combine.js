const fs = require("fs");
const util = require("util");
const path = require("path");
const logger = require("./logger.js");
const beautifyImages = require("./beautify-image-paths.js");

const [readFile, writeFile, exists] = [fs.readFile, fs.writeFile, fs.exists].map(fn =>
  util.promisify(fn),
);

const combineMarkdowns = ({ contents, pathToStatic, mainMdFilename, pathToDocsifyEntryPoint }) => async links => {
  try {
    const files = await Promise.all(
      await links.map(async filename => {
        const fileExist = await exists(filename);

        if (fileExist) {
          const content = await readFile(filename, {
            encoding: "utf8",
          });

          return {
            content,
            name: filename,
          };
        }

        throw new Error(`file ${filename} is not exist, but listed in ${contents}`);
      }),
    );

    const resultFilePath = path.resolve(pathToDocsifyEntryPoint, pathToStatic, mainMdFilename);

    try {
      const content = files
        .map(({ content, name }) => beautifyImages({ pathToStatic, pathToDocsifyEntryPoint })(content, name))
        .join("\n\n\n\n");
      await writeFile(resultFilePath, content);
    } catch (e) {
      logger.err(e);
      throw e;
    }

    return resultFilePath;
  } catch (err) {
    logger.err("combineMarkdowns", err);
    throw err;
  }
};

module.exports = config => ({
  combineMarkdowns: combineMarkdowns(config),
});
