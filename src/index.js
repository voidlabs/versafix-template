"use strict";

const htmml2html = require('htmml');
const makeThumbs = require('./makeThumbs');
const checkTemplateDefs = require('./checkTemplateDefs');
const fse = require('fs-extra');
const replace = require('replace-in-file');
const pkg = require('../package.json');
const tmp = require('tmp');
const myArgs = process.argv.slice(2);
const test = myArgs.length > 0 && myArgs[0] == 'test';

var templates = [ { 
	// Default template
	'htmml': './template-def/template-versafix-1.htmml', 
	'html': './dist/template/template-versafix-1.html',
	'tdDir': './template-def/',
	'destDir': './dist/template/',
	'modelPrefix': './model/template-versafix-1'
}, {
	// Italian template
	'htmml': './template-def/template-versafix-1.it.htmml',
	'html': './dist/template.it/template-versafix-1.it.html',
	'tdDir': './template-def/',
	'destDir': './dist/template.it/',
	'modelPrefix': './model/template-versafix-1.it'
}, {
	// Voxmail template
	'htmml': './template-def/template-versafix-1.voxmail.htmml',
	'html': './dist/template.voxmail/template-versafix-1.voxmail.html',
	'tdDir': './template-def/',
	'destDir': './dist/template.voxmail/',
	'modelPrefix': './model/template-versafix-1.voxmail'
}, {
	// French template
	'htmml': './template-def/template-versafix-1.fr.htmml',
	'html': './dist/template.fr/template-versafix-1.fr.html',
	'tdDir': './template-def/',
	'destDir': './dist/template.fr/',
	'modelPrefix': './model/template-versafix-1.fr'
}
];

var ok = true;
for (var i = 0; i < templates.length; i++) {
	var htmlFile = test ? tmp.fileSync().name : templates[i].html;
	htmml2html(templates[i].htmml, htmlFile);
    replace.sync({
    	files: htmlFile,
    	from: /__VERSION__/g,
    	to: pkg.version,
    });
	if (!test) fse.copySync(templates[i].tdDir+'img/', templates[i].destDir+'img/');
	if (!test) fse.copySync(templates[i].tdDir+'edres/', templates[i].destDir+'edres/');
	ok = checkTemplateDefs(htmlFile, templates[i].modelPrefix, false) && ok;
	if (!test) makeThumbs(htmlFile, './edres/', 640, 640);
}

if (!ok) process.exitCode = 1;
