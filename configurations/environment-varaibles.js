import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.IS_PRODUCTION) dotenv.config({ path: __dirname + "/.env" });

const port = process.env.PORT;

const mongodb_uri = process.env.MONGODB_URI;

const cors_config = JSON.parse(process.env.CORS_CONFIGURATION);

const server_config = JSON.parse(process.env.SERVER_CONFIGURATION);

const token_config = JSON.parse(process.env.TOKEN_CONFIGURATION);

const node_mailer_auth = JSON.parse(process.env.NODE_MAILER_AUTH);

export {
	port,
	mongodb_uri,
	cors_config,
	server_config,
	token_config,
	node_mailer_auth,
};
