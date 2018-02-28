# Mosaico - Master Template and HTù template generator for Mosaico

Mosaico is a JavaScript library (or maybe a single page application) supporting the editing of email templates.
This repository contains the [HTMML](https://github.com/voidlabs/htmml) "sources" for the versafix-1 template. They are translated to HTML and directly used by mosaico.

![Here is a thumbnail of the template:](https://github.com/voidlabs/versafix-template/blob/master/dist/template/edres/_full.png?raw=true)

### Build/Run

You need NodeJS v6.0 or higher + ImageMagick

```javascript
  npm install
  npm run build
```

This will run, for each template, 3 things

- Generate the template HTML from the source HTMML code
- Copy the img files from def to dist.
- Generate the template model, or check the template model against previously generated models, to track compatibility issues
- Generate the template and block thumbnails (```edres``` folder) for the templates.

### Src vs Generated

```dist``` contains the final templates to be used in mosaico
```model``` contains generated model files, used to track compatility issues between builds.

### HTMML

[HTMML](https://github.com/voidlabs/htmml) is a very simple template language we use to make it easier to write mosaico master templates.
