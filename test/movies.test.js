import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { createMoviesRouter } from '../routes/movies.js';

const mockMovies = [
    {
        imdbId: 'tt0111161',
        title: 'The Shawshank Redemption',
        genres: '[{"name":"Drama"}]',
        releaseDate: '1994-09-23',
        budget: '$25,000,000'
    },
    {
        imdbId: 'tt0068646',
        title: 'The Godfather',
        genres: '[{"name":"Drama"}]',
        releaseDate: '1972-03-24',
        budget: '$6,000,000'
    }
];

const mockRatedMovie = {
    ...mockMovies[0],
    averageRating: 8.76
};

function createMockDb({
    allResult = mockMovies,
    getResult = mockRatedMovie,
    allError = null,
    getError = null
} = {}) {
    const calls = {
        all: [],
        get: []
    };

    const db = {
        all(sql, params, callback) {
            // Support both all(sql, callback) and
            // all(sql, params, callback).
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }

            calls.all.push({ sql, params });

            callback(allError, allError ? undefined : allResult);
        },

        get(sql, params, callback) {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }

            calls.get.push({ sql, params });

            callback(getError, getError ? undefined : getResult);
        }
    };

    return { db, calls };
}

function createTestApp(db) {
    const app = express();

    app.use('/movies', createMoviesRouter({ moviesDb: db }));

    // Mirrors the JSON error handling expected in server.js.
    app.use((err, req, res, next) => {
        const status = err.status || err.statusCode || 500;

        if (status >= 500) {
            console.error(err);
        }

        res.status(status).json({
            error: status >= 500
                ? 'Internal server error'
                : err.message
        });
    });

    return app;
}

test('GET /movies returns movie data', async () => {
    const { db } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    assert.equal(response.body.length, 2);
    assert.equal(
        response.body[0].title,
        'The Shawshank Redemption'
    );
    assert.equal(response.body[1].imdbId, 'tt0068646');
});

test('GET /movies returns an empty array when there are no movies', async () => {
    const { db } = createMockDb({ allResult: [] });
    const app = createTestApp(db);

    const response = await request(app).get('/movies');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
});

test('GET /movies?page=2 requests the second page', async () => {
    const { db, calls } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?page=2');

    assert.equal(response.status, 200);
    assert.equal(calls.all.length, 1);

    assert.match(calls.all[0].sql, /LIMIT/i);
    assert.match(calls.all[0].sql, /OFFSET/i);
    assert.equal(calls.all[0].params['$pageSize'], 50);
    assert.equal(calls.all[0].params['$offset'], 50);
});

test('GET /movies?page=-1 returns JSON 400', async () => {
    const { db } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?page=-1');

    assert.equal(response.status, 400);
    assert.equal(
        response.body.error,
        'The page query parameter must be a positive integer.'
    );
});

test('GET /movies?page=abc returns 400', async () => {
    const { db } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?page=abc');

    assert.equal(response.status, 400);
    assert.equal(
        response.body.error,
        'The page query parameter must be a positive integer.'
    );
});

test('GET /movies?page=0 returns 400', async () => {
    const { db } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?page=0');

    assert.equal(response.status, 400);
     assert.equal(
        response.body.error,
        'The page query parameter must be a positive integer.'
    );
});

test('GET /movies?releaseYear=1994 returns movies for that year', async () => {
    const { db, calls } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?releaseYear=1994');
    assert.equal(response.status, 200);
    assert.equal(calls.all[0].params['$year'], '1994%');
});

test('GET /movies?genre=Drama returns movies in that genre', async () => {
    const { db, calls } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?genre=Drama');

    assert.equal(response.status, 200);
    assert.equal(calls.all[0].params['$genre'], 'Drama');
});

test('GET /movies?releaseYear=1994&genre=Drama returns movies for that year and genre', async () => {
    const { db, calls } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?releaseYear=1994&genre=Drama');

    assert.equal(response.status, 200);
    assert.equal(calls.all[0].params['$year'], '1994%');
    assert.equal(calls.all[0].params['$genre'], 'Drama');
});

test('GET /movies?releaseYear=1994&genre=Drama&page=2 applies pagination', async () => {
    const { db, calls } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app).get('/movies?releaseYear=1994&genre=Drama&page=2');

    assert.equal(response.status, 200);
    assert.match(calls.all[0].sql, /LIMIT/i);
    assert.match(calls.all[0].sql, /OFFSET/i);
    assert.equal(calls.all[0].params['$pageSize'], 50);
    assert.equal(calls.all[0].params['$offset'], 50);
    assert.equal(calls.all[0].params['$year'], '1994%');
    assert.equal(calls.all[0].params['$genre'], 'Drama');
});

test('GET /movies/:id returns information about a movie and its average rating', async () => {
    const { db, calls } = createMockDb();
    const app = createTestApp(db);

    const response = await request(app)
        .get('/movies/tt0111161');

    assert.equal(response.status, 200);
    assert.equal(response.body.imdbId, 'tt0111161');
    assert.equal(response.body.title, 'The Shawshank Redemption');
    assert.equal(response.body.averageRating, 8.76);
    assert.equal(calls.get.length, 1);
});

test('movie info endpoint returns 404 when the movie does not exist', async () => {
    const { db } = createMockDb({ getResult: null });
    const app = createTestApp(db);

    const response = await request(app)
        .get('/movies/not-a-real-id');

    assert.equal(response.status, 404);
});

test('movie info endpoint returns 500 when the database fails', async () => {
    const { db } = createMockDb({
        getError: new Error('Simulated database failure')
    });
    const app = createTestApp(db);

    const response = await request(app)
        .get('/movies/tt0111161');

    assert.equal(response.status, 500);
    assert.deepEqual(response.body, {
        error: 'Internal server error'
    });
});
