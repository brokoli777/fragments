// src/routes/api/post.js
const { createSuccessResponse } = require('../../response');
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');


module.exports = (req, res) => {  
  
  if (!Buffer.isBuffer(req.body)) {
    res.status(400).json(
      createErrorResponse(400, 'no buffer found in request body')
    );
    return;
  }

  if (fragment.isSupportedType(req.body) === false) {
    res.status(400).json(
      createErrorResponse(415, 'unsupported media type')
    );
    return;
  }
  
  const fragment = new Fragment({ownerId: req.user, type:req.get('Content-Type')});

  
  fragment.setData(req.body).then(() => {
  fragment.save().then(() => {
    res.status(201).json(
      createSuccessResponse({
        fragment
      })
    );
  });
}).catch((err) => {
  res.status(500).json(
    createErrorResponse(500, 'ERROR: ' + err)
  );
});

}
