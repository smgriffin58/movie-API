import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhereClause, getOffset } from '../util.js';

test('defaults to offset 0 when page is omitted', () => {
    assert.deepEqual(getOffset(50, undefined), {
        pageSize: 50,
        offset: 0
    });
});

test('calculates offset for page 1', () => {
    assert.deepEqual(getOffset(50, '1'), {
        pageSize: 50,
        offset: 0
    });
});

test('calculates offset for page 2', () => {
    assert.deepEqual(getOffset(50, '2'), {
        pageSize: 50,
        offset: 50
    });
});

test('calculates offset for page 3', () => {
    assert.deepEqual(getOffset(50, '3'), {
        pageSize: 50,
        offset: 100
    });
});

test('rejects a negative page', () => {
    assert.throws(
        () => getOffset(50, '-1'),
        {
            message: 'The page query parameter must be a positive integer.',
            status: 400
        }
    );
});

test('rejects page zero', () => {
    assert.throws(() => getOffset(50, '0'), { status: 400 });
});

test('rejects non-numeric pages', () => {
    assert.throws(() => getOffset(50, 'abc'), { status: 400 });
});

test('treats an empty page value as 1', () => {
    assert.deepEqual(getOffset(50, ''), {
        pageSize: 50,
        offset: 0
    });
});

test('rejects whitespace-only page values', () => {
    assert.throws(() => getOffset(50, '   '), { status: 400 });
});


test('correctly parses query params for releaseYear', () => {
    const query = { releaseYear: '1994' };
    const { whereClauses, params } = buildWhereClause(query);

    assert.deepEqual(whereClauses, ['releaseDate LIKE $year']);
    assert.deepEqual(params, { $year: '1994%' });
});

test('correctly parses query params for genre', () => {
    const query = { genre: 'Drama' };
    const { whereClauses, params } = buildWhereClause(query);

    assert.deepEqual(whereClauses, ["EXISTS (SELECT 1 FROM json_each(movies.genres) AS g WHERE json_extract(g.value, '$.name') = $genre)"]);
    assert.deepEqual(params, { $genre: 'Drama' });
});

test('correctly parses query params for both releaseYear and genre', () => {
    const query = { releaseYear: '1994', genre: 'Drama' };
    const { whereClauses, params } = buildWhereClause(query);

    assert.deepEqual(whereClauses, [
        'releaseDate LIKE $year',
        "EXISTS (SELECT 1 FROM json_each(movies.genres) AS g WHERE json_extract(g.value, '$.name') = $genre)"
    ]);
    assert.deepEqual(params, { $year: '1994%', $genre: 'Drama' });
});

test('ignores unknown query parameters', () => {
    const query = { unknownParam: 'value' };
    const { whereClauses, params } = buildWhereClause(query);

    assert.deepEqual(whereClauses, []);
    assert.deepEqual(params, {});
});
