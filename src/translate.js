"use strict";
const translator = require('./translator')

var templates = [{
	'translateSrc': './template-def/template-versafix-1.htmml',
	'translateDef': './template-def/template-versafix-1.it.json',
	'htmml': './template-def/template-versafix-1.it.htmml',
}];

for (var i = 0; i < templates.length; i++) {
	translator(templates[i].translateSrc, templates[i].translateDef, templates[i].htmml);
}
