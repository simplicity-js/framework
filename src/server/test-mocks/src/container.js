// For some reason, creating the container like this is making the tests fail.
// TO DO: Investigate why this happens

/*const awilix = require("awilix");
const { Container } = require("../../../component/container");

const awilixContainer = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY,
  strict: true,
});

module.exports = new Container(awilixContainer);
*/

const container = require("../../../component/container");

module.exports = container;
