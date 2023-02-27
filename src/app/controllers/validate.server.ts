// TODO: check for best practice way of defining this file
import * as schemas from '../resources/schemas.json'
import Ajv from 'ajv';
import addFormats from "ajv-formats"

const ajv = new Ajv({ removeAdditional: 'all', strict: false, validateFormats: true });
addFormats(ajv);

const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if (!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

export { validate, schemas }