import { APIError } from '@/services/api';

// Enhanced error categorization
export const ErrorType = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  RATE_LIMIT: 'RATE_LIMIT',
  CONTENT_POLICY: 'CONTENT_POLICY',
  GENERATION_LIMIT: 'GENERATION_LIMIT',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
} as const;

type ErrorTypeValue = typeof ErrorType[keyof typeof ErrorType];

interface ErrorInfo {
  type: ErrorTypeValue;
  message: string;
  userFriendly: string;
  icon?: string;
  duration?: number;
}

export function categorizeError(error: unknown): ErrorInfo {
  const errorMessage = getErrorMessage(error).toLowerCase();
  
  // Check if this is an APIError with specific details
  if (error instanceof APIError) {
    const details = error.details;
    const originalMessage = typeof details === 'string' ? details : details?.detail || '';
    const originalMessageLower = originalMessage.toLowerCase();
    
    // Specific authentication error patterns
    if (originalMessageLower.includes('invalid credentials') || 
        originalMessageLower.includes('incorrect password') ||
        originalMessageLower.includes('wrong password') ||
        originalMessageLower.includes('invalid username') ||
        originalMessageLower.includes('user not found') ||
        originalMessageLower.includes('no user found')) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: originalMessage,
        userFriendly: 'Invalid username/email or password. Please check your credentials and try again.',
        icon: '🔒',
        duration: 4000
      };
    }
    
    // Email verification errors
    if (originalMessageLower.includes('email not verified') || 
        originalMessageLower.includes('verify your email') ||
        originalMessageLower.includes('email verification')) {
      return {
        type: ErrorType.EMAIL_VERIFICATION,
        message: originalMessage,
        userFriendly: 'Please verify your email before logging in. Check your inbox or request a new verification email.',
        icon: '📧',
        duration: 6000
      };
    }
    
    // Account locked/suspended
    if (originalMessageLower.includes('account locked') || 
        originalMessageLower.includes('account suspended') ||
        originalMessageLower.includes('account disabled')) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: originalMessage,
        userFriendly: 'Your account has been temporarily suspended. Please contact support for assistance.',
        icon: '🚫',
        duration: 5000
      };
    }
    
    // Field-specific validation errors
    if (typeof details === 'object' && details.field_errors) {
      const fieldErrors = details.field_errors;
      const authFields = ['username', 'email', 'password', 'login'];
      const hasAuthFieldError = fieldErrors.some(fe => 
        authFields.some(authField => fe.field.toLowerCase().includes(authField))
      );
      
      if (hasAuthFieldError) {
        return {
          type: ErrorType.VALIDATION,
          message: fieldErrors.map(fe => `${fe.field}: ${fe.message}`).join(', '),
          userFriendly: 'Please check your login information and try again.',
          icon: '✏️',
          duration: 4000
        };
      }
    }
    
    // HTTP status code specific handling
    switch (error.status) {
      case 401:
        // Check if it's a login attempt vs session expired
        if (originalMessageLower.includes('invalid') || 
            originalMessageLower.includes('incorrect') ||
            originalMessageLower.includes('wrong') ||
            originalMessageLower.includes('not found')) {
          return {
            type: ErrorType.AUTHENTICATION,
            message: originalMessage,
            userFriendly: 'Invalid username/email or password. Please check your credentials and try again.',
            icon: '🔒',
            duration: 4000
          };
        }
        return {
          type: ErrorType.AUTHENTICATION,
          message: originalMessage,
          userFriendly: 'Your session has expired. Please log in again.',
          icon: '🔐',
          duration: 4000
        };
      
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          message: originalMessage,
          userFriendly: 'You do not have permission to perform this action.',
          icon: '🚫',
          duration: 4000
        };
      
      case 404:
        if (originalMessageLower.includes('user') || originalMessageLower.includes('account')) {
          return {
            type: ErrorType.NOT_FOUND,
            message: originalMessage,
            userFriendly: 'Account not found. Please check your username/email or create a new account.',
            icon: '👤',
            duration: 5000
          };
        }
        return {
          type: ErrorType.NOT_FOUND,
          message: originalMessage,
          userFriendly: 'Resource not found. It may have been deleted.',
          icon: '🔍',
          duration: 4000
        };
      
      case 422:
        return {
          type: ErrorType.VALIDATION,
          message: originalMessage,
          userFriendly: 'Please check your input and try again.',
          icon: '✏️',
          duration: 4000
        };
      
      case 429:
        return {
          type: ErrorType.RATE_LIMIT,
          message: originalMessage,
          userFriendly: 'Too many requests. Please wait a moment before trying again.',
          icon: '⏱️',
          duration: 4000
        };
      
      case 500:
        return {
          type: ErrorType.SERVER,
          message: originalMessage,
          userFriendly: 'Server error. Please try again later.',
          icon: '🔧',
          duration: 5000
        };
    }
  }
  
  // Fallback to message-based categorization
  if (errorMessage.includes('invalid') && (errorMessage.includes('password') || errorMessage.includes('credentials'))) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: errorMessage,
      userFriendly: 'Invalid username/email or password. Please check your credentials and try again.',
      icon: '🔒',
      duration: 4000
    };
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: errorMessage,
      userFriendly: 'Please log in again to continue.',
      icon: '🔐',
      duration: 4000
    };
  }
  
  // Email verification errors
  if (errorMessage.includes('verify your email') || errorMessage.includes('email verification')) {
    return {
      type: ErrorType.EMAIL_VERIFICATION,
      message: errorMessage,
      userFriendly: 'Please verify your email before logging in. Check your inbox or request a new verification email.',
      icon: '📧',
      duration: 6000
    };
  }
  
  // Account not found
  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    return {
      type: ErrorType.NOT_FOUND,
      message: errorMessage,
      userFriendly: 'Account not found. Please check your username/email or create a new account.',
      icon: '👤',
      duration: 5000
    };
  }
  
  // Account locked/suspended
  if (errorMessage.includes('locked') || errorMessage.includes('suspended') || errorMessage.includes('disabled')) {
    return {
      type: ErrorType.AUTHORIZATION,
      message: errorMessage,
      userFriendly: 'Your account has been temporarily suspended. Please contact support for assistance.',
      icon: '🚫',
      duration: 5000
    };
  }
  
  // Content policy violations
  if (errorMessage.includes('content_policy_violation') || errorMessage.includes('inappropriate')) {
    return {
      type: ErrorType.CONTENT_POLICY,
      message: errorMessage,
      userFriendly: 'Your content violates our community guidelines. Please revise your input to be more appropriate.',
      icon: '⚠️',
      duration: 5000
    };
  }
  
  // Generation limits
  if (errorMessage.includes('only one') || errorMessage.includes('limit') || errorMessage.includes('generation limit')) {
    return {
      type: ErrorType.GENERATION_LIMIT,
      message: errorMessage,
      userFriendly: 'You have reached the generation limit. You can still create unlimited stories and avatars.',
      icon: '🎯',
      duration: 5000
    };
  }
  
  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: errorMessage,
      userFriendly: 'Too many requests. Please wait a moment before trying again.',
      icon: '⏱️',
      duration: 4000
    };
  }
  
  // Network/connection errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return {
      type: ErrorType.NETWORK,
      message: errorMessage,
      userFriendly: 'Connection error. Please check your internet connection and try again.',
      icon: '🌐',
      duration: 5000
    };
  }
  
  // Server errors
  if (errorMessage.includes('server error') || errorMessage.includes('internal error') || errorMessage.includes('500')) {
    return {
      type: ErrorType.SERVER,
      message: errorMessage,
      userFriendly: 'Server error. Please try again later.',
      icon: '🔧',
      duration: 5000
    };
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      type: ErrorType.VALIDATION,
      message: errorMessage,
      userFriendly: 'Please check your input and try again.',
      icon: '✏️',
      duration: 4000
    };
  }
  
  // Default case
  return {
    type: ErrorType.UNKNOWN,
    message: errorMessage,
    userFriendly: 'An unexpected error occurred. Please try again.',
    icon: '❓',
    duration: 5000
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return 'Authentication required. Please log in to continue.';
      case 403:
        return 'Insufficient permissions to perform this operation.';
      case 404:
        return 'Resource not found. It may have been deleted.';
      case 422:
        if (typeof error.details === 'object' && error.details.field_errors) {
          return error.details.field_errors
            .map(fe => `${fe.field}: ${fe.message}`)
            .join(', ');
        }
        return hideUrl(error.message);
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        if (typeof error.details === 'object') {
          const d = error.details as any;
          if (d.detail) return hideUrl(d.detail);
          if (d.field_errors) {
            return d.field_errors.map((fe: any) => `${fe.field}: ${fe.message}`).join(', ');
          }
        }
        return hideUrl(error.message || 'An unexpected error occurred.');
    }
  }

  if (error instanceof Error) {
    return hideUrl(error.message);
  }

  try {
    const msg = JSON.stringify(error);
    return hideUrl(msg);
  } catch {
    return 'An unexpected error occurred.';
  }
}

