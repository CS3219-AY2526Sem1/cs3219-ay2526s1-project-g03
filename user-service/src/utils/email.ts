import resend from '../config/resend';
import {NODE_ENV} from '../constants/env';
import {EMAIL_SENDER} from '../constants/env';

type Params = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const RSND_FROM_EMAIL = EMAIL_SENDER;
const RSND_TO_EMAIL = 'delivered@resend.dev';

/**
 * Retrieves the email address of the sender based on the application environment.
 *
 *
 * @param to The email address to be used.
 * @returns `to` if in production, else `RSND_TO_EMAIL`.
 */
const getToEmail = (to: string) => (NODE_ENV === 'development' ? RSND_TO_EMAIL : to);

/**
 * Sends an email using Resend API.
 *
 * @param to The email address of the sender.
 * @param subject The subject of the email.
 * @param text The alternative text of the email.
 * @param html HTML formatting of the email.
 * @returns
 */
export const sendEmail = async ({to, subject, text, html}: Params) =>
  resend.emails.send({
    from: RSND_FROM_EMAIL,
    to: getToEmail(to),
    subject,
    text,
    html,
  });
