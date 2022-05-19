"use strict";

const htmml2html = require('htmml');
const makeThumbs = require('./makeThumbs');
const checkTemplateDefs = require('./checkTemplateDefs');
const fse = require('fs-extra');
const replace = require('replace-in-file');
const pkg = require('../package.json');

var templates = [ { 
	'htmml': './template-def/template-versafix-1.htmml', 
	'html': './dist/template/template-versafix-1.html',
	'tdDir': './template-def/',
	'destDir': './dist/template/',
	'modelPrefix': './model/template-versafix-1'
}, {
	'htmml': './template-def/template-versafix-1.it.htmml',
	'html': './dist/template.it/template-versafix-1.it.html',
	'tdDir': './template-def/',
	'destDir': './dist/template.it/',
	'modelPrefix': './model/template-versafix-1.it'
}, {
	'htmml': './template-def/template-versafix-1.voxmail.htmml',
	'html': './dist/template.voxmail/template-versafix-1.voxmail.html',
	'tdDir': './template-def/',
	'destDir': './dist/template.voxmail/',
	'modelPrefix': './model/template-versafix-1.voxmail'
},
];

for (var i = 0; i < templates.length; i++) {
	htmml2html(templates[i].htmml, templates[i].html);
    replace.sync({
    	files: templates[i].html,
    	from: /__VERSION__/g,
    	to: pkg.version,
    });
	fse.copySync(templates[i].tdDir+'img/', templates[i].destDir+'img/');
	fse.copySync(templates[i].tdDir+'edres/', templates[i].destDir+'edres/');
	checkTemplateDefs(templates[i].html, templates[i].modelPrefix);
	makeThumbs(templates[i].html, './edres/', 680, 340);
}
