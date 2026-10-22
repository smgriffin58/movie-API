import express from 'express';
import { initializeDatabase } from './db/database.js';
import { createMoviesRouter } from './routes/movies.js';

const app = express();
const port = process.env.PORT || 8000;

async function startServer() {
    try {
        const moviesDb = await initializeDatabase();

        app.use('/movies', createMoviesRouter({ moviesDb }));

        app.use((err, req, res, next) => {
            const status = err.status || err.statusCode || 500;

            if (status >= 500) {
                console.error(err);
            }

            res.status(status).json({
                error: status === 500
                    ? 'Internal server error'
                    : err.message
            });
        });

        app.listen(port, () => {
            console.log(`Server has started on port ${port}`);
        });
    } catch (err) {
        console.error('Failed to initialize database:', err.message);
        process.exitCode = 1;
    }
}

startServer();
