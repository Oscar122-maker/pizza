# Peter Don's Pizza: Yoco and orders setup

The storefront now supports two checkout paths:

- **Pay securely with Yoco** creates a server-side Yoco Checkout and redirects the customer to Yoco.
- **Order by WhatsApp** saves the order first, then opens WhatsApp with the order reference.

Orders are stored in Netlify Blobs. Customer name and phone number are only written by the server after the request passes validation. A Yoco order is marked `paid` only after the signed Yoco webhook is verified.

## Netlify environment variables

Add these in Netlify under **Site configuration → Environment variables**. Use separate values for the test and production deploy contexts.

```text
YOCO_SECRET_KEY=sk_test_your_yoco_secret_key
YOCO_WEBHOOK_SECRET=whsec_your_registered_webhook_secret
SITE_URL=https://your-site.netlify.app
ORDERS_ADMIN_TOKEN=use-a-long-random-private-token
```

`YOCO_SECRET_KEY` must be a Yoco secret key. It is read only by the Netlify Function and never sent to the browser. Start with a Yoco test key while validating the flow; switch to a live key only after the site is deployed on a verified domain.

## Register the Yoco webhook

After the site has a public HTTPS URL, register one webhook against:

```text
https://your-site.netlify.app/api/yoco-webhook
```

The Yoco API request is:

```bash
curl https://payments.yoco.com/api/webhooks \
  -X POST \
  -H "Authorization: Bearer $YOCO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Peter Don\u0027s Pizza","url":"https://your-site.netlify.app/api/yoco-webhook"}'
```

Yoco returns a webhook secret once. Copy that value into `YOCO_WEBHOOK_SECRET` immediately and redeploy. Do not commit either secret to this project.

## Local development

Install dependencies and run Netlify's local proxy from this folder:

```bash
npm install
npm run dev
```

The storefront will be available at the Netlify Dev URL, normally `http://localhost:8888`. Netlify Blobs uses the local development environment while `netlify dev` is running.

## Viewing saved orders

There is a private read-only endpoint for a future admin dashboard or a secure internal tool:

```bash
curl https://your-site.netlify.app/api/orders \
  -H "x-orders-admin-token: use-a-long-random-private-token"
```

Keep `ORDERS_ADMIN_TOKEN` private. The current public storefront does not expose this endpoint or the saved customer records.

## Before presenting the live payment flow

1. Deploy the site to Netlify.
2. Add the four environment variables above.
3. Register the webhook and save its one-time secret.
4. Test with Yoco's test key and test payment details.
5. Confirm a successful payment produces a `paid` record at `/api/orders`.
6. Only then switch the site to the live Yoco key and verified production domain.

Official references: [Yoco Checkout API](https://developer.yoco.com/api-reference/checkout-api/checkout/create-checkout), [Yoco authentication](https://developer.yoco.com/docs/checkout-api/authentication), [Yoco webhooks](https://developer.yoco.com/docs/api/webhooks/verifying-events).
