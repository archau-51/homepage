'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ContentTypeHelpers = require('content-type');

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var checkIsString = /*#__PURE__*/getRefinement(function (value) {
  return typeof value === 'string' ? value : null;
});
var isDefined = function isDefined(x) {
  return x !== null && x !== undefined;
};
function getRefinement(getB) {
  return function (a) {
    return isDefined(getB(a));
  };
}
var checkIsNonEmptyArray = function checkIsNonEmptyArray(a) {
  return a.length > 0;
};

/** Takes a dictionary containing nullish values and returns a dictionary of all the defined
 * (non-nullish) values.
 */

var compactDefined = function compactDefined(obj) {
  return Object.keys(obj).reduce(function (acc, key) {
    var _ref;

    var value = obj[key];
    return _extends({}, acc, isDefined(value) ? (_ref = {}, _ref[key] = value, _ref) : {});
  }, {});
};
function flow() {
  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }

  var len = fns.length - 1;
  return function () {
    for (var _len2 = arguments.length, x = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      x[_key2] = arguments[_key2];
    }

    var y = fns[0].apply(this, x);

    for (var i = 1; i <= len; i++) {
      y = fns[i].call(this, y);
    }

    return y;
  };
}

var checkIsObject = /*#__PURE__*/getRefinement(function (response) {
  return isDefined(response) && typeof response === 'object' && !Array.isArray(response) ? response : null;
});
var checkIsErrors = /*#__PURE__*/getRefinement(function (errors) {
  return Array.isArray(errors) && errors.every(checkIsString) && checkIsNonEmptyArray(errors) ? errors : null;
});
var checkIsApiError = /*#__PURE__*/getRefinement(function (response) {
  return checkIsObject(response) && 'errors' in response && checkIsErrors(response.errors) ? {
    errors: response.errors
  } : null;
});
var getErrorForBadStatusCode = function getErrorForBadStatusCode(jsonResponse) {
  if (checkIsApiError(jsonResponse)) {
    return {
      errors: jsonResponse.errors,
      source: 'api'
    };
  } else {
    return {
      errors: ['Responded with a status code outside the 2xx range, and the response body is not recognisable.'],
      source: 'decoding'
    };
  }
};
var DecodingError = function DecodingError(message) {
  this.message = message;
};

var CONTENT_TYPE_RESPONSE_HEADER = 'content-type';
var CONTENT_TYPE_JSON = 'application/json';

var checkIsJsonResponse = function checkIsJsonResponse(response) {
  var contentTypeHeader = response.headers.get(CONTENT_TYPE_RESPONSE_HEADER);
  return isDefined(contentTypeHeader) && ContentTypeHelpers.parse(contentTypeHeader).type === CONTENT_TYPE_JSON;
};
/**
 * Note: restrict the type of JSON to `AnyJson` so that `any` doesn't leak downstream.
 */


var getJsonResponse = function getJsonResponse(response) {
  if (checkIsJsonResponse(response)) {
    return response.json()["catch"](function (_err) {
      throw new DecodingError('unable to parse JSON response.');
    });
  } else {
    throw new DecodingError('expected JSON response from server.');
  }
};

var handleFetchResponse = function handleFetchResponse(handleResponse) {
  return function (response) {
    return (response.ok ? handleResponse({
      response: response
    }).then(function (handledResponse) {
      return {
        type: 'success',
        status: response.status,
        response: handledResponse,
        originalResponse: response
      };
    }) : getJsonResponse(response).then(function (jsonResponse) {
      return _extends({
        type: 'error',
        status: response.status
      }, getErrorForBadStatusCode(jsonResponse), {
        originalResponse: response
      });
    }))["catch"](function (error) {
      /**
       * We want to separate expected decoding errors from unknown ones. We do so by throwing a custom
       * `DecodingError` whenever we encounter one within `handleFetchResponse` and catch them all
       * here. This allows us to easily handle all of these errors at once. Unexpected errors are not
       * caught, so that they bubble up and fail loudly.
       *
       * Note: Ideally we'd use an Either type, but this does the job without introducing dependencies
       * like `fp-ts`.
       */
      if (error instanceof DecodingError) {
        return {
          type: 'error',
          source: 'decoding',
          status: response.status,
          originalResponse: response,
          errors: [error.message]
        };
      } else {
        throw error;
      }
    });
  };
};
var castResponse = function castResponse() {
  return function (_ref) {
    var response = _ref.response;
    return getJsonResponse(response);
  };
};

