// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== undefined) {
    if (Array.isArray(form[key])) {
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    form[key] = value;
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1;i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1;j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", 8);
  let i = start;
  for (;i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? undefined : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p.at(-1) === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
};
var checkOptionalParameter = (path) => {
  if (!path.match(/\:.+\?$/)) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? undefined : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? undefined : nextKeyIndex : valueIndex);
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? undefined : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : undefined;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name.toLowerCase()) ?? undefined;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw[key]();
  };
  json() {
    return this.#cachedBody("json");
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = (headers, map = {}) => {
  for (const key of Object.keys(map)) {
    headers.set(key, map[key]);
  }
  return headers;
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status = 200;
  #executionCtx;
  #headers;
  #preparedHeaders;
  #res;
  #isFresh = true;
  #layout;
  #renderer;
  #notFoundHandler;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    this.#isFresh = false;
    return this.#res ||= new Response("404 Not Found", { status: 404 });
  }
  set res(_res) {
    this.#isFresh = false;
    if (this.#res && _res) {
      try {
        for (const [k, v] of this.#res.headers.entries()) {
          if (k === "content-type") {
            continue;
          }
          if (k === "set-cookie") {
            const cookies = this.#res.headers.getSetCookie();
            _res.headers.delete("set-cookie");
            for (const cookie of cookies) {
              _res.headers.append("set-cookie", cookie);
            }
          } else {
            _res.headers.set(k, v);
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes("immutable")) {
          this.res = new Response(_res.body, {
            headers: _res.headers,
            status: _res.status
          });
          return;
        } else {
          throw e;
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (value === undefined) {
      if (this.#headers) {
        this.#headers.delete(name);
      } else if (this.#preparedHeaders) {
        delete this.#preparedHeaders[name.toLocaleLowerCase()];
      }
      if (this.finalized) {
        this.res.headers.delete(name);
      }
      return;
    }
    if (options?.append) {
      if (!this.#headers) {
        this.#isFresh = false;
        this.#headers = new Headers(this.#preparedHeaders);
        this.#preparedHeaders = {};
      }
      this.#headers.append(name, value);
    } else {
      if (this.#headers) {
        this.#headers.set(name, value);
      } else {
        this.#preparedHeaders ??= {};
        this.#preparedHeaders[name.toLowerCase()] = value;
      }
    }
    if (this.finalized) {
      if (options?.append) {
        this.res.headers.append(name, value);
      } else {
        this.res.headers.set(name, value);
      }
    }
  };
  status = (status) => {
    this.#isFresh = false;
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map;
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : undefined;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    if (this.#isFresh && !headers && !arg && this.#status === 200) {
      return new Response(data, {
        headers: this.#preparedHeaders
      });
    }
    if (arg && typeof arg !== "number") {
      const header = new Headers(arg.headers);
      if (this.#headers) {
        this.#headers.forEach((v, k) => {
          if (k === "set-cookie") {
            header.append(k, v);
          } else {
            header.set(k, v);
          }
        });
      }
      const headers2 = setHeaders(header, this.#preparedHeaders);
      return new Response(data, {
        headers: headers2,
        status: arg.status ?? this.#status
      });
    }
    const status = typeof arg === "number" ? arg : this.#status;
    this.#preparedHeaders ??= {};
    this.#headers ??= new Headers;
    setHeaders(this.#headers, this.#preparedHeaders);
    if (this.#res) {
      this.#res.headers.forEach((v, k) => {
        if (k === "set-cookie") {
          this.#headers?.append(k, v);
        } else {
          this.#headers?.set(k, v);
        }
      });
      setHeaders(this.#headers, this.#preparedHeaders);
    }
    headers ??= {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        this.#headers.set(k, v);
      } else {
        this.#headers.delete(k);
        for (const v2 of v) {
          this.#headers.append(k, v2);
        }
      }
    }
    return new Response(data, {
      status,
      headers: this.#headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => {
    return typeof arg === "number" ? this.#newResponse(data, arg, headers) : this.#newResponse(data, arg);
  };
  text = (text, arg, headers) => {
    if (!this.#preparedHeaders) {
      if (this.#isFresh && !headers && !arg) {
        return new Response(text);
      }
      this.#preparedHeaders = {};
    }
    this.#preparedHeaders["content-type"] = TEXT_PLAIN;
    if (typeof arg === "number") {
      return this.#newResponse(text, arg, headers);
    }
    return this.#newResponse(text, arg);
  };
  json = (object, arg, headers) => {
    const body = JSON.stringify(object);
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "application/json";
    return typeof arg === "number" ? this.#newResponse(body, arg, headers) : this.#newResponse(body, arg);
  };
  html = (html, arg, headers) => {
    this.#preparedHeaders ??= {};
    this.#preparedHeaders["content-type"] = "text/html; charset=UTF-8";
    if (typeof html === "object") {
      return resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then((html2) => {
        return typeof arg === "number" ? this.#newResponse(html2, arg, headers) : this.#newResponse(html2, arg);
      });
    }
    return typeof arg === "number" ? this.#newResponse(html, arg, headers) : this.#newResponse(html, arg);
  };
  redirect = (location, status) => {
    this.#headers ??= new Headers;
    this.#headers.set("Location", String(location));
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response;
    return this.#notFoundHandler(this);
  };
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    const isContext = context instanceof Context;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        if (isContext) {
          context.req.routeIndex = i;
        }
      } else {
        handler = i === middleware.length && next || undefined;
      }
      if (!handler) {
        if (isContext && context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      } else {
        try {
          res = await handler(context, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && isContext && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    return err.getResponse();
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app) {
    const subApp = this.basePath(path);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = undefined;
      try {
        executionContext = c.executionCtx;
      } catch {}
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, undefined, event.request.method));
    });
  };
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== undefined) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some((k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node;
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some((k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node;
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node;
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0;; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1;i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1;j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== undefined) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== undefined) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(path === "*" ? "" : `^${path.replace(/\/\*$|([.\\+*[^\]$()])/g, (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)")}$`);
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie;
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map((route) => [!/\*|\/:/.test(route[0]), ...route]).sort(([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length);
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length;i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (;paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length;i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length;j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length;k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach((p) => re.test(p) && routes[m][p].push([handler, paramCount]));
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length;i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = undefined;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]]));
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (;i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length;i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = undefined;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length;i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.#children).includes(p)) {
        curNode = curNode.#children[p];
        const pattern2 = getPattern(p);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.#children[p] = new Node2;
      const pattern = getPattern(p);
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[p];
    }
    const m = /* @__PURE__ */ Object.create(null);
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      score: this.#order
    };
    m[method] = handlerSet;
    curNode.#methods.push(m);
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length;i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== undefined) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length;i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length;i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length;j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(...this.#getHandlerSets(nextNode.#children["*"], method, node.#params));
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length;k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
            continue;
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(...this.#getHandlerSets(child.#children["*"], method, params, node.#params));
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2;
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length;i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter, new TrieRouter]
    });
  }
};

