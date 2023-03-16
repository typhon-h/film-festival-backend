type Film = {
    /**
    * Film id as defined by the database
    */
    filmId: number,
    /**
     * Film title as defined when created
     */
    title: string,
    /**
     * Film description as defined when created
     */
    description: string,
    /**
    * Id for genre of the film as defined by the database
    */
    genreId: number,
    /**
     * Id of the user that directed the film
    */
    directorId: number,
    /**
     * First name of the user that directed the film
     */
    directorFirstName: string,
    /**
     * Last name of the user that directed the film
     */
    directorLastName: string,
    /**
    * Date film was released
    */
    releaseDate: string,
    /**
    * Age rating as defined when created
    */
    ageRating: string,
    /**
     * Film runtime as defined when created
     */
    runtime: number,
    /**
     * Average rating across film reviews
     */
    rating: number,
    /**
     * Number of ratings film has received
     */
    numReviews: number
}

type FilmResult = {
    /**
     * Id of the film
     */
    filmId: number,
    /**
     * Title of the film as defined when created
     */
    title: string,
    /**
     * Id of the genre of the film
     */
    genreId: number,
    /**
     * Age classification restricted to an enum
     */
    ageRating: string,
    /**
     * Id of the director of the film
     */
    directorId: number,
    /**
     * First name of the director of the film
     */
    directorFirstName: string,
    /**
     * 
     */
    directorLastName: string,
    /**
     * Average rating across reviews
     */
    rating: number,
    /**
     * Date film was released
     */
    releaseDate: string
}

type Genre = {
    /**
     * Id of the genre defined by the database
     */
    genreId: number,
    /**
     * Name of the genre as defined when created
     */
    name: string
}
