// src/routes/api/delete.js
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = (req, res) => {
  const ownerId = req.user;
  const id = req.params.id;

  logger.info(`inside delete route`);

  try{
    Fragment.delete(ownerId, id);
    logger.info(`Fragment ${id} deleted for user ${ownerId}`);
    res.status(200).json(createSuccessResponse());
  }
  catch (err) {
    logger.error(err);
    res.status(500).json(createErrorResponse(500, err));
  }

}