// Hide backend URLs or technical details
const hideUrl = (msg: string) =>
  /https?:\/\/|0\.0\.0\.0|localhost|127\.0\.0\.1|\/api\//.test(msg)
    ? 'Connection error. Please try again later.'
    : msg;

export function handleError(error: unknown): ErrorInfo {
  return categorizeError(error);
}

// Specific error handlers for different features
export function handleAuthError(error: unknown): ErrorInfo {
  const errorInfo = categorizeError(error);
  
  // Override for specific auth scenarios
  if (errorInfo.type === ErrorType.AUTHENTICATION) {
    return {
      ...errorInfo,
      userFriendly: 'Invalid username/email or password. Please check your credentials and try again.',
      icon: '🔒'
    };
  }
  
  return errorInfo;
}

export function handleGenerationError(error: unknown): ErrorInfo {
  const errorInfo = categorizeError(error);
  
  // Override for generation-specific errors
  if (errorInfo.type === ErrorType.CONTENT_POLICY) {
    return {
      ...errorInfo,
      userFriendly: 'Your content violates our community guidelines. Please revise your description to be more appropriate.',
      icon: '⚠️'
    };
  }
  
  if (errorInfo.type === ErrorType.GENERATION_LIMIT) {
    return {
      ...errorInfo,
      userFriendly: 'You have reached the generation limit for this feature. You can still create unlimited content in other areas.',
      icon: '🎯'
    };
  }
  
  return errorInfo;
}

export function handleValidationError(error: unknown): ErrorInfo {
  const errorInfo = categorizeError(error);
  
  // Override for validation-specific errors
  if (errorInfo.type === ErrorType.VALIDATION) {
    return {
      ...errorInfo,
      userFriendly: 'Please check your input and ensure all required fields are filled correctly.',
      icon: '✏️'
    };
  }
  
  return errorInfo;
} 