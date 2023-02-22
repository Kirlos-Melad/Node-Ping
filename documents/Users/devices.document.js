// Libraries
import mongoose from "mongoose";

// Modules
import ServerError from "../../classes/server-error.js";

const Schema = mongoose.Schema;

const DeviceSchema = new Schema(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: [true, "{PATH} not found"],
		},

		client_id: {
			type: String,
			required: [true, "{PATH} not found"],
		},

		refresh_uuid: {
			type: String,
			required: [true, "{PATH} not found"],
		},

		access_uuid: {
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

// Create composite key
DeviceSchema.index({ user_id: 1, client_id: 1 }, { unique: 1 });

const DevicesDocument = mongoose.model("devices", DeviceSchema);

async function CreateOrUpdate(
	{ user_id, client_id, access_uuid, refresh_uuid },
	{ session },
) {
	try {
		// Create OR Update Device  with the given session
		const result = await DevicesDocument.findOneAndUpdate(
			{ user_id, client_id },
			{
				access_uuid,
				refresh_uuid,
			},
			{ session, upsert: true, new: true },
		)
			.lean()
			.exec();

		// Return the
		return { error: null, result: result };
	} catch (error) {
		return { error: error, result: null };
	}
}

async function FindByClientId({ user_id, client_id }) {
	try {
		const result = await DevicesDocument.findOne({ user_id, client_id })
			.lean()
			.exec();

		// Return the
		return { error: null, result: result };
	} catch (error) {
		return { error: error, result: null };
	}
}

export default Object.freeze({ CreateOrUpdate, FindByClientId });
