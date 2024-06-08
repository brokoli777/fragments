// src/routes/api/post.js
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    logger.error('no buffer found in request body');
    res.status(400).json(createErrorResponse(400, 'no buffer found in request body'));
    return;
  }

  // if (Fragment.isSupportedType(req.get('Content-Type')) === false) {
  //   res.status(400).json(createErrorResponse(415, 'unsupported media type'));
  //   return;
  // }

  const fragment = new Fragment({ ownerId: req.user, type: req.get('Content-Type') });

  if (!Fragment.isSupportedType(fragment.type)) {
  
    logger.error(`unsupported media type: ${fragment.type}`);
    res.status(415).json(createErrorResponse(415, 'unsupported media type'));
    return;
  }

  fragment
    .setData(req.body)
    .then(() => {
      fragment.save().then(() => {

        //Setting Location Header
        const hostName = process.env.API_URL || req.headers.host;
        const locationURL = new URL("/v1/fragments/" + fragment.id, `http://${hostName}`);
        res.location(locationURL.toString());

        logger.info(`Fragment ${fragment.id} created for user ${req.user}`);

        res.status(201).json(
          createSuccessResponse({
            fragment,
          })
        );
      });
    })
    .catch((err) => {
      res.status(500).json(createErrorResponse(500, err));
    });
};
