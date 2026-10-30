export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${req.method} ${req.url} ->`, err.message);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
