import { APIError } from '@/services/api';
import { categorizeError } from './errorHandler';

// Test utility for auth error handling
export const testAuthErrorHandling = () => {
  console.log('Testing auth error handling...');

  // Test 1: Wrong password
  const wrongPasswordError = new APIError(401, 'Unauthorized', {
    detail: 'Invalid credentials'
  });
  const wrongPasswordResult = categorizeError(wrongPasswordError);
  console.log('Wrong password error:', wrongPasswordResult.userFriendly);

  // Test 2: User not found
  const userNotFoundError = new APIError(401, 'Unauthorized', {
    detail: 'User not found'
  });
  const userNotFoundResult = categorizeError(userNotFoundError);
  console.log('User not found error:', userNotFoundResult.userFriendly);

  // Test 3: Email not verified
  const emailNotVerifiedError = new APIError(401, 'Unauthorized', {
    detail: 'Email not verified'
  });
  const emailNotVerifiedResult = categorizeError(emailNotVerifiedError);
  console.log('Email not verified error:', emailNotVerifiedResult.userFriendly);

  // Test 4: Account locked
  const accountLockedError = new APIError(403, 'Forbidden', {
    detail: 'Account locked'
  });
  const accountLockedResult = categorizeError(accountLockedError);
  console.log('Account locked error:', accountLockedResult.userFriendly);

  // Test 5: Field validation errors
  const fieldValidationError = new APIError(422, 'Unprocessable Entity', {
    detail: 'Validation failed',
    field_errors: [
      { field: 'password', message: 'Password is too short' },
      { field: 'username', message: 'Username is required' }
    ]
  });
  const fieldValidationResult = categorizeError(fieldValidationError);
  console.log('Field validation error:', fieldValidationResult.userFriendly);

  // Test 6: Session expired
  const sessionExpiredError = new APIError(401, 'Unauthorized', {
    detail: 'Token expired'
  });
  const sessionExpiredResult = categorizeError(sessionExpiredError);
  console.log('Session expired error:', sessionExpiredResult.userFriendly);

  console.log('Auth error handling tests completed!');
};

// Expected results:
// Wrong password: "Invalid username/email or password. Please check your credentials and try again."
// User not found: "Account not found. Please check your username/email or create a new account."
// Email not verified: "Please verify your email before logging in. Check your inbox or request a new verification email."
// Account locked: "Your account has been temporarily suspended. Please contact support for assistance."
// Field validation: "Please check your login information and try again."
// Session expired: "Your session has expired. Please log in again." 