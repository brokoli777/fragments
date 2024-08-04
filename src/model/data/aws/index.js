// src/model/data/aws/index.js

const logger = require('../../../logger');

const s3Client = require('./s3Client');
const ddbDocClient = require('./ddbDocClient');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// // XXX: temporary use of memory-db until we add DynamoDB
// const MemoryDB = require('../memory/memory-db');


// // Create two in-memory databases: one for fragment metadata and the other for raw data
// const metadata = new MemoryDB();
// Write a fragment's metadata to memory db. Returns a Promise
// function writeFragment(fragment) {
//   return metadata.put(fragment.ownerId, fragment.id, fragment);
// }
// // Read a fragment's metadata from memory db. Returns a Promise
// function readFragment(ownerId, id) {
//   return metadata.get(ownerId, id);
// }

// Reads a fragment from DynamoDB. Returns a Promise<fragment|undefined>
async function readFragment(ownerId, id) {
  // Configure our GET params, with the name of the table and key (partition key + sort key)
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  // Create a GET command to send to DynamoDB
  const command = new GetCommand(params);

  try {
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);
    // We may or may not get back any data (e.g., no item found for the given key).
    // If we get back an item (fragment), we'll return it.  Otherwise we'll return `undefined`.
    logger.info({ data }, 'Successfully read fragment from DynamoDB');
    return data?.Item;
  } catch (err) {
    logger.warn({ err, params }, 'error reading fragment from DynamoDB');
    throw err;
  }
}

// Writes a fragment to DynamoDB. Returns a Promise.
function writeFragment(fragment) {
  // Configure our PUT params, with the name of the table and item (attributes and keys)
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  // Create a PUT command to send to DynamoDB
  const command = new PutCommand(params);

  try {
    return ddbDocClient.send(command);
  } catch (err) {
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB');
    throw err;
  }
}

// Writes a fragment's data to an S3 Object in a Bucket
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#upload-an-existing-object-to-an-amazon-s3-bucket
async function writeFragmentData(ownerId, id, data) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  // Create a PUT Object command to send to S3
  const command = new PutObjectCommand(params);

  try {
    logger.info({ params }, 'S3- Attempting to upload fragment data to S3');
    // Use our client to send the command
    await s3Client.send(command);
    logger.info({ Bucket: params.Bucket, Key: params.Key }, 'Successfully uploaded fragment data to S3');
  } catch (err) {
    // If anything goes wrong, log enough info that we can debug
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}


// // Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
// async function listFragments(ownerId, expand = false) {
//   const fragments = await metadata.query(ownerId);

//   // If we don't get anything back, or are supposed to give expanded fragments, return
//   if (expand || !fragments) {
//     return fragments;
//   }

//   // Otherwise, map to only send back the ids
//   return fragments.map((fragment) => fragment.id);
// }

// Get a list of fragments, either ids-only, or full Objects, for the given user.
// Returns a Promise<Array<Fragment>|Array<string>|undefined>
async function listFragments(ownerId, expand = false) {
  // Configure our QUERY params, with the name of the table and the query expression
  logger.info({ ownerId, expand }, 'Inside listFragments => Getting all fragments for user from DynamoDB');
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    // Specify that we want to get all items where the ownerId is equal to the
    // `:ownerId` that we'll define below in the ExpressionAttributeValues.
    KeyConditionExpression: 'ownerId = :ownerId',
    // Use the `ownerId` value to do the query
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  logger.info({ params }, 'Params');


  // Limit to only `id` if we aren't supposed to expand. Without doing this
  // we'll get back every attribute.  The projection expression defines a list
  // of attributes to return, see:
  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ProjectionExpressions.html
  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  // Create a QUERY command to send to DynamoDB
  const command = new QueryCommand(params);

  try {

    logger.info("Inside try block ---");
    // Wait for the data to come back from AWS
    const data = await ddbDocClient.send(command);

    // If we haven't expanded to include all attributes, remap this array from
    // [ {"id":"b9e7a264-630f-436d-a785-27f30233faea"}, {"id":"dad25b07-8cd6-498b-9aaf-46d358ea97fe"} ,... ] to
    // [ "b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe", ... ]
    return !expand ? data?.Items.map((item) => item.id) : data?.Items
  } catch (err) {
    logger.error({ err, params }, 'error getting all fragments for user from DynamoDB');
    throw err;
  }
}

// // Delete a fragment's metadata and data from memory db. Returns a Promise
// function deleteFragment(ownerId, id) {
  
//     // Delete metadata
//     //metadata.del(ownerId, id);
//     // Delete data

