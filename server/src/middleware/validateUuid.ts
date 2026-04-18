import { Request, Response, NextFunction } from 'express';

/**
 * UUID v4 validation regex
 * Matches format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, A, or B
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Middleware to validate UUID parameters in request
 * Usage: router.get('/products/:id', validateUuid('id'), controller.getById)
 *
 * @param paramNames - Array of parameter names to validate (e.g., ['id', 'productId'])
 * @returns Express middleware function
 */
export const validateUuid = (...paramNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];

      if (!value) {
        return res.status(400).json({
          error: 'BAD_REQUEST',
          message: `Параметр "${paramName}" обов'язковий`,
        });
      }

      if (!UUID_V4_REGEX.test(value)) {
        return res.status(400).json({
          error: 'INVALID_UUID',
          message: `Параметр "${paramName}" має невірний формат UUID`,
        });
      }
    }

    next();
  };
};

/**
 * Validate single UUID value
 * @param value - String to validate
 * @returns true if valid UUID v4, false otherwise
 */
export const isValidUuid = (value: string): boolean => {
  return UUID_V4_REGEX.test(value);
};