var addQueryToUrl = function addQueryToUrl(query) {
  return function (url) {
    Object.keys(query).forEach(function (queryKey) {
      return url.searchParams.set(queryKey, query[queryKey].toString());
    });
  };
};

var addPathnameToUrl = function addPathnameToUrl(pathname) {
  return function (url) {
    // When there is no existing pathname, the value is `/`. Appending would give us a URL with two
    // forward slashes. This is why we replace the value in that scenario.
    if (url.pathname === '/') {
      url.pathname = pathname;
    } else {
      url.pathname += pathname;
    }
  };
};

var buildUrl = function buildUrl(_ref) {
  var pathname = _ref.pathname,
      query = _ref.query;
  return function (apiUrl) {
    var url = new URL(apiUrl);
    addPathnameToUrl(pathname)(url);
    addQueryToUrl(query)(url);
    return url.toString();
  };
};

var getQueryFromSearchParams = function getQueryFromSearchParams(searchParams) {
  var query = {};
  searchParams.forEach(function (value, key) {
    query[key] = value;
  });
  return query;
};

var parseQueryAndPathname = function parseQueryAndPathname(url) {
  var _URL = new URL(url),
      pathname = _URL.pathname,
      searchParams = _URL.searchParams;

  var query = getQueryFromSearchParams(searchParams);
  return {
    query: query,
    pathname: pathname === '/' ? undefined : pathname
  };
};

/**
 * helper used to type-check the arguments, and add default params for all requests
 */

var createRequestHandler = function createRequestHandler(fn) {
  return function (a, additionalFetchOptions) {
    if (additionalFetchOptions === void 0) {
      additionalFetchOptions = {};
    }

    var _fn = fn(a),
        headers = _fn.headers,
        query = _fn.query,
        baseReqParams = _objectWithoutPropertiesLoose(_fn, ["headers", "query"]);

    return _extends({}, baseReqParams, additionalFetchOptions, {
      query: query,
      headers: _extends({}, headers, additionalFetchOptions.headers)
    });
  };
};
var makeEndpoint = function makeEndpoint(endpoint) {
  return endpoint;
};
var initMakeRequest = function initMakeRequest(_ref) {
  var accessKey = _ref.accessKey,
      _ref$apiVersion = _ref.apiVersion,
      apiVersion = _ref$apiVersion === void 0 ? 'v1' : _ref$apiVersion,
      _ref$apiUrl = _ref.apiUrl,
      apiUrl = _ref$apiUrl === void 0 ? 'https://api.unsplash.com' : _ref$apiUrl,
      generalHeaders = _ref.headers,
      providedFetch = _ref.fetch,
      generalFetchOptions = _objectWithoutPropertiesLoose(_ref, ["accessKey", "apiVersion", "apiUrl", "headers", "fetch"]);

  return function (_ref2) {
    var handleResponse = _ref2.handleResponse,
        handleRequest = _ref2.handleRequest;
    return flow(handleRequest, function (_ref3) {
      var pathname = _ref3.pathname,
          query = _ref3.query,
          _ref3$method = _ref3.method,
          method = _ref3$method === void 0 ? 'GET' : _ref3$method,
          endpointHeaders = _ref3.headers,
          body = _ref3.body,
          signal = _ref3.signal;
      var url = buildUrl({
        pathname: pathname,
        query: query
      })(apiUrl);

      var fetchOptions = _extends({
        method: method,
        headers: _extends({}, generalHeaders, endpointHeaders, {
          'Accept-Version': apiVersion
        }, isDefined(accessKey) ? {
          Authorization: "Client-ID " + accessKey
        } : {}),
        body: body,
        signal: signal
      }, generalFetchOptions);

      var fetchToUse = providedFetch != null ? providedFetch : fetch;
      return fetchToUse(url, fetchOptions).then(handleFetchResponse(handleResponse));
    });
  };
};

