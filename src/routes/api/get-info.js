const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const id = req.params.id;

  logger.info(`GET /fragments/${id} for user ${ownerId}`);

  try {
    const fragment = await Fragment.byId(ownerId, id);

    res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size
        },
      })
    );
  }
  catch (err) {
    logger.error(err);
    res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
  
}



