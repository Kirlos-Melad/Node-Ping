// Libraries
import mongoose from "mongoose";

// Modules
import ServerError from "../../classes/server-error.js";

const Schema = mongoose.Schema;

const TagSchema = new Schema(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: [true, "{PATH} not found"],
		},

		name: {
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

TagSchema.index({ user_id: 1, name: 1 }, { unique: 1 });

const TagsDocument = mongoose.model("tags", TagSchema);

async function Create({ user_id, name }) {}

async function FindByUserId({ user_id }) {
	try {
		const result = await TagsDocument.find({ user_id }).lean().exec();

		return { error: null, result: result };
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

export default Object.freeze({ Create, FindByUserId });
