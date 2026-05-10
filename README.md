# Greek Parsing

A local web app for Koine Greek parsing practice. It supports New Testament verse selection, A4 worksheet layout, lesson groups, local practice drafts, standard answers, and print-friendly exercises.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Safari fallback

After changing `src/app.js`, rebuild the standalone fallback:

```bash
npm run build:standalone
```
