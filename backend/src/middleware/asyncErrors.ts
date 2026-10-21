/* Express 4 ignores the promise an async route handler returns. When it rejects (for example,
   the database can't be reached), nothing catches it and Node stops the whole server.
   This hands those rejections to next(), so they reach the error handler in app.ts like any
   other error. It wraps the same call Express makes for every route and middleware. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Layer = require('express/lib/router/layer');

const handleRequest = Layer.prototype.handle_request;

Layer.prototype.handle_request = function (
  this: { handle: (...args: unknown[]) => unknown },
  req: unknown,
  res: unknown,
  next: (err?: unknown) => void,
) {
  const fn = this.handle;
  // Error-handling middleware (four arguments) keeps Express's own behaviour
  if (fn.length > 3) return handleRequest.call(this, req, res, next);

  try {
    const result = fn(req, res, next) as { catch?: (cb: (err: unknown) => void) => void } | undefined;
    if (result && typeof result.catch === 'function') result.catch(next);
  } catch (err) {
    next(err);
  }
};

export {};
