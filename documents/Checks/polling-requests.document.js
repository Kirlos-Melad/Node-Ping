// Libraries
import mongoose from "mongoose";

// Modules
import ServerError from "../../classes/server-error.js";

const PollingRequestStatus = Object.freeze({
	UP: 1,
	DOWN: 2,
});

const Schema = mongoose.Schema;

const PollingRequestStatusSchema = new Schema(
	{
		type: {
			type: Number,
			enum: {
				values: PollingRequestStatus,
				message: "{VALUE} is not supported",
			},
			required: [true, "{PATH} not found"],
		},

		time: {
			type: Number,
			required: [true, "{PATH} not found"],
		},
	},
	{
		_id: false,
		versionKey: false,
	},
);

const PollingRequestSchema = new Schema(
	{
		check_id: {
			type: Schema.Types.ObjectId,
			ref: "checks",
			required: [true, "{PATH} not found"],
		},

		response_time: {
			type: Number,
			required: [true, "{PATH} not found"],
		},

		status: PollingRequestStatusSchema,

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

PollingRequestSchema.index({ created_at: -1 });

const PollingRequestsDocument = mongoose.model(
	"polling_requests",
	PollingRequestSchema,
);

async function Create({ check_id, status, response_time }) {
	try {
		const result = await PollingRequestsDocument.create({
			check_id,
			status,
			response_time,
		});

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

export default { Create };
export { PollingRequestStatus };
