import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (
    search: string = null,
    genreIds: number[] = null,
    ageRatings: string[] = null,
    directorId: number = null,
    reviewerId: number = null,
    sortBy: string = null): Promise<FilmResult[]> => {
    Logger.info(`Getting all films that match criteria`);

    const params = [];
    const conn = await getPool().getConnection();
    let query = "select film.id as filmId, title, genre_id as genreId, age_rating as ageRating, "
        + "user.id as directorId, user.first_name as directorFirstName, user.last_name as directorLastName, cast(coalesce(rating,0) as float) as rating, release_date as releaseDate "
        + "from film inner join user on film.director_id=user.id "
        + "left outer join (select film_id, round(avg(rating),2) as rating from film_review group by film_id) as ratings on ratings.film_id=film.id  "

    if (reviewerId !== null) {
        query += " inner join  (select film_id from film_review where user_id=?) as reviews on reviews.film_id = film.id ";
        params.push(reviewerId);
    }

    query += "where 1 ";

    if (search !== null) {
        query += "and (description LIKE ? or title LIKE ?) ";
        params.push('%' + search + '%');
        params.push('%' + search + '%');
    }

    if (genreIds !== null && genreIds.length > 0) {
        query += "and genre_id in (";
        for (const id of genreIds) {
            query += (genreIds.indexOf(id) === 0 ? "?" : ",?"); //TODO: fix duplicate id
            params.push(id);
        }
        query += ") ";
    }

    if (ageRatings !== null && ageRatings.length > 0) {
        query += "and age_rating in (";
        for (const rating of ageRatings) {
            query += (ageRatings.indexOf(rating) === 0 ? "?" : ",?");
            params.push(rating);
        }
        query += ") ";
    }

    if (directorId !== null) {
        query += " and director_id = ? ";
        params.push(directorId);
    }

    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            query += " order by title ASC ";
            break;
        case "ALPHABETICAL_DESC":
            query += " order by title DESC ";
            break;
        case "RELEASED_ASC":
            query += " order by release_date ASC ";
            break;
        case "RELEASED_DESC":
            query += " order by release_date DESC ";
            break;
        case "RATING_ASC":
            query += " order by rating ASC ";
            break;
        case "RATING_DESC":
            query += " order by rating DESC ";
            break;
        default: // RELEASED_ASC
            query += " order by release_date ASC ";
            break;
    }
    query += " , filmId ASC"; // id secondary sort

    const [result] = await conn.query(query, params);
    await conn.release();
    return result;

}

const getOne = async (id: number): Promise<Film[]> => {
    Logger.info(`Getting film ${id}`);

    const conn = await getPool().getConnection();
    const query = "select film.id as filmId, title, description, runtime, genre_id as genreId, "
        + " age_rating as ageRating, release_date as releaseDate, user.id as directorId, user.first_name as directorFirstName,  "
        + " user.last_name as directorLastName, cast(coalesce(rating,0) as float) as rating, coalesce(numReviews,0) as numReviews, film.image_filename  "
        + " from film inner join user on film.director_id=user.id "
        + " left outer join (select film_id, round(avg(rating),2) as rating from film_review group by film_id) as ratings on ratings.film_id=film.id "
        + " left outer join (select film_id, count(*) as numReviews from film_review group by film_id) as reviews on reviews.film_id=film.id "
        + " where film.id = ?";
    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;
}

const insert = async (
    title: string,
    description: string,
    releaseDate: string,
    genreId: number,
    runtime: number,
    ageRating: string,
    director: number): Promise<ResultSetHeader> => {
    Logger.info(`Inserting film ${title}`);

    const conn = await getPool().getConnection();
    const query = "insert into film (title, description, genre_id, runtime, director_id, release_date"
        + (ageRating !== undefined ? ", age_rating" : "")
        + ") "
        + " values(?,?,?,?,?"
        + (releaseDate !== undefined ? ",?" : ",now()")
        + (ageRating !== undefined ? ",?" : "")
        + ")";
    const params = [title, description, genreId, runtime, director];
    if (releaseDate !== undefined) { params.push(releaseDate); }
    if (ageRating !== undefined) { params.push(ageRating) }

    const [result] = await conn.query(query, params);
    await conn.release();
    return result;
}

const update = async (id: number,
    title: string,
    description: string,
    genreId: number,
    runtime: number,
    ageRating: string,
    releaseDate: string): Promise<ResultSetHeader> => {
    Logger.info(`Updating film ${title}`);

    const conn = await getPool().getConnection();
    const params = []
    let query = "update film set ";

    if (title !== undefined) {
        query += " title = ? ";
        params.push(title);
    }

    if (description !== undefined) {
        query += (params.length > 0 ? "," : "") + " description = ? ";
        params.push(description);
    }

    if (genreId !== undefined) {
        query += (params.length > 0 ? "," : "") + " genre_id = ? ";
        params.push(genreId);
    }

    if (runtime !== undefined) {
        query += (params.length > 0 ? "," : "") + " runtime = ? ";
        params.push(runtime);
    }

    if (ageRating !== undefined) {
        query += (params.length > 0 ? "," : "") + " age_rating = ? ";
        params.push(ageRating);
    }

    if (releaseDate !== undefined) {
        query += (params.length > 0 ? "," : "") + " release_date = ? ";
        params.push(releaseDate);
    }

    query += "where id = ?";
    params.push(id);


    const [result] = await conn.query(query, params);
    await conn.release();
    return result;
}

const remove = async (id: number): Promise<ResultSetHeader> => {
    Logger.info(`Deleting film id ${id}`);
    const conn = await getPool().getConnection();
    const query = "delete from film where id = ?";
    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;
}

const getAllGenres = async (): Promise<Genre[]> => {
    Logger.info(`Retrieving all genres`);
    const conn = await getPool().getConnection();
    const query = "select id as genreId, name from genre";
    const [result] = await conn.query(query);
    await conn.release();
    return result;
}


export { getAll, getOne, insert, update, remove, getAllGenres }