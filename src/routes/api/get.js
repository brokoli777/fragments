// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
//conversion libraries
const markdownit = require('markdown-it');
const yaml = require('js-yaml');
const csv = require('csvtojson');
const sharp = require('sharp');
const { convert } = require('html-to-text');

const extensionToMimeType = {
  // Text types
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  csv: 'text/csv',
  json: 'application/json',
  yaml: 'application/yaml',
  yml: 'application/yaml',
  // Image types
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  const expand = req.query.expand;
  const ownerId = req.user;
  const idExtension = req.params.id;

  if (idExtension) {
    logger.info(`GET /fragments/${idExtension} for user ${ownerId}`);

    let id = '';
    let extension = '';
    if (idExtension.includes('.')) {
      extension = idExtension.split('.')[1];
      id = idExtension.split('.')[0];
    } else {
      id = idExtension;
    }

    logger.info(`Extension: ${extension}`);
    logger.info(`ID: ${id}`);

    Fragment.byId(ownerId, id, expand)
      .then((fragment) => {
        logger.info(`Fragment found: ${fragment.id}`);

        fragment.getData().then((data) => {
          if (extension) {
            logger.info(`Fragment content type: ${fragment.mimeType}`);

            if (!fragment.formats.includes(getMimeType(extension))) {
              res
                .status(415)
                .json(createErrorResponse(415, 'Not allowed to convert to specified format'));
            } else {
              convertFileType(fragment.mimeType, data, extension)
                .then((convertedData) => {
                  const mimeType = getMimeType(extension);
                  res
                    .status(200)
                    .header('Content-Type', mimeType)
                    .header('Content-Disposition', `attachment; filename="fragment.${extension}"`)
                    .send(convertedData);
                })
                .catch((err) => {
                  logger.error(err);
                  res
                    .status(415)
                    .json(createErrorResponse(415, 'Conversion failed: Unsupported conversion'));
                });
            }
          } else {
            // Return the data with original content type it had
            res.status(200).header('Content-Type', fragment.mimeType).send(data.toString());
          }
        });
      })
      .catch((err) => {
        logger.error(err);
        // next(err);
        res.status(404).json(createErrorResponse(404, 'Fragment not found'));
      });
  } else {
    // Get a list of fragments for the current user
    Fragment.byUser(ownerId, expand)
      .then((fragments) => {
        res.status(200).json(
          createSuccessResponse({
            fragments: fragments,
          })
        );
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).json(createErrorResponse(500, 'ERROR: ' + err));
      });
  }

  // const convertFileType = async (mimeType, data, extension) => {
  //   data = data.toString();

  //   if (mimeType === 'text/plain') {
  //     if (extension === 'txt') return data;
  //   } else if (mimeType === 'text/markdown') {
  //     if (extension === 'html') {
  //       const md = markdownit();
  //       return md.render(data);
  //     }
  //     if (extension === 'txt') return data;
  //   } else if (mimeType === 'application/json') {
  //     if (extension === 'yaml' || extension === 'yml') {
  //       const jsonObject = JSON.parse(data);
  //       return yaml.dump(jsonObject);
  //     }
  //     if (extension === 'txt') return data;
  //   } else if (mimeType === 'application/yaml') {
  //     if (extension === 'json') {
  //       const yamlObject = yaml.load(data);
  //       return JSON.stringify(yamlObject);
  //     }
  //     if (extension === 'txt') return data;
  //   }
  //   else {
  //     throw new Error(`Conversion failed: Unsupported conversion (${mimeType} to ${extension})`);
  //   }
  // };

  const convertFileType = async (mimeType, bufferData, extension) => {
    const data = bufferData.toString();

    if (mimeType === 'text/plain') {
      if (extension === 'txt') return data;
    } else if (mimeType === 'text/markdown') {
      if (extension === 'html') {
        const md = markdownit();
        return md.render(data);
      }
      return data;
    }
    if (mimeType === 'text/html') {
      if (extension === 'txt') {
        return convert(data);
      }
      return data;
    } else if (mimeType === 'application/json') {
      if (extension === 'yaml' || extension === 'yml') {
        const jsonObject = JSON.parse(data);
        return yaml.dump(jsonObject);
      } else if (extension === 'txt') return data;
      else {
        return data;
      }
    } else if (mimeType === 'application/yaml') {
       return data;
    } else if (mimeType === 'text/csv') {
      if (extension === 'json') {
        return csv().fromString(data);
      }
      if (extension === 'txt' || extension == 'csv') return data;
    } else if (mimeType.startsWith('image/')) {
      const image = sharp(bufferData);
      if (extension === 'png') return image.png().toBuffer();
      if (extension === 'jpg' || extension === 'jpeg') return image.jpeg().toBuffer();
      if (extension === 'webp') return image.webp().toBuffer();
      if (extension === 'avif') return image.avif().toBuffer();
      if (extension === 'gif') return image.gif().toBuffer();
      return bufferData;
    } else {
      throw new Error(`Conversion failed: Unsupported conversion (${mimeType} to ${extension})`);
    }
  };

  const getMimeType = (extension) => {
    const mimeType = extensionToMimeType[extension.toLowerCase()];
    if (!mimeType) {
      return null;
    }
    return mimeType;
  };
};
