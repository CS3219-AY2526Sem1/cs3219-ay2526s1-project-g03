import resend from '../config/resend';
import {NODE_ENV} from '../constants/env';

type Params = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const RSND_FROM_EMAIL = 'onboarding@resend.dev';
const RSND_TO_EMAIL = 'delivered@resend.dev';

const getToEmail = (to: string) => (NODE_ENV === 'development' ? RSND_TO_EMAIL : to);

export const sendEmail = async ({to, subject, text, html}: Params) =>
  resend.emails.send({
    from: RSND_FROM_EMAIL,
    to: getToEmail(to),
    subject,
    text,
    html,
  });
