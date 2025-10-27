import {Resend} from 'resend';
import {RESEND_API_KEY} from '../constants/env';

// https://resend.com/onboarding
const resend = new Resend(RESEND_API_KEY);

export default resend;
