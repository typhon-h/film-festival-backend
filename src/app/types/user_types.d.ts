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

type User = {
    /**
     * User email as defined when created
     */
    email: string,
    /**
     * User first name as defined when created
     */
    first_name: string,
    /**
     * User last name as defined when created
     */
    last_name: string
}

type Image = {
    /**
     * Name of image file for User profile picture
     */
    image_filename: string
}

type Token = {
    /**
     * Active token for authorization
     */
    auth_token: string
}