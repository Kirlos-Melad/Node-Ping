// Libraries
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Modules
import ServerError from "../classes/server-error.js";
import validatorHelper from "../helpers/validator.helper.js";

const Schema = mongoose.Schema;

const UsersSchema = new Schema(
	{
		email: {
			type: String,
			unique: true,
			required: [true, "{PATH} not found"],
			lowercase: true,
			trim: true,
		},

		email_verified: {
			type: Boolean,
			default: false,
		},

		roles: {
			type: [],
			required: [true, "{PATH} not found"],
		},

		// Required if (Default Login is True)
		password: {
			type: String,
			required: [true, "{PATH} not found"],
		},

		created_at: Number,
		updated_at: Number,
	},

	{
		timestamps: {
			// Make mongoose use ms
			currentTime: () => Date.now(),

			// Change default variable names
			createdAt: "created_at",
			updatedAt: "updated_at",
		},

		// Disable version key (__v)
		versionKey: false,
	},
);

UsersSchema.index({ email: 1 });

UsersSchema.pre("save", function (next) {
	try {
		if (!this.email)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"email wasn't provided",
				ServerError.Handlers.CLIENT,
			);
		else if (!validatorHelper.IsEmail(this.email))
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"email not valid",
				ServerError.Handlers.CLIENT,
			);

		if (!this.password)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"password wasn't provided",
				ServerError.Handlers.CLIENT,
			);
		else if (!validatorHelper.IsStrongPassword(this.password)) {
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"password isn't strong enough",
				ServerError.Handlers.CLIENT,
			);
		} else {
			const salt = bcrypt.genSaltSync();
			this.password = bcrypt.hashSync(this.password, salt);
		}

		// All is good
		next();
	} catch (error) {
		next(error);
	}
});

const UsersDocument = mongoose.model("users", UsersSchema);

async function Create({ email, password }, { session }) {
	try {
		const _id = new mongoose.Types.ObjectId();
		const roles = [_id];

		// Create User  with the given session
		// We must pass array as first arg if options are being passed
		// The result is an array of created documents
		// So we pick the first value as we only created one !
		const [result] = await UsersDocument.create(
			[{ _id, email, password, roles }],
			{
				session,
			},
		);

		// Return the
		return { error: null, result: result._doc };
	} catch (error) {
		return { error: error, result: null };
	}
}

async function ValidateEmailAndPassword({ email, password }) {
	try {
		const result = await UsersDocument.findOne({
			email,
		});

		if (!result)
			throw new ServerError(
				ServerError.CustomNames.MISSING_VALUE,
				"Invalid email or password",
				ServerError.Handlers.CLIENT,
			);

		// Compare the passwords
		const matched = bcrypt.compareSync(password, result.password);

		if (!matched)
			throw new ServerError(
				ServerError.CustomNames.INVALID_VALUE,
				"Invalid email or password",
				ServerError.Handlers.CLIENT,
			);

		return { error: null, result };
	} catch (error) {
		// Return the error As-Is if already Server Error
		if (error instanceof ServerError) return { error, result: null };
		// Else return the error after converting it to Server Error
		else
			return {
				error: ServerError.CreateFromError(
					error,
					ServerError.Handlers.SERVER,
				),
				result: null,
			};
	}
}

export default Object.freeze({ Create, ValidateEmailAndPassword });
