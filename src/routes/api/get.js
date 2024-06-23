// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
//conversion libraries
const marked = require('marked');
const yaml = require('js-yaml');

const extensionToMimeType = {
  // Text types
  'txt': 'text/plain',
  'md': 'text/markdown',
  'html': 'text/html',
  'csv': 'text/csv',
  'json': 'application/json',
  'yaml': 'application/yaml',
  'yml': 'application/yaml',
  // Image types
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'webp': 'image/webp',
  'avif': 'image/avif',
  'gif': 'image/gif',
};

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res, next) => {
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
        fragment.getData().then((data) => {
          if (extension) {

            // Check if the fragment is text/plain
            logger.info(`Fragment content type: ${fragment.mimeType}`);

            if(!fragment.formats.includes(getMimeType(extension))){
              res.status(415).json(createErrorResponse(415, 'Not allowed to convert to specified format'));
            }
            else{

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
                res.status(415).json(createErrorResponse(415, 'Not allowed to convert to specified format'));
              });
}
          } else {
            // Return the data with original content type it had
            res.status(200).send(data.toString());
          }
        });
      })
      .catch((err) => {
        logger.error(err);
        next(err);
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

  const convertFileType = async (mimeType, data, extension) => {
    data = data.toString();

    try {
      switch (mimeType) {
        case 'text/plain':
          if (extension === 'txt') return data;
          break;
        case 'text/markdown':
          if (extension === 'html') {
            return marked(data);
          }
          if (extension === 'txt') return data;
          break;
        case 'application/json':
          if (extension === 'yaml' || extension === 'yml') {
            const jsonObject = JSON.parse(data);
            return yaml.dump(jsonObject);
          }
          if (extension === 'txt') return data;
          break;
        case 'application/yaml':
          if (extension === 'json') {
            const yamlObject = yaml.load(data);
            return JSON.stringify(yamlObject);
          }
          if (extension === 'txt') return data;
          break;

        default:
          throw new Error('Not allowed to convert to specified format');
      }
    } catch (error) {
      throw new Error(`Conversion failed: ${error.message}`);
    }

  };

  const getMimeType = (extension) => {
    const mimeType = extensionToMimeType[extension.toLowerCase()];
    if (!mimeType) {
      throw new Error(`MIME type for extension ${extension} is not supported.`);
    }
    return mimeType;
  };

  
};