//     // const dbParams = {
//     //   TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
//     //   Key: { ownerId, id },
//     // };

//     // const params = {
//     //   Bucket: process.env.AWS_S3_BUCKET_NAME,
//     //   // Our key will be a mix of the ownerID and fragment id, written as a path
//     //   Key: `${ownerId}/${id}`,
//     // };

//     // logger.info({ dbParams }, 'Deleting fragment from DynamoDB');

//     // const dbCommand = new DeleteCommand(params);
    
//     // const command = new DeleteObjectCommand(params);

//     // try {
//     //   logger.info({ dbParams }, 'Inside try block ---');
//     //   const metaInfo = ddbDocClient.send(dbCommand);
//     //   logger.info("Successfully deleted object", metaInfo);

//     //   const info = s3Client.send(command);
//     //   logger.info("Successfully deleted object", info);
//     // }
//     // catch (err) {
//     //   const { TableName, Key } = dbParams;
//     //   logger.error({ err, TableName, Key }, 'Error deleting fragment from DynamoDB');

//     //   // If anything goes wrong, log enough info that we can debug
//     //   const { Bucket } = params;
//     //   logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');

//     //   throw new Error('unable to delete fragment');
//     // }


//     const dbParams = {
//       TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
//       Key: id,
//     };

//     const params = {
//       Bucket: process.env.AWS_S3_BUCKET_NAME,
//       // Our key will be a mix of the ownerID and fragment id, written as a path
//       Key: `${ownerId}/${id}`,
//     };

//     const dbCommand = new DeleteCommand(params);
//     logger.info({ dbParams }, 'Deleting fragment from DynamoDB');
//     ddbDocClient.send(dbCommand).then((data) => {
//       logger.info("Successfully deleted object", data);

//       const command = new DeleteObjectCommand(params);
//       s3Client.send(command).then((data) => {
//         logger.info("Successfully deleted object", data);
//       }
//       ).catch((err) => {
//         const { Bucket, Key } = params;
//         logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
//         throw new Error('unable to delete fragment data');
//       });

//     }).catch((err) => {
//       logger.error({ err, dbParams }, 'Error deleting fragment from DynamoDB');
//       throw new Error('unable to delete fragment');
//     });




//     // try {
//     //   // Use our client to send the command
//     //   const info = s3Client.send(command);
//     //   console.log("Successfully deleted object", info);
//     // } catch (err) {
//     //   // If anything goes wrong, log enough info that we can debug
//     //   const { Bucket, Key } = params;
//     //   logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
//     //   throw new Error('unable to delete fragment data');
//     // }
    
// }


// Delete a fragment's metadata and data from DynamoDB and S3. Returns a Promise
async function deleteFragment(ownerId, id) {
  // Configure our DELETE params for DynamoDB
  const dbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  // Configure our DELETE params for S3
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  // Create DELETE commands for DynamoDB and S3
  const dbCommand = new DeleteCommand(dbParams);
  const s3Command = new DeleteObjectCommand(s3Params);

  try {
    // Delete the metadata from DynamoDB
    await ddbDocClient.send(dbCommand);
    logger.info({ dbParams }, 'Successfully deleted fragment metadata from DynamoDB');

    // Delete the data from S3
    await s3Client.send(s3Command);
    logger.info({ s3Params }, 'Successfully deleted fragment data from S3');
  } catch (err) {
    logger.error({ err, dbParams, s3Params }, 'Error deleting fragment');
    throw new Error('unable to delete fragment');
  }
}


// Convert a stream of data into a Buffer, by collecting
// chunks of data until finished, then assembling them together.
// We wrap the whole thing in a Promise so it's easier to consume.
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    // As the data streams in, we'll collect it into an array.
    const chunks = [];

    // Streams have events that we can listen for and run
    // code.  We need to know when new `data` is available,
    // if there's an `error`, and when we're at the `end`
    // of the stream.

    // When there's data, add the chunk to our chunks list
    stream.on('data', (chunk) => chunks.push(chunk));
    // When there's an error, reject the Promise
    stream.on('error', reject);
    // When the stream is done, resolve with a new Buffer of our chunks
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Reads a fragment's data from S3 and returns (Promise<Buffer>)
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#getting-a-file-from-an-amazon-s3-bucket
async function readFragmentData(ownerId, id) {
  // Create the PUT API params from our details
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a GET Object command to send to S3
  const command = new GetObjectCommand(params);

  try {
    // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(command);
    // Convert the ReadableStream to a Buffer
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
