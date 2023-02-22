// Libraries
import moment from "moment";
import mongoose from "mongoose";

// Modules
import dateHelper from "../../Helpers/date.helper.js";
import ServerError from "../../classes/server-error.js";

const Schema = mongoose.Schema;

const RequestSchema = new Schema(
	{
		_id: false,

		route: {
			type: String,
			default: "",
		},

		headers: {
			type: Schema.Types.Mixed,
			default: {},
		},

		parameters: {
			type: Schema.Types.Mixed,
			default: {},
		},

		query: {
			type: Schema.Types.Mixed,
			default: {},
		},

		body: {
			type: Schema.Types.Mixed,
			default: {},
		},
	},

	{
		// Disable version key (__v)
		versionKey: false,
	},
);

const OperationType = Object.freeze(["POST", "GET", "PATCH", "DELETE"]);

const OperationSchema = new Schema(
	{
		_id: false,

		executer_id: {
			type: Schema.Types.ObjectId,
			required: [true, "{PATH} not found"],
		},

		type: {
			type: String,
			enum: {
				values: OperationType,
				message: "{VALUE} is not supported",
			},

			required: [true, "{PATH} not found"],
		},

		result: {
			type: Schema.Types.Mixed,
			required: [true, "{PATH} not found"],
		},
	},

	{
		// Disable version key (__v)
		versionKey: false,
	},
);

const LogType = Object.freeze({
	// Information
	INFORMATION: "Information",

	// Error
	CLIENT_ERROR: "ClientError",
	SERVER_ERROR: "ServerError",

	// Debug
	DEBUG: "Debug",
});

const LogSchema = new Schema(
	{
		type: {
			type: String,
			enum: {
				values: Object.values(LogType),
				message: "{VALUE} is not supported",
			},

			required: [true, "{PATH} not found"],
		},

		// Request information
		request: RequestSchema,

		// Operation done in server
		operation: OperationSchema,

		// Server message
		message: {
			type: String,
			required: [true, "{PATH} not found"],
		},

		// Date of the log
		date: {
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

LogSchema.index({ created_at: -1 });

const LogsDocument = mongoose.model("logs", LogSchema);

/**
 *
 * @param {Object} logs Data to be logged
 * 	- `type` (LogType)
 * 	- `request` (RequestSchema)
 * 	- `operation` (OperationSchema)
 * 	- `message` (String)
 * @returns
 */
async function Create({ type, request, operation, message }) {
	try {
		const result = await LogsDocument.create({
			type,
			request,
			operation,
			message,
			date: dateHelper.DateFormaterLong(moment()),
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
export { LogType, OperationType };
