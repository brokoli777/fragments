// src/routes/api/get.js

const { Fragments } = require('../../model/fragment');
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
    Fragments.byId(ownerId, id)
      .then((fragment) => {
        res.status(200).json(
          createSuccessResponse({
            fragment: fragment,
          })
        );
      })
      .catch((err) => {
        res.status(500).json(createErrorResponse(500, 'ERROR: ' + err));
      });
    
  } else {
    // Get a list of fragments for the current user
    Fragments.byUser(ownerId, expand)
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
