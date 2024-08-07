// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');
const logger = require('../logger');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {

    if(!ownerId ) { 
      throw new Error('ownerId is required')
    }else if (!type) {
      throw new Error('type is required')
    } else if(size < 0 || typeof size !== 'number') {
      throw new Error('size cannot be negative')
    }
    else if (!Fragment.isSupportedType(type)) {
      throw new Error('unsupported media type');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || this.created;
    this.type = type;
    this.size = size;


  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    return await listFragments(ownerId, expand);
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {

    logger.info(`inside byId function`);
    try {
      const fragmentInfo = await readFragment(ownerId, id);
      const fragment = new Fragment(fragmentInfo);
      return fragment;
    }
    catch {
      logger.error('Fragment not found');
      throw new Error('Fragment not found');
    }
   
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {

    try {
      return deleteFragment(ownerId, id);
    }
    catch {
      throw new Error('Fragment not found');
    }
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!data || data.length === 0) {
      throw new Error('data is required');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    return writeFragmentData(this.ownerId, this.id, data);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    //  return ['text/plain'];
    if(this.mimeType === 'text/plain') {
      return ['text/plain'];
    }
    else if(this.mimeType === 'text/markdown') {
      return ['text/markdown', 'text/html', 'text/plain'];
    }
    else if(this.mimeType === 'text/html') {
      return ['text/html', 'text/plain'];
    }
    else if(this.mimeType === 'text/csv'){
      return ['text/csv', 'text/plain', 'application/json'];
    }
    else if(this.mimeType === 'application/json') {
      return ['application/json', 'application/yaml', 'text/plain'];
    }
    else if(this.mimeType === 'application/yaml') {
      return ['application/yaml', 'text/plain'];
    }
    else if(this.mimeType === 'image/png' || this.mimeType === 'image/jpeg' || this.mimeType === 'image/webp' || this.mimeType === 'image/avif' || this.mimeType === 'image/gif') {
      return ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
    }
    else {
      return [];
    }
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const supportedTypes = ['text/plain', 'text/plain; charset=utf-8', 'text/markdown','text/html', 'text/csv','application/json', 'application/yaml'
      ,"image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"
    ];
    return supportedTypes.includes(value);
  }
}

module.exports.Fragment = Fragment;
