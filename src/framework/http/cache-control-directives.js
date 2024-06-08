/*
 * Credits: https://github.com/symfony/symfony/blob/7.2/src/Symfony/Component/HttpFoundation/Response.php
 */

module.exports = class CacheControlDirectives {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
   */
  static HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES = {
    "must_revalidate" : false,
    "no_cache" : false,
    "no_store" : false,
    "no_transform" : false,
    "public" : false,
    "private" : false,
    "proxy_revalidate" : false,
    "max_age" : true,
    "s_maxage" : true,
    "stale_if_error" : true,         // RFC5861
    "stale_while_revalidate" : true, // RFC5861
    "immutable" : false,
    "last_modified" : true,
    "etag" : true,
  };
};