// src/index.ts
import { dirname, join as join3 } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync as readFileSync3 } from "node:fs";

// src/routes/health.ts
var health = new Hono2;
var startTime = Date.now();
var VERSION = "0.1.0";
health.get("/", (c) => {
  const response = {
    success: true,
    data: {
      status: "ok",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: VERSION
    }
  };
  return c.json(response);
});
// src/db/index.ts
import Database from "bun:sqlite";
import { join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

// src/db/migrations.ts
var migrations = [
  {
    name: "001_initial_schema",
    up: `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        transcript_path TEXT NOT NULL,
        cwd TEXT NOT NULL,
        project_name TEXT,
        git_branch TEXT,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        is_bookmarked BOOLEAN DEFAULT FALSE,
        bookmark_note TEXT,
        summary TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        uuid TEXT UNIQUE,
        type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
        content TEXT,
        model TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        session_count INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        total_input_tokens INTEGER DEFAULT 0,
        total_output_tokens INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_is_bookmarked ON sessions(is_bookmarked);
    `
  },
  {
    name: "002_add_migrations_table",
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: "003_add_fts_search",
    up: `
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        session_id UNINDEXED,
        type UNINDEXED,
        timestamp UNINDEXED,
        tokenize='porter unicode61'
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
        summary,
        bookmark_note,
        id UNINDEXED,
        project_name UNINDEXED,
        started_at UNINDEXED,
        tokenize='porter unicode61'
      );

      CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
        INSERT INTO messages_fts(rowid, content, session_id, type, timestamp)
        VALUES (new.id, new.content, new.session_id, new.type, new.timestamp);
      END;

      CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
        DELETE FROM messages_fts WHERE rowid = old.id;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
        UPDATE messages_fts SET content = new.content
        WHERE rowid = old.id;
      END;

      CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
        INSERT INTO sessions_fts(rowid, summary, bookmark_note, id, project_name, started_at)
        VALUES (new.rowid, new.summary, new.bookmark_note, new.id, new.project_name, new.started_at);
      END;

      CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
        UPDATE sessions_fts 
        SET summary = new.summary, bookmark_note = new.bookmark_note
        WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS sessions_ad AFTER DELETE ON sessions BEGIN
        DELETE FROM sessions_fts WHERE rowid = old.rowid;
      END;

      INSERT INTO messages_fts(rowid, content, session_id, type, timestamp)
      SELECT id, content, session_id, type, timestamp FROM messages;

      INSERT INTO sessions_fts(rowid, summary, bookmark_note, id, project_name, started_at)
      SELECT rowid, summary, bookmark_note, id, project_name, started_at FROM sessions;
    `,
    down: `
      DROP TRIGGER IF EXISTS messages_ai;
      DROP TRIGGER IF EXISTS messages_ad;
      DROP TRIGGER IF EXISTS messages_au;
      DROP TRIGGER IF EXISTS sessions_ai;
      DROP TRIGGER IF EXISTS sessions_au;
      DROP TRIGGER IF EXISTS sessions_ad;
      DROP TABLE IF EXISTS messages_fts;
      DROP TABLE IF EXISTS sessions_fts;
    `
  },
  {
    name: "004_add_source_column",
    up: `
      ALTER TABLE sessions ADD COLUMN source TEXT DEFAULT 'claude';
    `,
    down: `
      ALTER TABLE sessions DROP COLUMN source;
    `
  },
  {
    name: "006_add_cost_tracking",
    up: `
      -- Model pricing table for cost calculation
      CREATE TABLE IF NOT EXISTS model_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_family TEXT NOT NULL UNIQUE,
        input_cost_per_mtok REAL NOT NULL,
        output_cost_per_mtok REAL NOT NULL,
        effective_date TEXT NOT NULL,
        notes TEXT
      );

      -- Current Claude pricing (2026-01 baseline)
      INSERT INTO model_pricing (model_family, input_cost_per_mtok, output_cost_per_mtok, effective_date, notes) VALUES
        ('opus-4-5', 15.00, 75.00, '2026-01-01', 'Claude Opus 4.5'),
        ('sonnet-4-5', 3.00, 15.00, '2026-01-01', 'Claude Sonnet 4.5'),
        ('haiku-3-5', 0.80, 4.00, '2026-01-01', 'Claude Haiku 3.5');

      -- Add cost columns to messages table
      ALTER TABLE messages ADD COLUMN input_cost REAL;
      ALTER TABLE messages ADD COLUMN output_cost REAL;
      ALTER TABLE messages ADD COLUMN is_estimated_cost BOOLEAN DEFAULT FALSE;

      -- Add cost columns to daily_stats table
      ALTER TABLE daily_stats ADD COLUMN total_input_cost REAL DEFAULT 0;
      ALTER TABLE daily_stats ADD COLUMN total_output_cost REAL DEFAULT 0;

      -- Index for pricing lookups
      CREATE INDEX IF NOT EXISTS idx_pricing_family ON model_pricing(model_family);

      -- Backfill existing message costs
      UPDATE messages
      SET
        input_cost = COALESCE(
          (SELECT (messages.input_tokens / 1000000.0) * mp.input_cost_per_mtok
           FROM model_pricing mp
           WHERE messages.model LIKE '%' || mp.model_family || '%'
           LIMIT 1),
          0
        ),
        output_cost = COALESCE(
          (SELECT (messages.output_tokens / 1000000.0) * mp.output_cost_per_mtok
           FROM model_pricing mp
           WHERE messages.model LIKE '%' || mp.model_family || '%'
           LIMIT 1),
          0
        ),
        is_estimated_cost = TRUE
      WHERE input_tokens IS NOT NULL OR output_tokens IS NOT NULL;

      -- Backfill daily_stats costs
      UPDATE daily_stats
      SET
        total_input_cost = (
          SELECT COALESCE(SUM(m.input_cost), 0)
          FROM messages m
          JOIN sessions s ON m.session_id = s.id
          WHERE date(s.started_at) = daily_stats.date
        ),
        total_output_cost = (
          SELECT COALESCE(SUM(m.output_cost), 0)
          FROM messages m
          JOIN sessions s ON m.session_id = s.id
          WHERE date(s.started_at) = daily_stats.date
        );
    `,
    down: `
      ALTER TABLE messages DROP COLUMN input_cost;
      ALTER TABLE messages DROP COLUMN output_cost;
      ALTER TABLE messages DROP COLUMN is_estimated_cost;
      ALTER TABLE daily_stats DROP COLUMN total_input_cost;
      ALTER TABLE daily_stats DROP COLUMN total_output_cost;
      DROP TABLE IF EXISTS model_pricing;
    `
  },
  {
    name: "005_add_insights",
    up: `
      -- Add session insights table
      CREATE TABLE IF NOT EXISTS session_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
        summary TEXT,
        key_learnings TEXT,      -- JSON array of strings
        problems_solved TEXT,     -- JSON array of strings
        code_patterns TEXT,       -- JSON array of strings
        technologies TEXT,        -- JSON array of strings
        difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_notes TEXT
      );

      -- Index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_insights_session ON session_insights(session_id);

      -- FTS for insights search
      CREATE VIRTUAL TABLE IF NOT EXISTS insights_fts USING fts5(
        summary,
        key_learnings,
        problems_solved,
        code_patterns,
        user_notes,
        insight_id UNINDEXED,
        session_id UNINDEXED,
        tokenize='porter unicode61'
      );

      -- Trigger to sync with FTS
      CREATE TRIGGER IF NOT EXISTS insights_ai AFTER INSERT ON session_insights BEGIN
        INSERT INTO insights_fts(rowid, summary, key_learnings, problems_solved, code_patterns, user_notes, insight_id, session_id)
        VALUES (new.id, new.summary, new.key_learnings, new.problems_solved, new.code_patterns, new.user_notes, new.id, new.session_id);
      END;

      CREATE TRIGGER IF NOT EXISTS insights_au AFTER UPDATE ON session_insights BEGIN
        UPDATE insights_fts
        SET summary = new.summary,
            key_learnings = new.key_learnings,
            problems_solved = new.problems_solved,
            code_patterns = new.code_patterns,
            user_notes = new.user_notes
        WHERE rowid = new.id;
      END;

      CREATE TRIGGER IF NOT EXISTS insights_ad AFTER DELETE ON session_insights BEGIN
        DELETE FROM insights_fts WHERE rowid = old.id;
      END;
    `,
    down: `
      DROP TRIGGER IF EXISTS insights_ad;
      DROP TRIGGER IF EXISTS insights_au;
      DROP TRIGGER IF EXISTS insights_ai;
      DROP TABLE IF EXISTS insights_fts;
      DROP TABLE IF EXISTS session_insights;
    `
  }
];
function getAppliedMigrations() {
  try {
    const stmt = db.prepare("SELECT name FROM migrations ORDER BY applied_at ASC");
    const rows = stmt.all();
    return rows.map((row) => row.name);
  } catch (e) {
    const error = e;
    if (error.message?.includes("no such table: migrations")) {
      return [];
    }
    throw e;
  }
}
function applyMigration(migration) {
  const transaction = db.transaction(() => {
    db.exec(migration.up);
    const stmt = db.prepare("INSERT INTO migrations (name) VALUES (?)");
    stmt.run(migration.name);
  });
  transaction();
}
function runMigrations() {
  const applied = getAppliedMigrations();
  const pending = migrations.filter((m) => !applied.includes(m.name));
  if (pending.length === 0) {
    console.log("No pending migrations");
    return;
  }
  console.log(`Running ${pending.length} migration(s)...`);
  for (const migration of pending) {
    console.log(`Applying migration: ${migration.name}`);
    applyMigration(migration);
  }
  console.log("Migrations completed");
}

// src/db/index.ts
var DATA_DIR = join(process.env.HOME || "~", ".ccd");
var DB_PATH = join(DATA_DIR, "ccd.db");
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}
var db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
runMigrations();

