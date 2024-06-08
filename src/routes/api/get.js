// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res, next) => {
  const expand = req.query.expand;
  const ownerId = req.user;
  const id = req.params.id;
  

  if (id) {

    logger.info(`GET /fragments/${id} for user ${ownerId}`)

  let extension = '';
  if (id.includes('.')) {
    extension = id.split('.').pop();
  }

    Fragment.byId(ownerId, id, expand)
      .then(
        (fragment) => {
        fragment.getData().then((data) => {

          if (extension === 'txt') {
            // Check if the fragment is text/plain
            if (fragment.contentType === 'text/plain') {
              res.status(200)
                .header('Content-Type', 'text/plain')
                .header('Content-Disposition', 'attachment; filename="fragment.txt"')
                .send(data.toString());
            } else {
              res.status(415).json(createErrorResponse(415, 'Not allowed to convert to specified format'));
            }
          } else {
            // Return the data with the original content type
            res.status(200).send(data);
          }

          // res.status(200).send(
          //   data.toString()
          // );
        
      })})
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

  // res.status(200).json(
  //   createSuccessResponse({
  //     fragments: [],
  //   })
  // );
};
