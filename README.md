# Tulum Innovation Fest — Static Home

A self-contained HTML home page designed for GitHub + Vercel.

## Deploy

1. Copy the project into a GitHub repository.
2. Add the image assets listed below to `/assets`.
3. Import the repository in Vercel.
4. Choose **Other** as the framework preset.
5. Leave the build command empty.
6. Set the output directory to `.`

## Required assets

Place optimized WebP/JPG files inside `/assets`:

- `tif-hero.webp`
- `tif-community.webp`
- `tif-audience.webp`
- `ikal-arena.webp`
- `vr-club.webp`
- `tif-final.webp`
- `og-tulum-innovation-fest.jpg`
- `favicon.svg`

The CSS includes dark gradient fallbacks, so the page remains usable before the assets are added.

## Form integration

The form currently runs in demo mode.

Recommended options:

- HubSpot form endpoint
- Formspree
- Vercel serverless function + Resend
- CRM webhook

Search for `FORM INTEGRATION` inside `index.html`.

## Before launch

- Replace placeholder domain in canonical / OG / JSON-LD values.
- Add privacy and terms pages.
- Connect analytics events.
- Compress all images.
- Validate copy, pricing and program details.
- Replace text partner logos with approved SVG logos.
- Add real testimonials only after approval.
