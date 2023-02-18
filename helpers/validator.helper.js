// Libraries
import validator from "validator";

/**
 * 
 * @param {String} password 
 * @returns 
 */
function IsStrongPassword(password) {
	return validator.isStrongPassword(password, {
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
		returnScore: false,
	});
}

/**
 * 
 * @param {String} email 
 * @returns 
 */
function IsEmail(email) {
	return validator.isEmail(email);
}

export default Object.freeze({ IsStrongPassword, IsEmail });
