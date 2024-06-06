// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  const expand = req.query.expand;
  const ownerId = req.user;
  const id = req.params.id;

  if (id) {
    // Get a specific fragment for the current user
    // Fragment.byId(ownerId, id)
    //   .then((fragment) => {
    //     res.status(200).json(
    //       createSuccessResponse(
    //         fragment
    //       )
    //     );
    //   })
    //   .catch((err) => {
    //     res.status(500).json(createErrorResponse(500, 'ERROR: ' + err));
    //   });
    // Fragment.getData(ownerId, id)
    //   .then((fragment) => {
    //     res.status(200).json(
    //       createSuccessResponse(
    //         fragment
    //       )
    //     );
    //   })
    //   .catch((err) => {
    //     res.status(500).json(createErrorResponse(500, 'ERROR: ' + err));
    //   });

    Fragment.byId(ownerId, id, expand)
      .then(
        (fragment) => {
        fragment.getData().then((data) => {
          res.status(200).send(
            data.toString()
          );
        
      })})
      .catch((err) => {
        res.status(500).json(createErrorResponse(500, 'ERROR: ' + err));
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
        res.status(500).json(createErrorResponse(500, 'ERROR: ' + err));
      });
  }

  // res.status(200).json(
  //   createSuccessResponse({
  //     fragments: [],
  //   })
  // );
};
