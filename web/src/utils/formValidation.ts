// Enhanced form validation utilities for admin forms

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface OrderValidationContext {
  currentId?: number;
  existingItems: Array<{ id: number; order: number }>;
}

// Generic form validation
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): ValidationResult {
  const errors: Record<string, string> = {};
  
  requiredFields.forEach(field => {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors[field] = `${field.replace('_', ' ')} is required`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Order field validation with duplicate detection
export function validateOrderField(
  orderValue: string | number, 
  context: OrderValidationContext
): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Convert to number and validate
  const orderNum = typeof orderValue === 'string' ? parseInt(orderValue) : orderValue;
  
  if (isNaN(orderNum)) {
    errors.order = 'Display order must be a valid number';
  } else if (orderNum < 0) {
    errors.order = 'Display order cannot be negative';
  } else {
    // Check for duplicates
    const isDuplicate = context.existingItems.some(item => 
      item.order === orderNum && item.id !== context.currentId
    );
    
    if (isDuplicate) {
      errors.order = `Display order ${orderNum} is already used. Please choose a different number.`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// URL validation
export function validateUrl(url: string, fieldName: string = 'URL'): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (url && url.trim() !== '') {
    try {
      new URL(url);
    } catch {
      errors[fieldName.toLowerCase().replace(' ', '_')] = `${fieldName} must be a valid URL`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Date validation
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.end_date = 'End date cannot be before start date';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// JSON validation for fields that expect JSON
export function validateJson(jsonString: string, fieldName: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (jsonString && jsonString.trim() !== '') {
    try {
      JSON.parse(jsonString);
    } catch {
      errors[fieldName.toLowerCase().replace(' ', '_')] = `${fieldName} must be valid JSON format`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Number validation
export function validatePositiveNumber(value: string, fieldName: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (value && value.trim() !== '') {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      errors[fieldName.toLowerCase().replace(' ', '_')] = `${fieldName} must be a positive number`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Combine multiple validation results
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const combinedErrors: Record<string, string> = {};
  
  results.forEach(result => {
    Object.assign(combinedErrors, result.errors);
  });
  
  return {
    isValid: Object.keys(combinedErrors).length === 0,
    errors: combinedErrors
  };
}

// Display validation errors in a user-friendly way
export function formatValidationErrors(errors: Record<string, string>): string {
  const errorMessages = Object.values(errors);
  if (errorMessages.length === 0) return '';
  
  if (errorMessages.length === 1) {
    return errorMessages[0];
  }
  
  return `Please fix the following issues:\n• ${errorMessages.join('\n• ')}`;
}