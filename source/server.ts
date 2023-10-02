import http from 'http';
import express, { Express, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import routes from './routes/bookings';
import prisma from './prisma';
import { ZodError } from 'zod';
import {
    handleOtherErrors,
    handleValidationError,
} from './controllers/middlewares/errors';

export const app: Express = express();

// Logging
app.use(morgan('dev'));

// Parse the request
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument));

// Routes
app.use('/', routes);

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        handleValidationError(err, req, res, next);
    } else {
        handleOtherErrors(err, req, res, next);
    }
});

// Server
let server: http.Server;

export async function startServer() {
    return new Promise((resolve, reject) => {
        const port = 8000;
        server = http.createServer(app);
        server
            .listen(port, () => {
                console.log(
                    `The server is running on http://localhost:${port}`
                );
                resolve('Server started');
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

export async function stopServer() {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve('Server stopped');
        });
    });
}

async function initialize() {
    try {
        await prisma.$connect();

        // Start the server if not running
        if (!server) {
            await startServer();
        }
    } catch (error) {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

initialize()
    .then(() => {
        console.log('Initialized');
    })
    .catch((error) => {
        console.error(error);
    });
