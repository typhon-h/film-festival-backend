type AuthenticateRequest = {
    /**
    * User id as defined by the database
    */
    id: number,
    /**
     * User password hashed as entered when created
     */
    password: string
}