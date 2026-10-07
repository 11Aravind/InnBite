/**
 * Form Validation and Input Sanitization Utilities for InnBite / Orderly
 */

/**
 * Strips HTML tags, script openers, and hidden control characters from text inputs.
 * @param {string} text - Raw input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove ASCII control characters
    .trim();
};

/**
 * Blocks negative sign (-), exponent (e/E), and invalid key presses on price/number inputs.
 * @param {KeyboardEvent} e
 */
export const handlePriceKeyDown = (e) => {
  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
    e.preventDefault();
  }
};

/**
 * Validates Customer Checkout Form fields
 * Enforces mobile numbers to start with 6, 7, 8, or 9 (10 digits).
 * @param {{ name?: string, phone?: string, notes?: string }} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateCustomerForm = ({ name, phone, notes }) => {
  const errors = {};

  if (name !== undefined) {
    const cleanName = sanitizeInput(name);
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Customer name must be at least 2 characters long.';
    } else if (cleanName.length > 50) {
      errors.name = 'Customer name cannot exceed 50 characters.';
    } else if (!/^[a-zA-Z\s'-]+$/.test(cleanName)) {
      errors.name = 'Name contains invalid characters (letters, spaces, hyphens only).';
    }
  }

  if (phone !== undefined) {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      errors.phone = 'Phone number is required.';
    } else if (!/^(?:\+91)?[6-9][0-9]{9}$/.test(cleanPhone)) {
      errors.phone = 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.';
    }
  }

  if (notes !== undefined && notes) {
    if (notes.length > 200) {
      errors.notes = 'Special instructions cannot exceed 200 characters.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates Admin Login Form fields
 * @param {{ email?: string, password?: string }} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateAdminLoginForm = ({ email, password }) => {
  const errors = {};

  if (email !== undefined) {
    const cleanEmail = sanitizeInput(email);
    if (!cleanEmail || cleanEmail.length < 3) {
      errors.email = 'Username or email must be at least 3 characters long.';
    } else if (cleanEmail.length > 100) {
      errors.email = 'Username or email cannot exceed 100 characters.';
    }
  }

  if (password !== undefined) {
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    } else if (password.length > 64) {
      errors.password = 'Password cannot exceed 64 characters.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates Dish Creation / Editing Form
 * @param {{ name?: string, price?: number|string, description?: string, category_id?: string|number }} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateDishForm = ({ name, price, description, category_id }) => {
  const errors = {};

  if (name !== undefined) {
    const cleanName = sanitizeInput(name);
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Dish name must be at least 2 characters.';
    } else if (cleanName.length > 80) {
      errors.name = 'Dish name cannot exceed 80 characters.';
    } else if (!/^[a-zA-Z0-9\s'&\(\)\.-]+$/.test(cleanName)) {
      errors.name = 'Dish name contains invalid special characters.';
    }
  }

  if (price !== undefined) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      errors.price = 'Price must be a positive number greater than 0.';
    } else if (numPrice > 99999.99) {
      errors.price = 'Price cannot exceed $99,999.99.';
    }
  }

  if (description !== undefined && description) {
    const cleanDesc = sanitizeInput(description);
    if (cleanDesc.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }
  }

  if (category_id !== undefined) {
    if (!category_id) {
      errors.category_id = 'Please select a valid category.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates Category Form fields
 * @param {{ name?: string }} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateCategoryForm = ({ name }) => {
  const errors = {};

  if (name !== undefined) {
    const cleanName = sanitizeInput(name);
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Category name must be at least 2 characters.';
    } else if (cleanName.length > 40) {
      errors.name = 'Category name cannot exceed 40 characters.';
    } else if (!/^[a-zA-Z0-9\s&-]+$/.test(cleanName)) {
      errors.name = 'Category name contains invalid special characters.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates Table Creation / Editing Form
 * @param {{ name?: string, seats?: number|string }} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateTableForm = ({ name, seats }) => {
  const errors = {};

  if (name !== undefined) {
    const cleanName = sanitizeInput(name);
    if (!cleanName || cleanName.length < 1) {
      errors.name = 'Table label is required.';
    } else if (cleanName.length > 20) {
      errors.name = 'Table label cannot exceed 20 characters.';
    }
  }

  if (seats !== undefined) {
    const numSeats = parseInt(seats, 10);
    if (isNaN(numSeats) || numSeats < 1) {
      errors.seats = 'Seats must be at least 1.';
    } else if (numSeats > 50) {
      errors.seats = 'Seats cannot exceed 50.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
