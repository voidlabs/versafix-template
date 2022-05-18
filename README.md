# Mosaico - Master Template and HTMML template generator for Mosaico

Mosaico is a JavaScript library (or maybe a single page application) supporting the editing of email templates.
This repository contains the [HTMML](https://github.com/voidlabs/htmml) "sources" for the versafix-1 template. They are translated to HTML and directly used by mosaico.

![Here is a thumbnail of the template:](https://github.com/voidlabs/versafix-template/blob/master/dist/template/edres/_full.png?raw=true)

### Build/Run

You need NodeJS v6.0 or higher + ImageMagick

```javascript
  npm install
  # run this to generate the htmml for the non english language
  npm run translate
  # run this to generate final templates starting from htmml files
  npm run build
```

This will run, for each template, 3 things

- Generate the template HTML from the source HTMML code
- Copy the img files from def to dist.
- Generate the template model, or check the template model against previously generated models, to track compatibility issues
- Generate the template and block thumbnails (```edres``` folder) for the templates.

```javascript
  # run this to generate the htmml for the non english language
  npm run translate
```

This will generate the italian HTMML template starting from the english one and the translation definition JSON file.
Given this overwrite a file in the template-def folder be care to not loose your local changes.
If you use this translation then you probably want to run the translate task before the build task.

### Src vs Generated

```dist``` contains the final templates to be used in mosaico
```model``` contains generated model files, used to track compatility issues between builds.

### HTMML

[HTMML](https://github.com/voidlabs/htmml) is a very simple template language we use to make it easier to write mosaico master templates.
