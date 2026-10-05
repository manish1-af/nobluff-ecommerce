export function notFound(request, response) {
  response.status(404).json({ success: false, message: "Resource not found" })
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  let status = Number(error.status) || 500
  let message = error.message || "Internal server error"

  if (error.name === "CastError") {
    status = 400
    message = "Invalid resource ID"
  } else if (error.code === 11000) {
    status = 409
    message = "A record with those details already exists"
  } else if (error.name === "ValidationError") {
    status = 400
    message = Object.values(error.errors)[0]?.message || "Invalid data"
  } else if (error.name === "MulterError") {
    status = 400
    message = error.code === "LIMIT_FILE_SIZE" ? "Image must be 8 MB or smaller" : "Invalid image upload"
  } else if (error.name === "MongoServerError" || error.name === "MongoNetworkError") {
    status = 503
    message = "Database service is unavailable"
  } else if (status === 500) {
    message = "Internal server error"
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error)
  }

  response.status(status).json({ success: false, message })
}