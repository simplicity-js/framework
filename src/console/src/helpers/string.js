exports.kebabCaseToCamelCase = function kebabCaseToCamelCase(str) {
  return (str
    .replace (/^[-_]*(.)/, (_, c) => c.toUpperCase())       // Initial char (after -/_)
    .replace (/[-_]+(.)/g, (_, c) => "" + c.toUpperCase())  // First char after each -/_
  );
};

exports.LCFirst = function LCFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

exports.pluralize = function pluralize(str, revert) {

  const plural = {
    "(quiz)$"               : "$1zes",
    "^(ox)$"                : "$1en",
    "([m|l])ouse$"          : "$1ice",
    "(matr|vert|ind)ix|ex$" : "$1ices",
    "(x|ch|ss|sh)$"         : "$1es",
    "([^aeiouy]|qu)y$"      : "$1ies",
    "(hive)$"               : "$1s",
    "(?:([^f])fe|([lr])f)$" : "$1$2ves",
    "(shea|lea|loa|thie)f$" : "$1ves",
    "sis$"                  : "ses",
    "([ti])um$"             : "$1a",
    "(tomat|potat|ech|her|vet)o$": "$1oes",
    "(bu)s$"                : "$1ses",
    "(alias)$"              : "$1es",
    "(octop)us$"            : "$1i",
    "(ax|test)is$"          : "$1es",
    "(us)$"                 : "$1es",
    "([^s]+)$"              : "$1s"
  };

  const singular = {
    "(quiz)zes$"             : "$1",
    "(matr)ices$"            : "$1ix",
    "(vert|ind)ices$"        : "$1ex",
    "^(ox)en$"               : "$1",
    "(alias)es$"             : "$1",
    "(octop|vir)i$"          : "$1us",
    "(cris|ax|test)es$"      : "$1is",
    "(shoe)s$"               : "$1",
    "(o)es$"                 : "$1",
    "(bus)es$"               : "$1",
    "([m|l])ice$"            : "$1ouse",
    "(x|ch|ss|sh)es$"        : "$1",
    "(m)ovies$"              : "$1ovie",
    "(s)eries$"              : "$1eries",
    "([^aeiouy]|qu)ies$"     : "$1y",
    "([lr])ves$"             : "$1f",
    "(tive)s$"               : "$1",
    "(hive)s$"               : "$1",
    "(li|wi|kni)ves$"        : "$1fe",
    "(shea|loa|lea|thie)ves$": "$1f",
    "(^analy)ses$"           : "$1sis",
    "((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$": "$1$2sis",
    "([ti])a$"               : "$1um",
    "(n)ews$"                : "$1ews",
    "(h|bl)ouses$"           : "$1ouse",
    "(corpse)s$"             : "$1",
    "(us)es$"                : "$1",
    "s$"                     : ""
  };

  const irregular = {
    "move"   : "moves",
    "foot"   : "feet",
    "goose"  : "geese",
    "sex"    : "sexes",
    "child"  : "children",
    "man"    : "men",
    "tooth"  : "teeth",
    "person" : "people"
  };

  const uncountable = [
    "sheep",
    "fish",
    "deer",
    "moose",
    "series",
    "species",
    "money",
    "rice",
    "information",
    "equipment"
  ];

  // save some time in the case that singular and plural are the same
  if(uncountable.indexOf(str.toLowerCase()) >= 0) {
    return str;
  }

  // check for irregular forms
  for(word in irregular) {
    let pattern;
    let replace;

    if(revert) {
      pattern = new RegExp(irregular[word] + "$", "i");
      replace = word;
    } else {
      pattern = new RegExp(word + "$", "i");
      replace = irregular[word];
    }

    if(pattern.test(str)) {
      return str.replace(pattern, replace);
    }
  }

  const array = revert ? singular : plural;

  // check for matches using regular expressions
  for(reg in array) {
    const pattern = new RegExp(reg, "i");

    if(pattern.test(str)) {
      return str.replace(pattern, array[reg]);
    }
  }

  return str;
};

exports.singularize = function singularize(word) {
  const endings = {
    ves: "fe",
    ies: "y",
    i: "us",
    zes: "ze",
    ses: "s",
    es: "e",
    s: ""
  };

  return word.replace(
    new RegExp(`(${Object.keys(endings).join("|")})$`),
    r => endings[r]
  );
};

exports.spacedCharToUpperCase = function spaceToUpperCase(str) {
  return (str
    .trim()
    .replace(/[\s]+(.)/g, (_, c) => "" + c.toUpperCase()) // First char after each space char
    .replace(/(^[_-]+)|([_-]+)$/g, "") // trim underscore (_) or dash (-) from the beginning and end of the string
  );
};

exports.UCFirst = function UCFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.upperCaseToKebabCase = function upperCaseToKebabCase(str, separator = "-") {
  return camelCaseToSnakeCase(str, separator); //.toLowerCase();
};

function camelCaseToSnakeCase(str, separator = "-") {
  return (
    str
      .replace(/([A-Z])/g, (_, c) => `${separator}${c.toLowerCase()}`) // replace CAPS with "-" (or specified separator character)
      .replace(new RegExp(`^${separator}`), "") // strip off the `-` preceding the first CAPS letter
      .replace(/[\s_-]+/g, separator)           // replace spaces, underscores, and dashes with separatator character.
  );
}
