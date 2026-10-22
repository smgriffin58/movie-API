export function getOffset(pageSize, page) {
    if (!page) {
        return {pageSize, offset: 0};
    }
    if (isNaN(page) || page < 1) {
        const err = new Error(
            'The page query parameter must be a positive integer.'
        );
        err.status = 400;
        throw err;
    }
    return {pageSize, offset: (page - 1) * pageSize};
}

export function buildWhereClause(query) {
    const whereClauses = [];
    const params = {};

    Object.keys(query).forEach((key) => {
        switch(key) {
            case 'releaseYear':
                whereClauses.push("releaseDate LIKE $year");
                params.$year = `${query.releaseYear}%`;
                break;
            case 'genre':
                whereClauses.push("EXISTS (SELECT 1 FROM json_each(movies.genres) AS g WHERE json_extract(g.value, '$.name') = $genre)");
                params.$genre = `${query.genre}`;
                break;
            case 'page':
            case 'order':
                // handled elsewhere
                break;
            default:
                console.log(`Ignoring unknown query parameter: ${key}`);
                break;
        }
    });

    return { whereClauses, params };
}
