import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

test('GET /movies returns a list of movies', async () => {
    const response = await fetch(`${BASE_URL}/movies`);

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(Array.isArray(body));
});

test('GET /movies?page=1 returns the first page', async () => {
    const response = await fetch(`${BASE_URL}/movies?page=1`);

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(Array.isArray(body));
    assert.ok(body.length <= 50);
});

test('GET /movies?page=abc returns 400', async () => {
    const response = await fetch(`${BASE_URL}/movies?page=abc`);

    assert.equal(response.status, 400);

    const body = await response.json();
    assert.ok(body.error);
});

test('GET /movies?page=0 returns 400', async () => {
    const response = await fetch(`${BASE_URL}/movies?page=0`);

    assert.equal(response.status, 400);

    const body = await response.json();
    assert.ok(body.error);
});

test('GET /movies?releaseYear=2000 returns a list of movies released in 2000', async () => {
    const response = await fetch(`${BASE_URL}/movies?releaseYear=2000`);

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(Array.isArray(body));
    assert.ok(body.every(movie => movie.releaseDate.startsWith('2000')));
});

test('GET /movies?genre=Drama returns a list of movies in the Drama genre', async () => {
    const response = await fetch(`${BASE_URL}/movies?genre=Drama`);

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(Array.isArray(body));
    assert.ok(body.every(movie => JSON.parse(movie.genres).some(genre => genre.name === 'Drama')));
});

test('GET for a nonexistent movie returns 404', async () => {
    const response = await fetch(
        `${BASE_URL}/movies/999999999`
    );

    assert.equal(response.status, 404);
});

test('GET for a movie returns movie info and the average rating', async () => {
    const response = await fetch(
        `${BASE_URL}/movies/3`
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(typeof body === 'object');
});


test('GET for a movie with no ratings returns movie info and a null rating', async () => {
    const response = await fetch(
        `${BASE_URL}/movies/100010`
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(typeof body === 'object');
    assert.equal(body.averageRating, null);
});
