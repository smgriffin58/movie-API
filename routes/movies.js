import { Router } from 'express';
import { getOffset, buildWhereClause } from '../util.js';

export function createMoviesRouter({ moviesDb }) {
    const router = Router();

    router.get("/", (req, res, next) => {
        try {
            const { pageSize, offset } = getOffset(50, req.query.page);
            const whereClause = buildWhereClause(req.query);
            // in the future, we could add support for sorting by other fields, but for now we'll just sort by releaseDate since that is the only one specified in the readme
            const sortOrder = req.query.order && req.query.order.toLowerCase() === "desc" ? "DESC" : "ASC";

            let sql = `SELECT imdbId, title, genres, releaseDate, printf('$%,d', budget) as budget 
                        FROM movies ${whereClause.whereClauses.length > 0 ? 'WHERE ' + whereClause.whereClauses.join(' AND ') : ''} 
                        ORDER BY releaseDate ${sortOrder} LIMIT $pageSize OFFSET $offset;`;

            moviesDb.all(sql, { ...whereClause.params, $pageSize: pageSize, $offset: offset }, (err, rows) => {
                if (err) {
                    return next(err);
                } else {
                    res.json(rows);
                }
            });
        } catch (err) {
            return next(err);
        }
    });

    router.get("/:id", (req, res, next) => {
        let sql = `SELECT imdbId, title, overview as description, releaseDate, printf('$%,d', budget) as budget, runtime, ROUND(AVG(rating), 2) as averageRating, genres, language as originalLanguage, productionCompanies 
                            FROM main.movies as movies
                            LEFT JOIN ratings.ratings as ratings ON movies.movieId = ratings.movieId
                            WHERE movies.movieId = $movieId
                            GROUP BY movies.movieId;`;

        moviesDb.get(sql, { $movieId: req.params.id }, (err, row) => {
            if (err) {
                return next(err);
            }
            if (!row) {
                return res.status(404).json({ error: "Movie not found" });
            }
            res.json(row);
        });
    });

    return router;
}
