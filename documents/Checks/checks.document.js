// Libraries
import mongoose from "mongoose";
import ms from "ms";

const Schema = mongoose.Schema;

const CheckSchema = new Schema(
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

		url: {
			type: String,
			required: [true, "{PATH} not found"],
		},

		path: {
			type: String,
			default: "",
		},

		port: {
			type: Number,
			required: [true, "{PATH} not found"],
		},

		webhook: {
			type: String,
			default: "",
		},

		timeout: {
			type: Number,
			default: ms(`5 seconds`),
		},

		interval: {
			type: Number,
			default: ms(`10 minutes`),
		},

		threshold: {
			type: Number,
			default: 1,
		},

		headers: {
			type: {},
			default: {},
		},

		assert: {
			type: {},
			default: {},
		},

		ignore_ssl: {
			type: Boolean,
			default: false,
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

CheckSchema.index({ user_id: 1, name: 1 }, { unique: 1 });

const ChecksDocument = mongoose.model("checks", CheckSchema);

async function Create(
	{
		user_id,
		name,
		url,
		path,
		port,
		webhook,
		timeout,
		interval,
		threshold,
		headers,
		assert,
		ignore_ssl,
	},
	{ session },
) {
	try {
		const [result] = await ChecksDocument.create(
			[
				{
					user_id,
					name,
					url,
					path,
					port,
					webhook,
					timeout,
					interval,
					threshold,
					headers,
					assert,
					ignore_ssl,
				},
			],
			{ session },
		);

		return { error: null, result: result._doc };
	} catch (error) {
		return { error: error, result: null };
	}
}

export default Object.freeze({ Create });