var TOTAL_RESPONSE_HEADER = 'x-total';

var getTotalFromApiFeedResponse = function getTotalFromApiFeedResponse(response) {
  var totalsStr = response.headers.get(TOTAL_RESPONSE_HEADER);

  if (isDefined(totalsStr)) {
    var total = parseInt(totalsStr);

    if (Number.isInteger(total)) {
      return total;
    } else {
      throw new DecodingError("expected " + TOTAL_RESPONSE_HEADER + " header to be valid integer.");
    }
  } else {
    throw new DecodingError("expected " + TOTAL_RESPONSE_HEADER + " header to exist.");
  }
};

var handleFeedResponse = function handleFeedResponse() {
  return function (_ref) {
    var response = _ref.response;
    return castResponse()({
      response: response
    }).then(function (results) {
      return {
        results: results,
        total: getTotalFromApiFeedResponse(response)
      };
    });
  };
};

var getCollections = function getCollections(collectionIds) {
  return isDefined(collectionIds) ? {
    collections: collectionIds.join()
  } : {};
};
var getTopics = function getTopics(topicIds) {
  return isDefined(topicIds) ? {
    topics: topicIds.join()
  } : {};
};
var getFeedParams = function getFeedParams(_ref) {
  var page = _ref.page,
      perPage = _ref.perPage,
      orderBy = _ref.orderBy;
  return compactDefined({
    per_page: perPage,
    order_by: orderBy,
    page: page
  });
};

var COLLECTIONS_PATH_PREFIX = '/collections';
var getPhotos = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref) {
    var collectionId = _ref.collectionId;
    return COLLECTIONS_PATH_PREFIX + "/" + collectionId + "/photos";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref2) {
      var collectionId = _ref2.collectionId,
          orientation = _ref2.orientation,
          paginationParams = _objectWithoutPropertiesLoose(_ref2, ["collectionId", "orientation"]);

      return {
        pathname: getPathname({
          collectionId: collectionId
        }),
        query: compactDefined(_extends({}, getFeedParams(paginationParams), {
          orientation: orientation
        }))
      };
    }),
    handleResponse: handleFeedResponse()
  });
}();
var get = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref3) {
    var collectionId = _ref3.collectionId;
    return COLLECTIONS_PATH_PREFIX + "/" + collectionId;
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref4) {
      var collectionId = _ref4.collectionId;
      return {
        pathname: getPathname({
          collectionId: collectionId
        }),
        query: {}
      };
    }),
    handleResponse: castResponse()
  });
}();
var list = /*#__PURE__*/function () {
  var getPathname = function getPathname() {
    return COLLECTIONS_PATH_PREFIX;
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (paginationParams) {
      if (paginationParams === void 0) {
        paginationParams = {};
      }

      return {
        pathname: getPathname(),
        query: getFeedParams(paginationParams)
      };
    }),
    handleResponse: handleFeedResponse()
  });
}();
var getRelated = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref5) {
    var collectionId = _ref5.collectionId;
    return COLLECTIONS_PATH_PREFIX + "/" + collectionId + "/related";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref6) {
      var collectionId = _ref6.collectionId;
      return {
        pathname: getPathname({
          collectionId: collectionId
        }),
        query: {}
      };
    }),
    handleResponse: castResponse()
  });
}();

var index = {
  __proto__: null,
  getPhotos: getPhotos,
  get: get,
  list: list,
  getRelated: getRelated
};

