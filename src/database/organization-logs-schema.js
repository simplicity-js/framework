const mongoose = require("mongoose");
const { schema: auditLogSchema } = require("./audit-log-schema");
const { generateProjection, virtualSchemaOptions } = require("./schema-helper");

const Schema = mongoose.Schema;
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

const schemaDefinition = {
  auditLogId     : { type: Schema.ObjectId, required: true, ref: AuditLog },
  organizationId : { type: Schema.ObjectId, required: true },
};


const schema = new Schema(schemaDefinition, virtualSchemaOptions);

schema.virtual("id").get(function getVirtualId() {
  return this._id;
});

// Create a composite unique key constraint
// on the `auditLogId` and `organizationId` fields
schema.index({ auditLogId: 1, organizationId: 1 }, { unique: true });

schema.statics = {
  ...schema.statics,
  generateQuery: function({ where = {}, page = 1, limit = 0, orderBy = {} }) {
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const SORT = { ASC: 1, DESC: -1 };
    const OFFSET = ((typeof page === "number" && page > 0) ? page - 1 : 0);
    const LIMIT = ((typeof limit === "number" && limit > 0) ? limit : 0);
    const WHERE = (where && typeof where === "object" ? where : {});
    const query = this.find(WHERE);

    for(let [key, val] of Object.entries(orderBy)) {
      let value = val.toUpperCase();
      query.sort({
        [key]: Object.keys(SORT).includes(value) ? SORT[value] : SORT["ASC"]
        // using: sort({<FIELD>: 1/-1})
      });
    }

    query.skip(OFFSET * LIMIT);

    if(LIMIT > 0) {
      query.limit(LIMIT);
    }

    return query;
  },
  countRecords: async function(where) {
    if(typeof where === "object") {
      return await this.countDocuments(where); //this.count(where);
    } else {
      return await this.estimatedDocumentCount();
    }
  },
};


module.exports = {
  schema,
};
