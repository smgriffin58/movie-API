import sqlite3 from 'sqlite3';

export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const moviesDb = new sqlite3.Database(
            'db/movies.db',
            sqlite3.OPEN_READONLY,
            (err) => {
                if (err) {
                    reject(err);
                    return;
                }
            }
        );
        moviesDb.run("ATTACH DATABASE 'db/ratings.db' AS ratings", (err) => {
            if (err) {
                moviesDb.close(() => { });
                reject(err);
                return;
            }
        });

        resolve(moviesDb);
    });
}
