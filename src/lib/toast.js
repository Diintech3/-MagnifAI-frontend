import toast from "react-hot-toast";

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  VALIDATION_ERROR: "Please check the form and try again",
  EMAIL_ALREADY_EXISTS: "This email is already registered",
  PASSWORD_MISMATCH: "Passwords do not match",
  NOT_FOUND: "Record not found",
  FORBIDDEN: "You do not have permission for this action",
  UNAUTHENTICATED: "Please sign in again",
  ADMIN_DISABLED: "This admin account is disabled",
  APP_DISABLED: "This app is disabled",
  CANDIDATE_DISABLED: "This candidate account is disabled",
  CANDIDATE_PASSWORD_NOT_SET: "Set a password for this candidate first (Edit → Login credentials)",
  INVALID_FILE_TYPE: "File must be PNG, JPG or WEBP",
  FILE_TOO_LARGE: "File must be under 10MB",
  R2_NOT_CONFIGURED: "File storage is not configured",
  INTERNAL_ERROR: "Server error. Please try again",
  BACKEND_UNREACHABLE: "API server is not running. Start backend on port 4000.",
};

export function resolveErrorMessage(err, fallback = "Something went wrong") {
  if (err?.code === "BACKEND_UNREACHABLE") return ERROR_MESSAGES.BACKEND_UNREACHABLE;
  
  // Prioritize specific backend error messages if present in payload
  if (err?.payload?.message) return err.payload.message;
  
  const code = err?.payload?.error;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (typeof code === "string" && code !== "REQUEST_FAILED") return code;

  if (err?.status === 500) return "Server error. Restart backend and try again.";
  if (err?.status === 400) return "Invalid request. Please check your input.";
  if (err?.message && err.message !== "REQUEST_FAILED") return err.message;
  return fallback;
}

export function toastSuccess(message) {
  toast.success(message);
}

export function toastError(message) {
  toast.error(message);
}

export function toastFromError(err, fallback) {
  toast.error(resolveErrorMessage(err, fallback));
}

export { toast };