// src/db/queries.ts
import { randomUUID } from "node:crypto";

// src/db/query-builder.ts
class QueryBuilder {
  query;
  params;
  constructor(baseQuery) {
    this.query = baseQuery;
    this.params = [];
  }
  where(conditions, params) {
    if (conditions.length > 0) {
      this.query += ` WHERE ${conditions.join(" AND ")}`;
      this.params.push(...params);
    }
    return this;
  }
  orderBy(order) {
    this.query += ` ORDER BY ${order}`;
    return this;
  }
  limit(limit, offset) {
    if (limit) {
      this.query += " LIMIT ?";
      this.params.push(limit);
    }
    if (offset) {
      this.query += " OFFSET ?";
      this.params.push(offset);
    }
    return this;
  }
  build() {
    return {
      query: this.query,
      params: this.params
    };
  }
  static buildSessionQuery(options) {
    const conditions = [];
    const params = [];
    if (options.date) {
      conditions.push("date(started_at) = ?");
      params.push(options.date);
    } else if (options.from) {
      conditions.push("date(started_at) >= ?");
      params.push(options.from);
      if (options.to) {
        conditions.push("date(started_at) <= ?");
        params.push(options.to);
      }
    }
    if (options.project) {
      conditions.push("project_name = ?");
      params.push(options.project);
    }
    if (options.bookmarkedOnly) {
      conditions.push("is_bookmarked = 1");
    }
    const orderBy = options.bookmarkedFirst ? "is_bookmarked DESC, started_at DESC" : "started_at DESC";
    return new QueryBuilder("SELECT * FROM sessions").where(conditions, params).orderBy(orderBy).limit(options.limit, options.offset).build();
  }
  static buildDailyStatsQuery(options) {
    const params = [];
    if (options.project) {
      let query = `
        SELECT
          date(s.started_at) as date,
          COUNT(DISTINCT s.id) as session_count,
          COUNT(m.id) as message_count,
          COALESCE(SUM(m.input_tokens), 0) as total_input_tokens,
          COALESCE(SUM(m.output_tokens), 0) as total_output_tokens
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.project_name = ?`;
      params.push(options.project);
      const dateCondition = QueryBuilder.buildDateCondition(options);
      if (dateCondition.condition) {
        query += ` AND ${dateCondition.condition}`;
        params.push(...dateCondition.params);
      }
      query += " GROUP BY date(s.started_at) ORDER BY date(s.started_at) ASC";
      return { query, params };
    } else {
      const conditions = [];
      const dateCondition = QueryBuilder.buildDateCondition(options);
      if (dateCondition.condition) {
        conditions.push(dateCondition.condition);
        params.push(...dateCondition.params);
      }
      return new QueryBuilder("SELECT * FROM daily_stats").where(conditions, params).orderBy("date ASC").build();
    }
  }
  static buildDateCondition(options) {
    if (options.days) {
      return {
        condition: 'date >= date("now", "-" || ? || " days", "localtime")',
        params: [options.days]
      };
    } else if (options.from) {
      const conditions = [];
      const params = [];
      conditions.push("date >= ?");
      params.push(options.from);
      if (options.to) {
        conditions.push("date <= ?");
        params.push(options.to);
      }
      return {
        condition: conditions.join(" AND "),
        params
      };
    } else {
      return {
        condition: 'date >= date("now", "-7 days", "localtime")',
        params: []
      };
    }
  }
}

