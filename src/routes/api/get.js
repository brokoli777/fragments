// src/routes/api/get.js

const Fragments = require('../../models/fragment');
const { createSuccessResponse } = require('../../response');
const {createErrorResponse} = require('../../response');
/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {

  const expand = req.query.expand ;

  res.status(200).json(
    createSuccessResponse({
      fragments: [],
    })
  );
};
