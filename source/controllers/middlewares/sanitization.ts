import express from 'express';
import { ZodSchema } from 'zod';

export const santizeRequestBody =
    (
        RequestBodySchema: ZodSchema,
        RequestParamsSchema?: ZodSchema
    ): express.RequestHandler =>
    (req, res, next) => {
        RequestBodySchema.parse(req.body);

        if (RequestParamsSchema) RequestParamsSchema.parse(req.params);

        next();
    };
