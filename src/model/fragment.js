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
} = require('./data/memory');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {

    //console.log('Constructor called with:', { id, ownerId, created, updated, type, size });

    if(!ownerId ) { 
      //console.log('thrown! ownerId is required');
      throw new Error('ownerId is required')
    }else if (!type) {
      //console.log('thrown! type is required');
      throw new Error('type is required')
    } else if(size < 0 || typeof size !== 'number') {
      //console.log('thrown! size cannot be negative'); 
      throw new Error('size cannot be negative')
    }
    else if (!Fragment.isSupportedType(type)) {
      //console.log('thrown! unsupported media type');
      throw new Error('unsupported media type');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || this.created;
    this.type = type;
    this.size = size;

    //console.log('Fragment created:', this);

  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    // TODO
    return await listFragments(ownerId, expand);
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    
    // if ((await this.byUser(ownerId).includes(id) )) {
    //   throw new Error('Fragment not found');
    // }

    const userFragments = await listFragments(ownerId, false);
    if (!userFragments.includes(id)) {
      throw new Error('Fragment not found');
    }

    try {
      const fragment = await readFragment(ownerId, id);
      return fragment;
    }
    catch {
      throw new Error("Unable to read Fragment data");
    }
   
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    // TODO
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
    // TODO
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    // const fragment = this.byId(this.ownerId, this.id);
    // return readFragmentData(fragment.ownerId, fragment.id);
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    // TODO
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
    // TODO
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // TODO
    return ['text/plain'];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    // TODO
    const supportedTypes = ['text/plain', 'text/plain; charset=utf-8'];
    return supportedTypes.includes(value);
  }
}

module.exports.Fragment = Fragment;