var PHOTOS_PATH_PREFIX = '/photos';
var list$1 = /*#__PURE__*/function () {
  var _getPathname = function getPathname() {
    return PHOTOS_PATH_PREFIX;
  };

  return makeEndpoint({
    // Wrapper uses type trick to allow 0 args
    getPathname: function getPathname(_params) {
      return _getPathname();
    },
    handleRequest: createRequestHandler(function (feedParams) {
      if (feedParams === void 0) {
        feedParams = {};
      }

      return {
        pathname: PHOTOS_PATH_PREFIX,
        query: compactDefined(getFeedParams(feedParams))
      };
    }),
    handleResponse: handleFeedResponse()
  });
}();
var get$1 = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref) {
    var photoId = _ref.photoId;
    return PHOTOS_PATH_PREFIX + "/" + photoId;
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref2) {
      var photoId = _ref2.photoId;
      return {
        pathname: getPathname({
          photoId: photoId
        }),
        query: {}
      };
    }),
    handleResponse: castResponse()
  });
}();
var getStats = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref3) {
    var photoId = _ref3.photoId;
    return PHOTOS_PATH_PREFIX + "/" + photoId + "/statistics";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref4) {
      var photoId = _ref4.photoId;
      return {
        pathname: getPathname({
          photoId: photoId
        }),
        query: {}
      };
    }),
    handleResponse: castResponse()
  });
}();
var getRandom = /*#__PURE__*/function () {
  var getPathname = function getPathname() {
    return PHOTOS_PATH_PREFIX + "/random";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_temp) {
      var _ref5 = _temp === void 0 ? {} : _temp,
          collectionIds = _ref5.collectionIds,
          contentFilter = _ref5.contentFilter,
          topicIds = _ref5.topicIds,
          queryParams = _objectWithoutPropertiesLoose(_ref5, ["collectionIds", "contentFilter", "topicIds"]);

      return {
        pathname: getPathname(),
        query: compactDefined(_extends({}, queryParams, {
          content_filter: contentFilter
        }, getCollections(collectionIds), getTopics(topicIds))),
        headers: {
          /**
           * Avoid response caching
           */
          'cache-control': 'no-cache'
        }
      };
    }),
    handleResponse: castResponse()
  });
}();
var trackDownload = {
  handleRequest: /*#__PURE__*/createRequestHandler(function (_ref6) {
    var downloadLocation = _ref6.downloadLocation;

    var _parseQueryAndPathnam = parseQueryAndPathname(downloadLocation),
        pathname = _parseQueryAndPathnam.pathname,
        query = _parseQueryAndPathnam.query;

    if (!isDefined(pathname)) {
      throw new Error('Could not parse pathname from url.');
    }

    return {
      pathname: pathname,
      query: compactDefined(query)
    };
  }),
  handleResponse: /*#__PURE__*/castResponse()
};

var index$1 = {
  __proto__: null,
  list: list$1,
  get: get$1,
  getStats: getStats,
  getRandom: getRandom,
  trackDownload: trackDownload
};

var SEARCH_PATH_PREFIX = "/search";
var getPhotos$1 = /*#__PURE__*/function () {
  var _getPathname = function getPathname() {
    return SEARCH_PATH_PREFIX + "/photos";
  };

  return makeEndpoint({
    // Wrapper uses type trick to allow 0 args
    getPathname: function getPathname(_params) {
      return _getPathname();
    },
    handleRequest: createRequestHandler(function (_ref) {
      var query = _ref.query,
          page = _ref.page,
          perPage = _ref.perPage,
          orderBy = _ref.orderBy,
          collectionIds = _ref.collectionIds,
          lang = _ref.lang,
          contentFilter = _ref.contentFilter,
          filters = _objectWithoutPropertiesLoose(_ref, ["query", "page", "perPage", "orderBy", "collectionIds", "lang", "contentFilter"]);

      return {
        pathname: _getPathname(),
        query: compactDefined(_extends({
          query: query,
          content_filter: contentFilter,
          lang: lang,
          order_by: orderBy
        }, getFeedParams({
          page: page,
          perPage: perPage
        }), getCollections(collectionIds), filters))
      };
    }),
    handleResponse: castResponse()
  });
}();
var getCollections$1 = /*#__PURE__*/function () {
  var _getPathname2 = function getPathname() {
    return SEARCH_PATH_PREFIX + "/collections";
  };

  return makeEndpoint({
    // Wrapper uses type trick to allow 0 args
    getPathname: function getPathname(_params) {
      return _getPathname2();
    },
    handleRequest: createRequestHandler(function (_ref2) {
      var query = _ref2.query,
          paginationParams = _objectWithoutPropertiesLoose(_ref2, ["query"]);

      return {
        pathname: _getPathname2(),
        query: _extends({
          query: query
        }, getFeedParams(paginationParams))
      };
    }),
    handleResponse: castResponse()
  });
}();
var getUsers = /*#__PURE__*/function () {
  var _getPathname3 = function getPathname() {
    return SEARCH_PATH_PREFIX + "/users";
  };

  return makeEndpoint({
    // Wrapper uses type trick to allow 0 args
    getPathname: function getPathname(_params) {
      return _getPathname3();
    },
    handleRequest: createRequestHandler(function (_ref3) {
      var query = _ref3.query,
          paginationParams = _objectWithoutPropertiesLoose(_ref3, ["query"]);

      return {
        pathname: _getPathname3(),
        query: _extends({
          query: query
        }, getFeedParams(paginationParams))
      };
    }),
    handleResponse: castResponse()
  });
}();