// src/db/transaction.ts
function withTransaction(operation, operationName) {
  const transaction = db.transaction(() => {
    try {
      const result = operation();
      if (operationName) {
        console.log(`[DB Transaction] ${operationName} completed successfully`);
      }
      return result;
    } catch (error) {
      console.error(`[DB Transaction] ${operationName || "Operation"} failed:`, error);
      throw error;
    }
  });
  return transaction();
}

// src/services/cost-service.ts
class CostService {
  static extractModelFamily(modelName) {
    if (!modelName)
      return null;
    const match = modelName.match(/(opus|sonnet|haiku)-(\d+-\d+)/i);
    return match ? match[0].toLowerCase() : null;
  }
  static getModelPricing(modelName) {
    const family = this.extractModelFamily(modelName);
    if (!family)
      return null;
    const stmt = db.prepare(`
      SELECT * FROM model_pricing
      WHERE model_family = ?
      ORDER BY effective_date DESC
      LIMIT 1
    `);
    return stmt.get(family);
  }
  static calculateCost(inputTokens, outputTokens, modelName) {
    const pricing = this.getModelPricing(modelName);
    if (!pricing) {
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }
    const inputCost = inputTokens / 1e6 * pricing.input_cost_per_mtok;
    const outputCost = outputTokens / 1e6 * pricing.output_cost_per_mtok;
    return {
      inputCost: Math.round(inputCost * 1e5) / 1e5,
      outputCost: Math.round(outputCost * 1e5) / 1e5,
      totalCost: Math.round((inputCost + outputCost) * 1e5) / 1e5
    };
  }
}

