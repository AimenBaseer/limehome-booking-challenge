import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../../types/apiResponse';

type ZodValidationError = {
    message: string;
    path: (string | number)[];
};

const handleValidationError = (
    error: ZodError,
    req: Request,
    res: Response<ApiResponse<ZodValidationError[]>>,
    next: NextFunction
) => {
    const validationErrors: ZodValidationError[] = error.errors.map((err) => ({
        message: err.message,
        path: err.path,
    }));
    res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Data not in correct shape',
        data: validationErrors,
    });
};

const handleOtherErrors = (
    error: Error,
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    // Handle other types of errors if necessary
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        statusCode: 500,
    });
};

export { handleValidationError, handleOtherErrors };
