// src/routes/api/post.js

const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = (req, res) => {
  const ownerId = req.user;
  const id = req.params.id;

  if (Fragment.isSupportedType(req.get('Content-Type')) === false) {
    const type = req.get('Content-Type');
    logger.error(`unsupported media type: ${type}`);
    res.status(415).json(createErrorResponse(415, 'unsupported media type'));
    return;
  }

  if (!Buffer.isBuffer(req.body)) {
    logger.error('no buffer found in request body');
    res.status(400).json(createErrorResponse(400, 'no buffer found in request body'));
    return;
  }

  Fragment.byId(ownerId, id)
    .then((fragment) => {

      if (fragment.type !== req.get('Content-Type')) {
        logger.error(`Fragment type did not match: ${fragment.type} !== ${req.get('Content-Type')}`);
        res.status(400).json(createErrorResponse(400, 'Fragment type did not match'));
        return;
      }

      fragment
        .setData(req.body)
        .then(() => {
          fragment.save().then(() => {
            const hostName = req.headers.host;
            const locationURL = new URL('/v1/fragments/' + fragment.id, `http://${hostName}`);
            res.location(locationURL.toString());

            logger.info(`Fragment ${fragment.id} updated for user ${req.user}`);

            res.status(200).json(
              createSuccessResponse({
                fragment,
              })
            );
          });
        })
        .catch((err) => {
          res.status(500).json(createErrorResponse(500, err));
        });
    })
    .catch((err) => {
      logger.error(err);
      res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    });
};