// src/db/queries.ts
function createSession(data) {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, transcript_path, cwd, project_name, git_branch, source, started_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(id) DO UPDATE SET
      transcript_path = excluded.transcript_path,
      cwd = excluded.cwd,
      project_name = excluded.project_name,
      git_branch = excluded.git_branch,
      source = excluded.source
    RETURNING *
  `);
  return stmt.get(data.session_id, data.transcript_path, data.cwd, data.project_name || null, data.git_branch || null, data.source || "claude");
}
function getSession(id) {
  const stmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
  return stmt.get(id);
}
function getSessions(options) {
  const { query, params } = QueryBuilder.buildSessionQuery(options);
  const stmt = db.prepare(query);
  return stmt.all(...params);
}
function getTodaySessions() {
  const stmt = db.prepare(`
    SELECT * FROM sessions
    WHERE date(started_at) = date('now', 'localtime')
    ORDER BY is_bookmarked DESC, started_at DESC
  `);
  return stmt.all();
}
function endSession(id) {
  const stmt = db.prepare(`
    UPDATE sessions SET ended_at = datetime('now', 'localtime')
    WHERE id = ?
    RETURNING *
  `);
  return stmt.get(id);
}
function toggleBookmark(id, note) {
  const session = getSession(id);
  if (!session)
    return null;
  const stmt = db.prepare(`
    UPDATE sessions
    SET is_bookmarked = ?, bookmark_note = ?
    WHERE id = ?
    RETURNING *
  `);
  return stmt.get(!session.is_bookmarked, note || session.bookmark_note || null, id);
}
function deleteSession(id) {
  const session = getSession(id);
  if (!session)
    return false;
  return withTransaction(() => {
    const deleteMessagesStmt = db.prepare("DELETE FROM messages WHERE session_id = ?");
    const deleteSessionStmt = db.prepare("DELETE FROM sessions WHERE id = ?");
    deleteMessagesStmt.run(id);
    deleteSessionStmt.run(id);
    return true;
  }, `Delete session ${id}`);
}
function updateSessionSummary(id, summary) {
  const stmt = db.prepare(`
    UPDATE sessions
    SET summary = ?
    WHERE id = ? AND summary IS NULL
    RETURNING *
  `);
  return stmt.get(summary, id);
}
function createMessage(data) {
  const cost = CostService.calculateCost(data.input_tokens || 0, data.output_tokens || 0, data.model || null);
  const stmt = db.prepare(`
    INSERT INTO messages (
      session_id, uuid, type, content, model,
      input_tokens, output_tokens,
      input_cost, output_cost, is_estimated_cost,
      timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(uuid) DO UPDATE SET
      content = excluded.content,
      model = excluded.model,
      input_tokens = excluded.input_tokens,
      output_tokens = excluded.output_tokens,
      input_cost = excluded.input_cost,
      output_cost = excluded.output_cost
    RETURNING *
  `);
  const result = stmt.get(data.session_id, data.uuid || randomUUID(), data.type, data.content || null, data.model || null, data.input_tokens || null, data.output_tokens || null, cost.inputCost, cost.outputCost, false);
  updateDailyStats(data.input_tokens || 0, data.output_tokens || 0, cost.inputCost, cost.outputCost, true);
  return result;
}
function getMessages(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `);
  return stmt.all(sessionId);
}
function getMessageByUuid(uuid) {
  const stmt = db.prepare("SELECT * FROM messages WHERE uuid = ?");
  return stmt.get(uuid);
}
function getLocalDateString() {
  const now = new Date;
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function getTodayStats() {
  const today = getLocalDateString();
  const stmt = db.prepare("SELECT * FROM daily_stats WHERE date = ?");
  const result = stmt.get(today);
  if (!result) {
    return {
      date: today,
      session_count: 0,
      message_count: 0,
      total_input_tokens: 0,
      total_output_tokens: 0
    };
  }
  return result;
}
function updateDailyStats(inputTokens, outputTokens, inputCost, outputCost, incrementMessage) {
  const today = getLocalDateString();
  const insertStmt = db.prepare(`
    INSERT INTO daily_stats (
      date, session_count, message_count,
      total_input_tokens, total_output_tokens,
      total_input_cost, total_output_cost
    )
    VALUES (?, 0, 0, 0, 0, 0, 0)
    ON CONFLICT(date) DO NOTHING
  `);
  insertStmt.run(today);
  const updateStmt = db.prepare(`
    UPDATE daily_stats SET
      message_count = message_count + ?,
      total_input_tokens = total_input_tokens + ?,
      total_output_tokens = total_output_tokens + ?,
      total_input_cost = total_input_cost + ?,
      total_output_cost = total_output_cost + ?
    WHERE date = ?
  `);
  updateStmt.run(incrementMessage ? 1 : 0, inputTokens, outputTokens, inputCost, outputCost, today);
}
function incrementSessionCount() {
  const today = getLocalDateString();
  const stmt = db.prepare(`
    INSERT INTO daily_stats (date, session_count, message_count, total_input_tokens, total_output_tokens)
    VALUES (?, 1, 0, 0, 0)
    ON CONFLICT(date) DO UPDATE SET
      session_count = session_count + 1
  `);
  stmt.run(today);
}
function decrementSessionCount(date) {
  const targetDate = date || getLocalDateString();
  const stmt = db.prepare(`
    UPDATE daily_stats
    SET session_count = MAX(0, session_count - 1)
    WHERE date = ?
  `);
  stmt.run(targetDate);
}
function cleanEmptySessions() {
  const findEmptySessionsStmt = db.prepare(`
    SELECT id, date(started_at) as date
    FROM sessions
    WHERE id NOT IN (SELECT DISTINCT session_id FROM messages)
  `);
  const emptySessions = findEmptySessionsStmt.all();
  const deleted = [];
  const dates = [];
  const deleteSessionStmt = db.prepare("DELETE FROM sessions WHERE id = ?");
  withTransaction(() => {
    for (const session of emptySessions) {
      deleteSessionStmt.run(session.id);
      deleted.push(session.id);
      if (!dates.includes(session.date)) {
        dates.push(session.date);
      }
    }
  }, `Clean ${emptySessions.length} empty sessions`);
  for (const date of dates) {
    decrementSessionCount(date);
  }
  return { deleted, sessions: dates };
}
function getDailyStats(options) {
  const { query, params } = QueryBuilder.buildDailyStatsQuery(options);
  const stmt = db.prepare(query);
  return stmt.all(...params);
}
function bulkInsertMessages(messages) {
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM messages WHERE session_id = ?");
  const sessionId = messages[0]?.session_id;
  if (!sessionId)
    return 0;
  const beforeCount = countStmt.get(sessionId)?.count || 0;
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, uuid, type, content, model, input_tokens, output_tokens, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(uuid) DO NOTHING
  `);
  withTransaction(() => {
    for (const msg of messages) {
      stmt.run(msg.session_id, msg.uuid || null, msg.type, msg.content || null, msg.model || null, msg.input_tokens || null, msg.output_tokens || null);
    }
  }, `Bulk insert ${messages.length} messages for session ${sessionId}`);
  const afterCount = countStmt.get(sessionId)?.count || 0;
  return afterCount - beforeCount;
}
function searchSessions(options) {
  const filters = [];
  const params = [options.query, options.query];
  if (options.from) {
    filters.push("date(s.started_at) >= ?");
    params.push(options.from);
  }
  if (options.to) {
    filters.push("date(s.started_at) <= ?");
    params.push(options.to);
  }
  if (options.project) {
    filters.push("s.project_name = ?");
    params.push(options.project);
  }
  if (options.bookmarkedOnly) {
    filters.push("s.is_bookmarked = 1");
  }
  const filterClause = filters.length > 0 ? " AND " + filters.join(" AND ") : "";
  const query = `
    WITH message_results AS (
      SELECT
        m.id as message_id,
        m.session_id,
        m.content,
        m.type,
        messages_fts.rank as score,
        m.timestamp,
        snippet(messages_fts, 0, '<mark>', '</mark>', '...', 30) as snippet,
        'message' as result_type
      FROM messages_fts
      JOIN messages m ON messages_fts.content = m.content AND messages_fts.session_id = m.session_id
      WHERE messages_fts MATCH ?
    ),
    session_results AS (
      SELECT
        NULL as message_id,
        sessions_fts.id as session_id,
        COALESCE(sessions_fts.summary, sessions_fts.bookmark_note, '') as content,
        NULL as type,
        sessions_fts.rank as score,
        sessions_fts.started_at as timestamp,
        snippet(sessions_fts, 0, '<mark>', '</mark>', '...', 30) as snippet,
        CASE
          WHEN sessions_fts.summary IS NOT NULL THEN 'session_summary'
          WHEN sessions_fts.bookmark_note IS NOT NULL THEN 'bookmark_note'
          ELSE 'unknown'
        END as result_type
      FROM sessions_fts
      JOIN sessions s ON sessions_fts.id = s.id
      WHERE sessions_fts MATCH ?
    )
    SELECT
      mr.session_id,
      mr.message_id,
      mr.content,
      mr.snippet,
      mr.result_type as type,
      mr.score,
      mr.timestamp,
      s.project_name,
      s.is_bookmarked
    FROM message_results mr
    JOIN sessions s ON mr.session_id = s.id${filterClause}

    UNION ALL

    SELECT
      sr.session_id,
      sr.message_id,
      sr.content,
      sr.snippet,
      sr.result_type as type,
      sr.score,
      sr.timestamp,
      s.project_name,
      s.is_bookmarked
    FROM session_results sr
    JOIN sessions s ON sr.session_id = s.id${filterClause}
  LIMIT ?
  `;
  params.push((options.limit || 20) * 2);
  const results = db.prepare(query).all(...params);
  return results.sort((a, b) => {
    const scoreA = a.score * 0.7 + (a.is_bookmarked ? 0 : 1 * 0.2);
    const scoreB = b.score * 0.7 + (b.is_bookmarked ? 0 : 1 * 0.2);
    return scoreA - scoreB;
  }).slice(options.offset || 0, (options.offset || 0) + (options.limit || 20));
}
function getSessionInsight(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM session_insights
    WHERE session_id = ?
  `);
  return stmt.get(sessionId);
}
function createOrUpdateInsight(data) {
  const key_learnings = data.key_learnings ? JSON.stringify(data.key_learnings) : null;
  const problems_solved = data.problems_solved ? JSON.stringify(data.problems_solved) : null;
  const code_patterns = data.code_patterns ? JSON.stringify(data.code_patterns) : null;
  const technologies = data.technologies ? JSON.stringify(data.technologies) : null;
  const stmt = db.prepare(`
    INSERT INTO session_insights (
      session_id, summary, key_learnings, problems_solved,
      code_patterns, technologies, difficulty, user_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      summary = excluded.summary,
      key_learnings = excluded.key_learnings,
      problems_solved = excluded.problems_solved,
      code_patterns = excluded.code_patterns,
      technologies = excluded.technologies,
      difficulty = excluded.difficulty,
      user_notes = excluded.user_notes,
      generated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(data.session_id, data.summary || null, key_learnings, problems_solved, code_patterns, technologies, data.difficulty || null, data.user_notes || null);
  return getSessionInsight(data.session_id);
}
function updateInsightNotes(sessionId, notes) {
  createOrUpdateInsight({
    session_id: sessionId,
    user_notes: notes
  });
}
function deleteSessionInsight(sessionId) {
  const stmt = db.prepare(`
    DELETE FROM session_insights
    WHERE session_id = ?
  `);
  stmt.run(sessionId);
}
function getRecentInsights(limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM session_insights
    ORDER BY generated_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

// src/utils/errors.ts
class ApiError extends Error {
  statusCode;
  code;
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "ApiError";
  }
}
var Errors = {
  NotFound: (resource) => new ApiError(404, `${resource} not found`),
  BadRequest: (message) => new ApiError(400, message),
  ValidationError: (fields) => new ApiError(400, `Missing required fields: ${fields.join(", ")}`),
  InvalidType: (field, expected) => new ApiError(400, `${field} must be ${expected}`),
  InternalServerError: (message = "Unknown error") => new ApiError(500, message),
  DatabaseError: (operation) => new ApiError(500, `Database error during ${operation}`)
};
function validateStringEnum(value, validValues, fieldName) {
  if (!validValues.includes(value)) {
    throw Errors.InvalidType(fieldName, `"${validValues.join('" or "')}"`);
  }
}

// src/services/session-service.ts
class SessionService {
  static getSessions(options) {
    if (options.today) {
      return getTodaySessions();
    }
    return getSessions({
      date: options.date,
      from: options.from,
      to: options.to,
      project: options.project,
      limit: options.limit,
      offset: options.offset,
      bookmarkedFirst: options.bookmarkedFirst,
      bookmarkedOnly: options.bookmarkedOnly
    });
  }
  static createSession(data) {
    if (!data.session_id || !data.transcript_path || !data.cwd) {
      throw Errors.ValidationError(["session_id", "transcript_path", "cwd"]);
    }
    if (data.source) {
      validateStringEnum(data.source, ["claude", "opencode"], "source");
    }
    const session = createSession(data);
    incrementSessionCount();
    return session;
  }
  static getSession(id) {
    const session = getSession(id);
    if (!session) {
      throw Errors.NotFound("Session");
    }
    return session;
  }
  static endSession(id) {
    const session = endSession(id);
    if (!session) {
      throw Errors.NotFound("Session");
    }
    return session;
  }
  static toggleBookmark(id, note) {
    const session = toggleBookmark(id, note);
    if (!session) {
      throw Errors.NotFound("Session");
    }
    return session;
  }
  static deleteSession(id) {
    const session = getSession(id);
    if (!session) {
      throw Errors.NotFound("Session");
    }
    return deleteSession(id);
  }
  static updateSessionSummary(id, summary) {
    const session = updateSessionSummary(id, summary);
    if (!session) {
      throw Errors.NotFound("Session");
    }
    return session;
  }
  static getSessionMessages(id) {
    SessionService.getSession(id);
    return getMessages(id);
  }
  static cleanEmptySessions() {
    return cleanEmptySessions();
  }
}
// src/services/message-service.ts
class MessageService {
  static createMessage(data) {
    if (!data.session_id || !data.type) {
      throw Errors.ValidationError(["session_id", "type"]);
    }
    validateStringEnum(data.type, ["user", "assistant"], "type");
    return createMessage(data);
  }
  static getMessageByUuid(uuid) {
    const message = getMessageByUuid(uuid);
    if (!message) {
      throw Errors.NotFound("Message");
    }
    return message;
  }
}
// src/services/sync-service.ts
import { readFileSync, existsSync as existsSync2 } from "node:fs";
class SyncService {
  static extractTextFromContent(content) {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      return content.filter((block) => block.type === "text" && block.text).map((block) => block.text).join(`
`);
    }
    return "";
  }
  static parseTranscript(filePath) {
    if (!existsSync2(filePath)) {
      return [];
    }
    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split(`
`);
    const messages = [];
    for (const line of lines) {
      if (!line.trim())
        continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === "user" || msg.type === "assistant") {
          messages.push(msg);
        }
      } catch {}
    }
    return messages;
  }
  static syncTranscript(sessionId, transcriptPath) {
    const session = getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    const transcriptMessages = SyncService.parseTranscript(transcriptPath);
    const userMessageCount = transcriptMessages.filter((msg) => msg.type === "user").length;
    if (userMessageCount === 0) {
      const sessionDate = session.started_at.split(" ")[0];
      deleteSession(sessionId);
      decrementSessionCount(sessionDate);
      return {
        inserted: 0,
        total: transcriptMessages.length,
        deleted: true,
        reason: "no_user_messages"
      };
    }
    const messagesToInsert = transcriptMessages.map((msg) => ({
      session_id: sessionId,
      uuid: msg.uuid,
      type: msg.type === "user" ? "user" : "assistant",
      content: SyncService.extractTextFromContent(msg.message.content),
      model: msg.message.model,
      input_tokens: msg.message.usage?.input_tokens,
      output_tokens: msg.message.usage?.output_tokens
    })).filter((msg) => msg.content.trim() !== "");
    const inserted = bulkInsertMessages(messagesToInsert);
    const firstUserMessage = transcriptMessages.find((msg) => msg.type === "user");
    if (firstUserMessage && !session.summary) {
      const content = SyncService.extractTextFromContent(firstUserMessage.message.content);
      const summary = content.length > 100 ? content.slice(0, 97) + "..." : content;
      updateSessionSummary(sessionId, summary);
    }
    return {
      inserted,
      total: transcriptMessages.length
    };
  }
}
// src/utils/query-parsers.ts
function parseIntParam(value, defaultValue) {
  if (!value)
    return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
function parseBoolParam(value) {
  return value === "true";
}

// src/utils/responses.ts
function successResponse(data) {
  return {
    success: true,
    data
  };
}
function errorResponse(message) {
  return {
    success: false,
    error: message
  };
}
function apiErrorHandler() {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof ApiError) {
        const statusCode = error.statusCode === 400 ? 400 : error.statusCode === 404 ? 404 : error.statusCode === 500 ? 500 : 500;
        return c.json(errorResponse(error.message), statusCode);
      }
      console.error("[API Error]", error);
      return c.json(errorResponse("Internal server error"), 500);
    }
  };
}

// src/routes/sessions.ts
var sessions = new Hono2;
sessions.get("/", (c) => {
  const date = c.req.query("date");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const project = c.req.query("project");
  const limit = parseIntParam(c.req.query("limit"));
  const offset = parseIntParam(c.req.query("offset"));
  const today = parseBoolParam(c.req.query("today"));
  const bookmarkedOnly = parseBoolParam(c.req.query("bookmarkedOnly"));
  const bookmarkedFirst = parseBoolParam(c.req.query("bookmarkedFirst")) ?? true;
  const sessionList = SessionService.getSessions({
    date: date || undefined,
    from: from || undefined,
    to: to || undefined,
    project: project || undefined,
    limit,
    offset,
    bookmarkedFirst,
    bookmarkedOnly,
    today
  });
  return c.json(successResponse({
    sessions: sessionList,
    total: sessionList.length
  }));
});
sessions.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const session = SessionService.createSession(body);
    return c.json(successResponse(session), 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.get("/:id", (c) => {
  try {
    const id = c.req.param("id");
    const session = SessionService.getSession(id);
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.post("/:id/end", (c) => {
  try {
    const id = c.req.param("id");
    const session = SessionService.endSession(id);
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.post("/:id/summary", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const session = SessionService.updateSessionSummary(id, body.summary || "");
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.post("/:id/bookmark", async (c) => {
  try {
    const id = c.req.param("id");
    let note;
    try {
      const body = await c.req.json();
      note = body.note;
    } catch {}
    const session = SessionService.toggleBookmark(id, note);
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.delete("/:id", (c) => {
  try {
    const id = c.req.param("id");
    SessionService.deleteSession(id);
    return c.json(successResponse({ deleted: true }));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.post("/clean-empty", (c) => {
  try {
    const result = SessionService.cleanEmptySessions();
    return c.json(successResponse({
      deleted: result.deleted,
      count: result.deleted.length,
      affectedDates: result.sessions
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
sessions.get("/:id/messages", (c) => {
  try {
    const id = c.req.param("id");
    const messageList = SessionService.getSessionMessages(id);
    return c.json(successResponse(messageList));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
// src/routes/messages.ts
var messages = new Hono2;
messages.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const message = MessageService.createMessage(body);
    return c.json(successResponse(message), 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
messages.get("/:uuid", (c) => {
  try {
    const uuid = c.req.param("uuid");
    const message = MessageService.getMessageByUuid(uuid);
    return c.json(successResponse(message));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
// src/routes/stats.ts
var stats = new Hono2;
stats.get("/today", (c) => {
  const todayStats = getTodayStats();
  const todaySessions = getTodaySessions();
  const response = {
    success: true,
    data: {
      stats: todayStats,
      sessions: todaySessions
    }
  };
  return c.json(response);
});
stats.get("/daily", (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const days = c.req.query("days");
  const project = c.req.query("project");
  const options = {};
  if (days) {
    const parsedDays = Number.parseInt(days, 10);
    if (!Number.isNaN(parsedDays) && parsedDays > 0) {
      options.days = parsedDays;
    }
  } else if (from) {
    options.from = from;
    if (to) {
      options.to = to;
    }
  }
  if (project) {
    options.project = project;
  }
  const dailyStats = getDailyStats(options);
  const response = {
    success: true,
    data: dailyStats
  };
  return c.json(response);
});
// src/routes/sync.ts
var sync = new Hono2;
sync.post("/transcript", async (c) => {
  try {
    const body = await c.req.json();
    const result = SyncService.syncTranscript(body.session_id, body.transcript_path);
    if (result.deleted) {
      return c.json(successResponse({
        deleted: result.deleted,
        reason: result.reason
      }));
    }
    return c.json(successResponse({
      inserted: result.inserted,
      total: result.total
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode });
    }
    throw error;
  }
});
// src/routes/search.ts
var search = new Hono2;
search.get("/", (c) => {
  const query = c.req.query("q");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const project = c.req.query("project");
  const bookmarkedOnly = c.req.query("bookmarked") === "true";
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");
  if (!query || query.trim().length === 0) {
    return c.json({
      success: false,
      error: "Search query is required"
    }, 400);
  }
  const results = searchSessions({
    query: query.trim(),
    from: from || undefined,
    to: to || undefined,
    project: project || undefined,
    bookmarkedOnly,
    limit: limit ? parseInt(limit, 10) : 20,
    offset: offset ? parseInt(offset, 10) : 0
  });
  return c.json({
    success: true,
    data: results
  });
});
// src/routes/insights.ts
var insights = new Hono2;
insights.get("/:sessionId", (c) => {
  const sessionId = c.req.param("sessionId");
  const insight = getSessionInsight(sessionId);
  if (!insight) {
    return c.json({ success: false, error: "Insight not found" }, 404);
  }
  const parsed = {
    ...insight,
    key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
    problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
    code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
    technologies: insight.technologies ? JSON.parse(insight.technologies) : []
  };
  return c.json({ success: true, data: parsed });
});
insights.post("/", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.session_id) {
      return c.json({ success: false, error: "session_id is required" }, 400);
    }
    const insight = createOrUpdateInsight(body);
    const parsed = {
      ...insight,
      key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
      problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
      code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
      technologies: insight.technologies ? JSON.parse(insight.technologies) : []
    };
    return c.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error creating/updating insight:", error);
    return c.json({ success: false, error: "Failed to create/update insight" }, 500);
  }
});
insights.patch("/:sessionId/notes", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const body = await c.req.json();
    updateInsightNotes(sessionId, body.notes);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating notes:", error);
    return c.json({ success: false, error: "Failed to update notes" }, 500);
  }
});
insights.delete("/:sessionId", (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    deleteSessionInsight(sessionId);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting insight:", error);
    return c.json({ success: false, error: "Failed to delete insight" }, 500);
  }
});
insights.get("/recent/:limit?", (c) => {
  const limit = Number.parseInt(c.req.param("limit") || "10", 10);
  const recentInsights = getRecentInsights(limit);
  const parsed = recentInsights.map((insight) => ({
    ...insight,
    key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
    problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
    code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
    technologies: insight.technologies ? JSON.parse(insight.technologies) : []
  }));
  return c.json({ success: true, data: parsed });
});
// src/routes/daily-report.ts
var dailyReport = new Hono2;
dailyReport.get("/", (c) => {
  const dateParam = c.req.query("date");
  const targetDate = dateParam || new Date().toISOString().split("T")[0];
  const stats2 = getDailyStats({ from: targetDate, to: targetDate });
  const dailyStat = stats2[0] || {
    date: targetDate,
    session_count: 0,
    message_count: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_input_cost: 0,
    total_output_cost: 0
  };
  const sessions2 = getSessions({ date: targetDate });
  const sessionsWithInsights = sessions2.map((session) => {
    const insight = getSessionInsight(session.id);
    if (insight) {
      const parsedInsight = {
        ...insight,
        key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
        problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
        code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
        technologies: insight.technologies ? JSON.parse(insight.technologies) : []
      };
      return { ...session, insight: parsedInsight };
    }
    return { ...session, insight: null };
  });
  const bookmarkedCount = sessions2.filter((s) => s.is_bookmarked).length;
  const projects = [...new Set(sessions2.map((s) => s.project_name).filter((p) => p !== null))];
  const completedSessions = sessions2.filter((s) => s.ended_at !== null);
  let avgDuration = null;
  if (completedSessions.length > 0) {
    const totalMinutes = completedSessions.reduce((sum, s) => {
      const start = new Date(s.started_at).getTime();
      const end = new Date(s.ended_at).getTime();
      return sum + (end - start) / 1000 / 60;
    }, 0);
    avgDuration = Math.round(totalMinutes / completedSessions.length);
  }
  const response = {
    success: true,
    data: {
      date: targetDate,
      stats: dailyStat,
      sessions: sessionsWithInsights,
      summary: {
        total_sessions: sessions2.length,
        total_messages: dailyStat.message_count,
        total_tokens: dailyStat.total_input_tokens + dailyStat.total_output_tokens,
        total_cost: dailyStat.total_input_cost + dailyStat.total_output_cost,
        avg_session_duration: avgDuration,
        bookmarked_count: bookmarkedCount,
        projects
      }
    }
  };
  return c.json(response);
});
// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      if (opts.allowMethods?.length) {
        set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  };
};

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process: process2, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process2 !== undefined ? "NO_COLOR" in process2?.env : false;
  return !isNoColor;
}

// ../../node_modules/.pnpm/hono@4.6.17/node_modules/hono/dist/middleware/logger/index.js
var humanize = (times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
};
var time = (start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1000 ? delta + "ms" : Math.round(delta / 1000) + "s"]);
};
var colorStatus = (status) => {
  const colorEnabled = getColorEnabled();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
};
function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${colorStatus(status)} ${elapsed}`;
  fn(out);
}
var logger = (fn = console.log) => {
  return async function logger2(c, next) {
    const { method } = c.req;
    const path = getPath(c.req.raw);
    log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    log(fn, "-->", method, path, c.res.status, time(start));
  };
};

// src/routes/middleware/index.ts
function setupGlobalMiddleware(app) {
  app.use("*", cors());
  app.use("*", logger());
}
function setupApiMiddleware(app, performScheduledClean, resetIdleTimer) {
  app.use("/api/*", apiErrorHandler());
  app.use("/api/*", async (c, next) => {
    performScheduledClean();
    resetIdleTimer();
    await next();
  });
}
// ../../shared/types/src/constants.ts
var SERVER_PORT = 3847;
var DEFAULT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
var DEFAULT_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
// src/utils/timeout.ts
var timeoutId = null;
var lastActivity = Date.now();
function resetIdleTimer() {
  lastActivity = Date.now();
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    console.log("[CCD Server] Idle timeout reached. Shutting down...");
    process.exit(0);
  }, DEFAULT_IDLE_TIMEOUT_MS);
}
resetIdleTimer();

