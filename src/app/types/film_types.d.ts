type Film = {
    /**
    * Film id as defined by the database
    */
    id: number,
    /**
     * Film title as defined when created
     */
    title: string,
    /**
     * Film description as defined when created
     */
    description: string,
    /**
     * Film runtime as defined when created
     */
    runtime: number,
    /**
     * Film image as defined when created
     */
    image_filename: string,
    /**
     * Id for genre of the film as defined by the database
     */
    genre_id: number,
    /**
     * Age rating as defined when created
     */
    age_rating: string,
    /**
     * Film release date as defined when created
     */
    release_date: string
}
