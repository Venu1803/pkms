// Input validation utilities

// Password validation: minimum 12 chars with uppercase, lowercase, digit, special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/;

function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 12) {
    return { valid: false, message: "Password must be at least 12 characters" };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain uppercase, lowercase, digit, and special character (@$!%*?&)",
    };
  }
  return { valid: true };
}

// Email validation
function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }
  return { valid: true };
}

// Non-empty string validation
function validateString(value, fieldName, minLength = 1) {
  if (!value || typeof value !== "string") {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (value.trim().length < minLength) {
    return {
      valid: false,
      message: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  return { valid: true };
}

// Non-empty array validation
function validateArray(value, fieldName) {
  if (!Array.isArray(value)) {
    return { valid: false, message: `${fieldName} must be an array` };
  }
  if (value.length === 0) {
    return { valid: false, message: `${fieldName} cannot be empty` };
  }
  return { valid: true };
}

module.exports = {
  PASSWORD_REGEX,
  validatePassword,
  validateEmail,
  validateString,
  validateArray,
};
