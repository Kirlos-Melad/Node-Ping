// Libraries
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CheckTagSchema = new Schema(
	{
		check_id: {
			type: Schema.Types.ObjectId,
			ref: "checks",
			required: [true, "{PATH} not found"],
		},

		tag_name: {
			type: String,
			required: [true, "{PATH} not found"],
		},

		created_at: Number,
	},

	{
		timestamps: {
			// Make mongoose use ms
			currentTime: () => Date.now(),

			// Change default variable names
			createdAt: "created_at",
			updatedAt: false,
		},

		// Disable version key (__v)
		versionKey: false,
	},
);

CheckTagSchema.index({ check_id: 1, tag_name: 1 }, { unique: 1 });

const ChecksTagsDocument = mongoose.model("checks_tags", CheckTagSchema);

/**
 *
 * @param {*} check_tag_obj object to create new check_tag
 * 	- `check_id (ObjectId)`
 * 	- `tag_list String[]`
 * @param {*} param1
 */
async function Create({ check_id, tag_list }, { session }) {
	try {
		// Create User  with the given session
		// We must pass array as first arg if options are being passed
		// The result is an array of created documents
		// So we pick the first value as we only created one !
		const [result] = await ChecksTagsDocument.create(
			tag_list.map((tag_name) => {
				return { check_id, tag_name };
			}),
			{ session },
		);

		// Return the
		return { error: null, result: result._doc };
	} catch (error) {
		return { error, result: null };
	}
}

export default Object.freeze({ Create });