// src/utils/pid.ts
import { existsSync as existsSync3, readFileSync as readFileSync2, writeFileSync, unlinkSync } from "fs";
import { join as join2 } from "path";
var PID_FILE = join2(DATA_DIR, "server.pid");
function writePidFile() {
  writeFileSync(PID_FILE, process.pid.toString());
}
function removePidFile() {
  if (existsSync3(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
}
function getPidFromFile() {
  if (!existsSync3(PID_FILE)) {
    return null;
  }
  try {
    const pid = parseInt(readFileSync2(PID_FILE, "utf-8").trim());
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}
function isServerRunning() {
  const pid = getPidFromFile();
  if (!pid)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    removePidFile();
    return false;
  }
}
process.on("exit", removePidFile);
process.on("SIGINT", () => {
  removePidFile();
  process.exit(0);
});
process.on("SIGTERM", () => {
  removePidFile();
  process.exit(0);
});

// src/index.ts
var IS_DEV = true;
var __dirname2 = dirname(fileURLToPath(import.meta.url));
var DASHBOARD_DIR = process.env.CLAUDE_PLUGIN_ROOT ? join3(process.env.CLAUDE_PLUGIN_ROOT, "dashboard/dist") : join3(__dirname2, "../dashboard");
var dashboardIndexCache = null;
function getDashboardIndex() {
  if (!dashboardIndexCache) {
    dashboardIndexCache = readFileSync3(join3(DASHBOARD_DIR, "index.html"), "utf-8");
  }
  return dashboardIndexCache;
}
function serveStaticFile(path, contentType) {
  try {
    const content = readFileSync3(join3(DASHBOARD_DIR, path), "utf-8");
    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return null;
  }
}
if (!IS_DEV && isServerRunning()) {
  console.log("[CCD Server] Server is already running. Exiting.");
  process.exit(0);
}
if (!IS_DEV) {
  writePidFile();
}
var lastCleanupTime = Date.now();
function performScheduledClean() {
  const now = Date.now();
  if (now - lastCleanupTime < DEFAULT_CLEANUP_INTERVAL_MS) {
    return;
  }
  try {
    const result = cleanEmptySessions();
    if (result.deleted.length > 0) {
      console.log(`[CCD Server] Cleaned ${result.deleted.length} empty session(s): ${result.deleted.join(", ")}`);
    }
    lastCleanupTime = now;
  } catch (error) {
    console.error("[CCD Server] Error cleaning empty sessions:", error);
  }
}
var app = new Hono2;
setupGlobalMiddleware(app);
setupApiMiddleware(app, performScheduledClean, resetIdleTimer);
app.route("/api/v1/health", health);
app.route("/api/v1/sessions", sessions);
app.route("/api/v1/messages", messages);
app.route("/api/v1/stats", stats);
app.route("/api/v1/sync", sync);
app.route("/api/v1/search", search);
app.route("/api/v1/insights", insights);
app.route("/api/v1/daily-report", dailyReport);
app.get("/", (c) => {
  return c.html(getDashboardIndex());
});
app.get("/assets/:filename", (c) => {
  const filename = c.req.param("filename");
  const ext = filename.split(".").pop();
  const contentTypes = {
    js: "application/javascript",
    css: "text/css",
    json: "application/json"
  };
  const contentType = contentTypes[ext || ""] || "application/octet-stream";
  const file = serveStaticFile(`assets/${filename}`, contentType);
  if (file) {
    return file;
  }
  return c.notFound();
});
app.get("/*", (c) => {
  return c.html(getDashboardIndex());
});
console.log(`[CCD Server] Starting on http://localhost:${SERVER_PORT}`);
console.log(`[CCD Server] Data directory: ${DATA_DIR}`);
console.log(`[CCD Server] Database: ${DB_PATH}`);
console.log(`[CCD Server] Dashboard: ${DASHBOARD_DIR}`);
var src_default = {
  port: SERVER_PORT,
  fetch: app.fetch.bind(app)
};
export {
  src_default as default
};
