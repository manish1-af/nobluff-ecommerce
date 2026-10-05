export function validate(schema, source = "body") {
  return function validateRequest(request, response, next) {
    const result = schema.safeParse(request[source])
    if (!result.success) {
      return response.status(400).json({
        success: false,
        message: result.error.issues[0]?.message || "Invalid request",
      })
    }
    request[source] = result.data
    next()
  }
}