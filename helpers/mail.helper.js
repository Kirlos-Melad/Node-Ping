// Libraries
import NodeMailer from "nodemailer";

// Modules
import { node_mailer_auth } from "../configurations/environment-varaibles.js";

const DefaultMessages = {
	/**
	 *
	 * @param {String} name user name
	 * @param {String} otp One Time Password
	 * @param {Number} duration duration before expiration
	 * @param {String} unit unit of duration
	 * @returns
	 */
	CheckStatusAlert: (user_name, check_name, check_status) =>
		`
		<p>Greetings ${user_name},</p>
		<p>It seems that your check <strong>${check_name} went ${check_status}</strong>.</p>

		<p>Best Regards,</p>
		<p>Node Ping Team</p>

		`,
};

async function SendMail({ mail_list, subject, message }) {
	const node_mailer = NodeMailer.createTransport({
		service: node_mailer_auth.service,
		auth: {
			type: "oauth2",
			user: node_mailer_auth.user_address,
			pass: node_mailer_auth.user_password,
			clientId: node_mailer_auth.client_id,
			clientSecret: node_mailer_auth.client_secret,
			refreshToken: node_mailer_auth.refresh_token,
		},

		debug: true,

		tls: {
			rejectUnauthorized: false,
		},
	});

	const result = await node_mailer.sendMail({
		from: {
			name: node_mailer_auth.user_name,
			address: node_mailer_auth.user_address,
		},
		to: mail_list,
		subject: subject,
		html: message,
	});

	return result;
}

export default Object.freeze({ SendMail, DefaultMessages });
