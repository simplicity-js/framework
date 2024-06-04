const virtualSchemaOptions = {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
};

module.exports = {
  generateProjection,
  virtualSchemaOptions,
};


/**
 * Generate an object for doing MongoDB projection
 * for including or excluding certain fields from query results
 *
 * @param {String} type: The projection type [exclusion|inclusion]
 * @param {Array} fields: The fields to include or exclude from the result
 * @return {Object}
 */
function generateProjection(type, fields) {
  const projection = {};
  const value = type === "exclusion" ? 0 : 1;

  if(Array.isArray(fields)) {
    for(const field of fields) {
      if(field === "id") {
        projection["_id"] = value;
      } else if (field === "creationDate") {
        projection["meta.created_at"] = value;
      } else {
        projection[field] = value;
      }
    }
  }

  return projection;
}
