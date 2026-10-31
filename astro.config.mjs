import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.paliokaliva.gr',
  trailingSlash: 'always',
  // Pages are built as static files. Only the form endpoints under src/pages/api
  // run on the server, which is why the site needs the Node adapter.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  build: {
    inlineStylesheets: 'auto',
  },
  env: {
    schema: {
      // Postmark "Server API token". Without it, forms only work in `pnpm dev`,
      // where the emails are printed in the terminal instead of being sent.
      POSTMARK_SERVER_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      POSTMARK_MESSAGE_STREAM: envField.string({ context: 'server', access: 'secret', default: 'outbound' }),
      // The verified sender in Postmark, and the hotel address that receives the requests.
      MAIL_FROM: envField.string({ context: 'server', access: 'secret', default: 'mailer@webartworks.gr' }),
      MAIL_TO: envField.string({ context: 'server', access: 'secret', default: 'info@paliokaliva.gr' }),
      // Signs the forms' time token (src/lib/antispam.ts). Optional: without it the
      // key is derived from POSTMARK_SERVER_TOKEN.
      ANTISPAM_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