var index$2 = {
  __proto__: null,
  getPhotos: getPhotos$1,
  getCollections: getCollections$1,
  getUsers: getUsers
};

var USERS_PATH_PREFIX = '/users';
var get$2 = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref) {
    var username = _ref.username;
    return USERS_PATH_PREFIX + "/" + username;
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref2) {
      var username = _ref2.username;
      return {
        pathname: getPathname({
          username: username
        }),
        query: {}
      };
    }),
    handleResponse: castResponse()
  });
}();
var getPhotos$2 = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref3) {
    var username = _ref3.username;
    return USERS_PATH_PREFIX + "/" + username + "/photos";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref4) {
      var username = _ref4.username,
          stats = _ref4.stats,
          orientation = _ref4.orientation,
          paginationParams = _objectWithoutPropertiesLoose(_ref4, ["username", "stats", "orientation"]);

      return {
        pathname: getPathname({
          username: username
        }),
        query: compactDefined(_extends({}, getFeedParams(paginationParams), {
          orientation: orientation,
          stats: stats
        }))
      };
    }),
    handleResponse: handleFeedResponse()
  });
}();
var getLikes = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref5) {
    var username = _ref5.username;
    return USERS_PATH_PREFIX + "/" + username + "/likes";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref6) {
      var username = _ref6.username,
          orientation = _ref6.orientation,
          paginationParams = _objectWithoutPropertiesLoose(_ref6, ["username", "orientation"]);

      return {
        pathname: getPathname({
          username: username
        }),
        query: compactDefined(_extends({}, getFeedParams(paginationParams), {
          orientation: orientation
        }))
      };
    }),
    handleResponse: handleFeedResponse()
  });
}();
var getCollections$2 = /*#__PURE__*/function () {
  var getPathname = function getPathname(_ref7) {
    var username = _ref7.username;
    return USERS_PATH_PREFIX + "/" + username + "/collections";
  };

  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: createRequestHandler(function (_ref8) {
      var username = _ref8.username,
          paginationParams = _objectWithoutPropertiesLoose(_ref8, ["username"]);

      return {
        pathname: getPathname({
          username: username
        }),
        query: getFeedParams(paginationParams)
      };
    }),
    handleResponse: handleFeedResponse()
  });
}();

var index$3 = {
  __proto__: null,
  get: get$2,
  getPhotos: getPhotos$2,
  getLikes: getLikes,
  getCollections: getCollections$2
};

var BASE_TOPIC_PATH = '/topics';

var getTopicPath = function getTopicPath(_ref) {
  var topicIdOrSlug = _ref.topicIdOrSlug;
  return BASE_TOPIC_PATH + "/" + topicIdOrSlug;
};

