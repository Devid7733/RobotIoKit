// Service-layer errors created via createServiceError(message, status) attach a
// deliberate, safe, user-facing .status — those messages are safe to return as-is.
// Unexpected errors (DB/network/etc.) have no .status and may contain internal
// details, so they're logged server-side and replaced with a generic fallback.
export function toClientErrorMessage(error, fallback) {
  if (error?.status && error instanceof Error) {
    return error.message;
  }

  console.error(error);
  return fallback;
}
