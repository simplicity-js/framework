const s = require("serialijse");


module.exports = {
  serialize,
  deserialize,
};


function serialize(data) {
  return s.serialize(data);
}

function deserialize(string) {
  return s.deserialize(string);
}