var list$2 = /*#__PURE__*/makeEndpoint({
  getPathname: getTopicPath,
  handleRequest: function handleRequest(_ref2) {
    var page = _ref2.page,
        perPage = _ref2.perPage,
        orderBy = _ref2.orderBy,
        topicIdsOrSlugs = _ref2.topicIdsOrSlugs;
    return {
      pathname: BASE_TOPIC_PATH,
      query: compactDefined(_extends({}, getFeedParams({
        page: page,
        perPage: perPage
      }), {
        ids: topicIdsOrSlugs == null ? void 0 : topicIdsOrSlugs.join(','),
        order_by: orderBy
      }))
    };
  },
  handleResponse: /*#__PURE__*/handleFeedResponse()
});
var get$3 = /*#__PURE__*/makeEndpoint({
  getPathname: getTopicPath,
  handleRequest: function handleRequest(_ref3) {
    var topicIdOrSlug = _ref3.topicIdOrSlug;
    return {
      pathname: getTopicPath({
        topicIdOrSlug: topicIdOrSlug
      }),
      query: {}
    };
  },
  handleResponse: /*#__PURE__*/castResponse()
});
var getPhotos$3 = /*#__PURE__*/function () {
  var getPathname = /*#__PURE__*/flow(getTopicPath, function (topicPath) {
    return topicPath + "/photos";
  });
  return makeEndpoint({
    getPathname: getPathname,
    handleRequest: function handleRequest(_ref4) {
      var topicIdOrSlug = _ref4.topicIdOrSlug,
          orientation = _ref4.orientation,
          feedParams = _objectWithoutPropertiesLoose(_ref4, ["topicIdOrSlug", "orientation"]);

      return {
        pathname: getPathname({
          topicIdOrSlug: topicIdOrSlug
        }),
        query: compactDefined(_extends({}, getFeedParams(feedParams), {
          orientation: orientation
        }))
      };
    },
    handleResponse: handleFeedResponse()
  });
}();

var index$4 = {
  __proto__: null,
  list: list$2,
  get: get$3,
  getPhotos: getPhotos$3
};

var trackNonHotLinkedPhotoView = function trackNonHotLinkedPhotoView(_ref) {
  var appId = _ref.appId;
  return function (_ref2) {
    var photoId = _ref2.photoId;
    var ids = !Array.isArray(photoId) ? [photoId] : photoId;

    if (ids.length > 20) {
      throw new Error('You cannot track more than 20 photos at once. Please try again with fewer photos.');
    }

    return fetch("views.unsplash.com/v?photo_id=" + ids.join() + "&app_id=" + appId);
  };
};



var internals = {
  __proto__: null,
  collections: index,
  photos: index$1,
  search: index$2,
  users: index$3,
  topics: index$4,
  trackNonHotLinkedPhotoView: trackNonHotLinkedPhotoView
};

