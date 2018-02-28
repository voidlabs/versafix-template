# Mosaico - Master Temaplates and MML template generator for Mosaico

Mosaico is a JavaScript library (or maybe a single page application) supporting the editing of email templates.
This repository contains the MML "sources" for the versafix-1 template. They are translated to HTML and directly used by mosaico.

### Build/Run

You need NodeJS v6.0 or higher + ImageMagick

```
  npm install
  npm run build
```

This will run, for each template, 3 things

- Generate the template HTML from the source MML code
- Copy the img files from def to dist.
- Generate the template model, or check the template model against previously generated models, to track compatibility issues
- Generate the template and block thumbnails (```edres``` folder) for the templates.

### Src vs Generated

```dist``` contains the final templates to be used in mosaico
```model``` contains generated model files, used to track compatility issues between builds.

### MML

MML is a very simple template language we use to make it easier to write mosaico master templates. Given the master template language uses a lot of inline styles, you end up writing a lot of repeating HTML code.

MML processing does this:

- Looks for ```<default selector="" attr1="" attr2="">``` tags, run the selector as a CSS/jQuery selector to find matching tags in the HTML and add the other attributes to those tags.

```
<default selector=".right" align="right">
<p class="right">hello</p>
```
will be translated to
```
<p class="right" align="right">hello</p>
```
It's like CSS inlining, but applied to HTML elements and HTML attributes!

- ```<template-def><template>``` the template-def tag contains template definitions and will be removed once template have been processed.

- ```<template tag="tagname">``` the template tag defines a new template that will be applied whenever the given tag is found in the html. Each ```<template>``` tag contains zero, one or more ```<def>``` tags and one ```<tmpl>``` tag. The ```<def attr="attrname">``` tags define attributes supported by the template. Their ```selector=""``` attributes define which tags inside the ```<tmpl>``` section will be altered when this attribute is declared for this template. The rest of the ```<def>``` attributes will be added to the matched tags. A special ```{{attributename}}``` is available in the attributes defined to use the value of the attribute from the template caller.

An example, when this template is defined
```
<template tag="mytemplate">
  <def attr="myattr" selector="table, .myclass" mynewattribute="{{myattr}}" />
  <tmpl>
  	<table><tr><td class="myclass">{{replacedcontent}}</td></tr></table>
  </tmpl>
</template>
```
The following code
```
<mytemplate myattr="somevalue">some content</mytemplate>
```
will be translated to
```
<table mynewattribute="somevalue"><tr><td class="myclass" mynewattribute="somevalue">some content</td></tr></table>
```

- Custom tags (and their templates) can be nested as long as ```{{replacedcontent}}``` is used in their ```<template><tmpl>``` definition.

- Not every ```<def>``` attribute is handled in the same way
	- ```style``` or ```addStyle``` attributes will ADD the defined style to the style declaration of the matched tag, instead of replacing it.
	- ```class``` attribute will ADD new classes to the classes defined in the matched tag, instead of replacing it.
	- ```addAttributeName``` and ```addAttributeValue``` are special attributes that can be used to add dynamically defined attributes to the matched tags.

- A ```<repeater>``` tag is available and will simply repeat the content according to the arguments. Any html attribute found in the repeater will be read, splitted by comma (```,```) and will be available as a ```{{variable}}``` in the content of the repeater, so:

```
<repeater var1="yellow,red,green" var2="10,20,30">
  <p style="color: {{var1}}">{{var2}}</p>
</repeater>
```
will be translated to
```
  <p style="color: yellow">10</p>
  <p style="color: red">20</p>
  <p style="color: green">30</p>
```

- Last thing: MML does someting tricky in order to deal with your conditional comments contents. Outlook conditional comments are often needed in email HTML code and this makes you write HTML code in special HTML comments. Being comments it is not really considered HTML by anyone but Outlook. But we want to do our MML stuff also on conditional comments contents, so MML will "unescape" them to bring them to HTML, then apply its own template rules/logic, and then bring back them to comments. The tags found inside comments will be prefixed by "CC-" before being extracted and they never create nesting, so:

```
<template tag="cctest">
<def attr="myattr" style="color: {{myattr}}" />
<tmpl>
<!--[if (ie)]><table><tr><td><!-->
<p>my content</p>
<!--[if (ie)]></td></tr></table><!-->
</tmpl>
```
Will be temporarily translated to 
```
<template tag="cctest">
<def attr="myattr" selector="cc-table" style="color: {{myattr}}" />
<def attr="wrongattr" selector="cc-table p" align="right" />
<tmpl>
<replacedcc condition="(ie)"><!-- cc:start --><cc-table><cc-tr><cc-td><!-- cc:end --></cc-td></cc-tr></cc-table></replacedcc>
<p>my content</p>
<replacedcc condition="(ie)"><cc-table><cc-tr><cc-td><!-- cc:start --></cc-td></cc-tr></cc-table><!-- cc:end --></replacedcc>
</tmpl>
```
The def rules will be applied on this new "template" and then a reverse process is applied to bring back them to their original "conditional comment" form.
So the ```<def attr="wrongattr">``` won't be applied, because in the "replaced" form the p is not INSIDE the cc-table because conditional comments do not create nesting levels.
So, given that template and this tag:
```
<cctest myattr="red" wrongattr="somethingelse" />
```
the result of MML translation will be
```
<!--[if (ie)]><table style="color: red"><tr><td><!-->
<p>my content</p>
<!--[if (ie)]></td></tr></table><!-->
```
You see the style have been applied to the table, even if it was in a comment.

### Done

The "MML" specification is complete. They are 200 lines of code and this matched my templating needs better than existing HTML template language.
