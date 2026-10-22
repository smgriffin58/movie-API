# Movie API

Full disclosure, I did spend a little longer than 2 hours on this. I was enjoying it and wanted to keep working on it. The requirements were pretty clear for the most part. There were a few things that I think could have been interpreted differently, so if I wasn't 100% sure I described my thought process below. I did use chatGPT (and google) for some of the code and a good chunk of the tests.

- I obviously wouldn't normally commit database files, but I figured if you are going to pull this down to look at it they would be there for you to use
- I am operating under the assumption that unless it is explicity called out in the AC that fields should not be formatted uniquely. Budget was requested to be displayed in dollars, so I did that. But I left the genre and productionStudios fields as they are in the DB.
- I started from page 1. If no page param was sent, I assume page 1. If a page param of 0 is sent, I throw an error.
- I rounded the average rating to 2 decimal points. It wasn't explicitly called out in the AC but displaying 15 decimal places seemed unnecessary
- If /movies/:id is called with a movie that does not exist, the API throws a 404. If a movie has no ratings, I returned the movie with an average rating of null. I could also see wanting to return an empty array here since there are no reviews. I definitely would do it that was if the endpoint was just supposed to return all reviews for a movie, but given that it is the average/movie details I'm not entirely sure


# Running the API
To run the app
- npm start

To run tests
- npm start (API must be running for integration tests)
- npm test (in another terminal)

# API Endpoints
## GET /movies
- This endpoint returns a paginated list of movies that match certain critera.
- Query Parameters:
    - genre
    - releaseYear
    - order (ASC or DESC, defaults to ASC)
    - page (must be a positive integer, defaults to 1). The page size is 50
Example Response:
```json
[
  {
    "imdbId": "tt0111161",
    "title": "The Shawshank Redemption",
    "genres": "[{\"name\":\"Drama\"}]",
    "releaseDate": "1994-09-23",
    "budget": "$25,000,000"
  }
]
```

## GET /movies/:id
- This endpoint returns information about a given movie
- Path Parameters: movieId
- Example Response:
```json
{
    "imdbId": "tt0111161",
    "title": "The Shawshank Redemption",
    "genres": "[{\"name\":\"Drama\"}]",
    "releaseDate": "1994-09-23",
    "budget": "$25,000,000",
    "averageRating": 3.3
}
```