(function (Language) {
  Language["Afrikaans"] = "af";
  Language["Amharic"] = "am";
  Language["Arabic"] = "ar";
  Language["Azerbaijani"] = "az";
  Language["Belarusian"] = "be";
  Language["Bulgarian"] = "bg";
  Language["Bengali"] = "bn";
  Language["Bosnian"] = "bs";
  Language["Catalan"] = "ca";
  Language["Cebuano"] = "ceb";
  Language["Corsican"] = "co";
  Language["Czech"] = "cs";
  Language["Welsh"] = "cy";
  Language["Danish"] = "da";
  Language["German"] = "de";
  Language["Greek"] = "el";
  Language["English"] = "en";
  Language["Esperanto"] = "eo";
  Language["Spanish"] = "es";
  Language["Estonian"] = "et";
  Language["Basque"] = "eu";
  Language["Persian"] = "fa";
  Language["Finnish"] = "fi";
  Language["French"] = "fr";
  Language["Frisian"] = "fy";
  Language["Irish"] = "ga";
  Language["ScotsGaelic"] = "gd";
  Language["Galician"] = "gl";
  Language["Gujarati"] = "gu";
  Language["Hausa"] = "ha";
  Language["Hawaiian"] = "haw";
  Language["Hindi"] = "hi";
  Language["Hmong"] = "hmn";
  Language["Croatian"] = "hr";
  Language["HaitianCreole"] = "ht";
  Language["Hungarian"] = "hu";
  Language["Armenian"] = "hy";
  Language["Indonesian"] = "id";
  Language["Igbo"] = "ig";
  Language["Icelandic"] = "is";
  Language["Italian"] = "it";
  Language["Hebrew"] = "iw";
  Language["Japanese"] = "ja";
  Language["Javanese"] = "jw";
  Language["Georgian"] = "ka";
  Language["Kazakh"] = "kk";
  Language["Khmer"] = "km";
  Language["Kannada"] = "kn";
  Language["Korean"] = "ko";
  Language["Kurdish"] = "ku";
  Language["Kyrgyz"] = "ky";
  Language["Latin"] = "la";
  Language["Luxembourgish"] = "lb";
  Language["Lao"] = "lo";
  Language["Lithuanian"] = "lt";
  Language["Latvian"] = "lv";
  Language["Malagasy"] = "mg";
  Language["Maori"] = "mi";
  Language["Macedonian"] = "mk";
  Language["Malayalam"] = "ml";
  Language["Mongolian"] = "mn";
  Language["Marathi"] = "mr";
  Language["Malay"] = "ms";
  Language["Maltese"] = "mt";
  Language["Myanmar"] = "my";
  Language["Nepali"] = "ne";
  Language["Dutch"] = "nl";
  Language["Norwegian"] = "no";
  Language["Nyanja"] = "ny";
  Language["Oriya"] = "or";
  Language["Punjabi"] = "pa";
  Language["Polish"] = "pl";
  Language["Pashto"] = "ps";
  Language["Portuguese"] = "pt";
  Language["Romanian"] = "ro";
  Language["Russian"] = "ru";
  Language["Kinyarwanda"] = "rw";
  Language["Sindhi"] = "sd";
  Language["Sinhala"] = "si";
  Language["Slovak"] = "sk";
  Language["Slovenian"] = "sl";
  Language["Samoan"] = "sm";
  Language["Shona"] = "sn";
  Language["Somali"] = "so";
  Language["Albanian"] = "sq";
  Language["Serbian"] = "sr";
  Language["Sesotho"] = "st";
  Language["Sundanese"] = "su";
  Language["Swedish"] = "sv";
  Language["Swahili"] = "sw";
  Language["Tamil"] = "ta";
  Language["Telugu"] = "te";
  Language["Tajik"] = "tg";
  Language["Thai"] = "th";
  Language["Turkmen"] = "tk";
  Language["Filipino"] = "tl";
  Language["Turkish"] = "tr";
  Language["Tatar"] = "tt";
  Language["Uighur"] = "ug";
  Language["Ukrainian"] = "uk";
  Language["Urdu"] = "ur";
  Language["Uzbek"] = "uz";
  Language["Vietnamese"] = "vi";
  Language["Xhosa"] = "xh";
  Language["Yiddish"] = "yi";
  Language["Yoruba"] = "yo";
  Language["ChineseSimplified"] = "zh";
  Language["ChineseTraditional"] = "zh-TW";
  Language["Zulu"] = "zu";
})(exports.Language || (exports.Language = {}));

(function (OrderBy) {
  OrderBy["LATEST"] = "latest";
  OrderBy["POPULAR"] = "popular";
  OrderBy["VIEWS"] = "views";
  OrderBy["DOWNLOADS"] = "downloads";
  OrderBy["OLDEST"] = "oldest";
})(exports.OrderBy || (exports.OrderBy = {}));

var createApi = /*#__PURE__*/flow(initMakeRequest, function (makeRequest) {
  return {
    photos: {
      get: makeRequest(get$1),
      list: makeRequest(list$1),
      getStats: makeRequest(getStats),
      getRandom: makeRequest(getRandom),
      trackDownload: makeRequest(trackDownload)
    },
    users: {
      getPhotos: makeRequest(getPhotos$2),
      getCollections: makeRequest(getCollections$2),
      getLikes: makeRequest(getLikes),
      get: makeRequest(get$2)
    },
    search: {
      getCollections: makeRequest(getCollections$1),
      getPhotos: makeRequest(getPhotos$1),
      getUsers: makeRequest(getUsers)
    },
    collections: {
      getPhotos: makeRequest(getPhotos),
      get: makeRequest(get),
      list: makeRequest(list),
      getRelated: makeRequest(getRelated)
    },
    topics: {
      list: makeRequest(list$2),
      get: makeRequest(get$3),
      getPhotos: makeRequest(getPhotos$3)
    }
  };
});

exports._internals = internals;
exports.createApi = createApi;
//# sourceMappingURL=unsplash-js.cjs.development.js.map
