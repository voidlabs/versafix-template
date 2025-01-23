"use strict";
const translator = require('./translator')
const myArgs = process.argv.slice(2);
// test mode tries to regenerate translated templates and check they are unchanged (you have to run translate and commit *before* releasing)
// it fails either if the translated template is different from the existing file or if there are untranslated strings
const tmp = require('tmp');
const fs = require('fs');
const test = myArgs.length > 0 && myArgs[0] == 'test';

var templates = [{
	// Italian translation
	'translateSrc': './template-def/template-versafix-1.htmml',
	'translateDef': './template-def/template-versafix-1.it.json',
	'htmml': './template-def/template-versafix-1.it.htmml',
},{
	// Voxmail template
	'translateSrc': './template-def/template-versafix-1.it.htmml',
	'translateDef': './template-def/template-versafix-1.voxmail.json',
	'htmml': './template-def/template-versafix-1.voxmail.htmml',
},{
	// French translation
	'translateSrc': './template-def/template-versafix-1.htmml',
	'translateDef': './template-def/template-versafix-1.fr.json',
	'htmml': './template-def/template-versafix-1.fr.htmml',
}];

var ok = true;
var htmmlFile, translationOK, translationEquals, a, b;
for (var i = 0; i < templates.length; i++) {
	var res;
	if (test) {
		htmmlFile = tmp.fileSync().name;
		translationOK = translator(templates[i].translateSrc, templates[i].translateDef, htmmlFile, false);
		if (!translationOK) console.warn("Found untranslated strings for", templates[i].translateSrc, "in", templates[i].translateDef);
		ok = translationOK && ok;
		a = fs.readFileSync(htmmlFile);
		b = fs.readFileSync(templates[i].htmml);
		translationEquals = a.compare(b) === 0;
		if (!translationEquals) console.warn("Automatic translation for", templates[i].translateSrc, "differs from saved translated file", templates[i].htmml);
		ok = translationEquals && ok;
	} else {
		ok = translator(templates[i].translateSrc, templates[i].translateDef, templates[i].htmml, false) && ok;
	}

}

if (!ok) process.exitCode = 1;