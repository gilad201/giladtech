# giladtech.io

The infrastructure and source behind [giladtech.io](https://giladtech.io), my
portfolio site.

The site is plain HTML/CSS/JS on **Cloudflare Pages**, and everything around it
(Pages project, custom domains, DNS) is managed with Terraform. It runs for $0/month.

```
main.tf / variables.tf          Cloudflare provider and inputs
portfolio.tf                    Pages project, giladtech.io + www domains, DNS records
services/gilad-portfolio/site   the portfolio (no build step)
services/python-api             small Flask API, once deployed on the old GKE stack
archive/legacy-gcp              the previous setup: GKE, nginx ingress, HTTPS load balancer,
                                GCS and Cloud Build (retired, kept for reference)
```

## Run it yourself

You need a Cloudflare zone and an API token with
**Account > Cloudflare Pages: Edit** and **Zone > DNS: Edit**.

```sh
cp terraform.tfvars.example terraform.tfvars   # fill in token, account ID, zone ID
terraform init
terraform plan
terraform apply
```

Then deploy the site:

```sh
npx wrangler login   # once
npx wrangler pages deploy services/gilad-portfolio/site \
  --project-name gilad-portfolio --branch main
```

Every deploy also gets a preview URL. Custom domains go live once Cloudflare
validates them, usually within a few minutes.

## Editing the portfolio

- Text: `services/gilad-portfolio/site/index.html`
- After changing `styles.css` or `main.js`, bump its `?v=` in `index.html`
  (`shasum styles.css | cut -c1-8`), or Cloudflare's edge keeps serving the old file
- Drum videos: add YouTube links to `window.DRUM_VIDEOS` near the bottom of `index.html`
- CV: `services/gilad-portfolio/site/assets/Gilad_Wein_CV.pdf` (the "Download CV" button)
