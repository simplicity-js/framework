const Schema = require("mongoose").Schema;
const { generateProjection, virtualSchemaOptions } = require("./schema-helper");

const actorSchema = new Schema({
  type     : { type: String, required: true },
  id       : { type: String },
  metadata : { type: Object },
});

const contextSchema = new Schema({
  ipAddress : { type: String },
  userAgent : { type: String },
});

const targetSchema = new Schema({
  type     : { type: String, required: true },
  id       : { type: String },
  name     : { type: String },
  metadata : { type: Object },
});

const schemaDefinition = {
  action         : { type: String, required: true },
  actor          : { type: actorSchema, required: true },
  targets        : { type: [targetSchema] },
  context        : { type: contextSchema },
  occurredAt     : { type: Date, required: true, default: Date.now },
  metadata       : { type: Object },
  meta: {
    created_at: {
      type: Date,
      required: true,
      "default": Date.now,
      set: function() {
        if(this.isNew) {
          return Date.now();
        } else {
          return this.meta.created_at;
        }
      },
    },
    updated_at: {
      type: Date,
      "default": Date.now
    }
  },
};

const schema = new Schema(schemaDefinition, virtualSchemaOptions);

schema.pre("save", function(next) {
  if(this.isNew) {
    this.meta.created_at = Date.now();
  }

  this.meta.updated_at = undefined;
  next();
});

schema.virtual("id").get(function getVirtualId() {
  return this._id;
});

schema
  .virtual("creationDate")
  .get(function getVirtualCreationDate() {
    return this.meta.created_at;
  });

schema.statics = {
  ...schema.statics,
  generateQuery: function({ where = {}, page = 1, limit = 0, orderBy = {}, fields = {} }) {
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const SORT = { ASC: 1, DESC: -1 };
    const OFFSET = ((typeof page === "number" && page > 0) ? page - 1 : 0);
    const LIMIT = ((typeof limit === "number" && limit > 0) ? limit : 0);
    const WHERE = (where && typeof where === "object" ? where : {});
    const inclusions = fields?.include;
    const exclusions = fields?.exclude;
    const query = this.find(WHERE);

    if(inclusions) {
      const includeFields = generateProjection("inclusion", inclusions);

      if(Object.keys(includeFields).length > 0) {
        query.select(includeFields);
      }
    }

    if(exclusions) {
      const excludeFields = generateProjection("exclusion", exclusions);

      if(Object.keys(excludeFields).length > 0) {
        query.select(excludeFields);
      }
    }

    for(let [key, val] of Object.entries(orderBy)) {
      let value = val.toUpperCase();
      query.sort({
        [key]: Object.keys(SORT).includes(value) ? SORT[value] : SORT["ASC"]
        // using: sort({<FIELD>: 1/-1})
      });
    }

    // Order by most recent registrations by default,
    // unless client specifies otherwise
    if(!Reflect.has(orderBy, "creationDate") ||
       !Object.keys(SORT).includes(orderBy.creationDate.toUpperCase())) {
      query.sort({ "meta.created_at": SORT.DESC });
      // using: sort('[-]<FIELD>');
    } else {
      query.sort({
        "meta.created_at": orderBy.creationDate.toUpperCase() === "ASC"
          ? SORT.ASC
          : SORT.DESC
      });
    }

    query.skip(OFFSET * LIMIT);

    if(LIMIT > 0) {
      query.limit(LIMIT);
    }

    return query;
  },
  generateSearchQuery: function(str, { by = "", pattern = "", page = 1, limit = 0, orderBy = {}, fields = {} }) {
    by = by.trim();
    pattern = pattern.trim().toLowerCase();

    // Prepare the searchBy clause
    let searchBy = [];
    const regex = new RegExp(str, "i");

    if(!(["and", "or"].includes(pattern))) {
      pattern = "and";
    }

    //?by=firstname;lastname
    if(by && by.length > 0) {
      const byData = by.split(";");

      byData.forEach(key => {
        key = key.trim();

        if(key) {
          searchBy.push({ [key]: regex });
        }
      });
    } else {
      searchBy = [
        { action: regex },
      ];
    }

    let where;

    if(searchBy.length === 1) {
      where = searchBy[0];
    } else if(searchBy.length > 1) {
      where = { [`$${pattern}`]: searchBy };
    }

    return this.generateQuery({ where, page, limit, orderBy, fields });
  },
  countRecords: async function(where) {
    if(typeof where === "object") {
      return await this.countDocuments(where); //this.count(where);
    } else {
      return await this.estimatedDocumentCount();
    }
  },
  updateRecord: async function(id, updateData) {
    await this.findOneAndUpdate({ _id: id }, updateData);

    return await this.findById(id);
  },
  updateRecords: async function(where = {}, updateData) {
    return await this.updateMany(where, updateData);
  },

  /**
   * @param {String} the user ID
   * @param {Object} options
   * @param {Object} [options.fields]: fields to include or exclude (optional)
   * @param {Array} [options.fields.include] (optional): fields to include
   * @param {Array} [options.fields.exclude] (optional): fields to exclude
   */
  getById: async function(id, options) {
    const query = this.findById(id);
    const fields = options?.fields;
    const inclusions = fields?.include;
    const exclusions = fields?.exclude;

    if(inclusions) {
      const includeFields = generateProjection("inclusion", inclusions);

      if(Object.keys(includeFields).length > 0) {
        query.select(includeFields);
      }
    }

    if(exclusions) {
      const excludeFields = generateProjection("exclusion", exclusions);

      if(Object.keys(excludeFields).length > 0) {
        query.select(excludeFields);
      }
    }

    return await query;
  },
  deleteRecord: async function(id) {
    return await this.findByIdAndDelete(id);
  },
};

module.exports = {
  schema,
};
