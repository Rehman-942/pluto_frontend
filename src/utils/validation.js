import { VALIDATION_RULES, REGEX } from './constants';

// User validation
export const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'Email is required' };
  if (!REGEX.EMAIL.test(email)) return { valid: false, message: 'Please enter a valid email address' };
  return { valid: true };
};

export const validateUsername = (username) => {
  if (!username) return { valid: false, message: 'Username is required' };
  
  if (username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
    return { valid: false, message: `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters` };
  }
  
  if (username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
    return { valid: false, message: `Username cannot exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.USERNAME.PATTERN.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  
  if (VALIDATION_RULES.USERNAME.RESERVED.includes(username.toLowerCase())) {
    return { valid: false, message: 'This username is reserved' };
  }
  
  return { valid: true };
};

export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters` };
  }
  
  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return { valid: false, message: `Password cannot exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters` };
  }
  
  return { valid: true };
};

export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) return { valid: false, message: 'Please confirm your password' };
  if (password !== confirmPassword) return { valid: false, message: 'Passwords do not match' };
  return { valid: true };
};

export const validateName = (name, fieldName = 'Name') => {
  if (!name) return { valid: false, message: `${fieldName} is required` };
  if (name.length > 50) return { valid: false, message: `${fieldName} cannot exceed 50 characters` };
  return { valid: true };
};

// Photo validation
export const validatePhotoTitle = (title) => {
  if (!title) return { valid: false, message: 'Photo title is required' };
  
  if (title.length < VALIDATION_RULES.PHOTO.TITLE.MIN_LENGTH) {
    return { valid: false, message: 'Photo title cannot be empty' };
  }
  
  if (title.length > VALIDATION_RULES.PHOTO.TITLE.MAX_LENGTH) {
    return { valid: false, message: `Photo title cannot exceed ${VALIDATION_RULES.PHOTO.TITLE.MAX_LENGTH} characters` };
  }
  
  return { valid: true };
};

export const validatePhotoDescription = (description) => {
  if (!description) return { valid: true }; // Optional field
  
  if (description.length > VALIDATION_RULES.PHOTO.DESCRIPTION.MAX_LENGTH) {
    return { valid: false, message: `Description cannot exceed ${VALIDATION_RULES.PHOTO.DESCRIPTION.MAX_LENGTH} characters` };
  }
  
  return { valid: true };
};

export const validatePhotoTags = (tags) => {
  if (!Array.isArray(tags)) return { valid: false, message: 'Tags must be an array' };
  
  if (tags.length > VALIDATION_RULES.PHOTO.TAGS.MAX_COUNT) {
    return { valid: false, message: `Cannot have more than ${VALIDATION_RULES.PHOTO.TAGS.MAX_COUNT} tags` };
  }
  
  for (const tag of tags) {
    if (!tag || tag.length === 0) {
      return { valid: false, message: 'Tags cannot be empty' };
    }
    
    if (tag.length > VALIDATION_RULES.PHOTO.TAGS.MAX_LENGTH) {
      return { valid: false, message: `Tag "${tag}" is too long (max ${VALIDATION_RULES.PHOTO.TAGS.MAX_LENGTH} characters)` };
    }
    
    if (!/^[a-zA-Z0-9_\s-]+$/.test(tag)) {
      return { valid: false, message: `Tag "${tag}" contains invalid characters` };
    }
  }
  
  return { valid: true };
};

// Comment validation
export const validateComment = (content) => {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: 'Comment cannot be empty' };
  }
  
  if (content.length > VALIDATION_RULES.COMMENT.MAX_LENGTH) {
    return { valid: false, message: `Comment cannot exceed ${VALIDATION_RULES.COMMENT.MAX_LENGTH} characters` };
  }
  
  return { valid: true };
};

// Bio validation
export const validateBio = (bio) => {
  if (!bio) return { valid: true }; // Optional field
  
  if (bio.length > VALIDATION_RULES.BIO.MAX_LENGTH) {
    return { valid: false, message: `Bio cannot exceed ${VALIDATION_RULES.BIO.MAX_LENGTH} characters` };
  }
  
  return { valid: true };
};

// URL validation
export const validateUrl = (url) => {
  if (!url) return { valid: true }; // Optional field
  
  if (!REGEX.URL.test(url)) {
    return { valid: false, message: 'Please enter a valid URL' };
  }
  
  return { valid: true };
};

// File validation
export const validateImageFile = (file, maxSize = 50 * 1024 * 1024) => {
  if (!file) return { valid: false, message: 'Please select a file' };
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, message: `File size must be less than ${maxSizeMB}MB` };
  }
  
  return { valid: true };
};

export const validateAvatarFile = (file) => {
  return validateImageFile(file, 5 * 1024 * 1024); // 5MB limit for avatars
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];
    
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        errors[field] = result.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
};

// Sanitization helpers
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return html;
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Validation schemas for common forms
export const VALIDATION_SCHEMAS = {
  LOGIN: {
    email: [validateEmail],
    password: [(password) => password ? { valid: true } : { valid: false, message: 'Password is required' }]
  },
  
  REGISTER: {
    firstName: [(name) => validateName(name, 'First name')],
    lastName: [(name) => validateName(name, 'Last name')],
    username: [validateUsername],
    email: [validateEmail],
    password: [validatePassword],
    confirmPassword: [(confirmPassword, data) => validatePasswordConfirmation(data?.password, confirmPassword)]
  },
  
  PHOTO_UPLOAD: {
    title: [validatePhotoTitle],
    description: [validatePhotoDescription],
    tags: [validatePhotoTags]
  },
  
  PROFILE_UPDATE: {
    firstName: [(name) => validateName(name, 'First name')],
    lastName: [(name) => validateName(name, 'Last name')],
    bio: [validateBio],
    website: [validateUrl]
  },
  
  COMMENT: {
    content: [validateComment]
  }
};

export default {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  validateName,
  validatePhotoTitle,
  validatePhotoDescription,
  validatePhotoTags,
  validateComment,
  validateBio,
  validateUrl,
  validateImageFile,
  validateAvatarFile,
  validateForm,
  sanitizeInput,
  sanitizeHtml,
  VALIDATION_SCHEMAS
};
