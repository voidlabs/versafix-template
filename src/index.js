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
	'imgDir': './template-def/img/', 
	'destImgDir': './dist/template/img/', 
	'modelPrefix': './model/template-versafix-1'
}, {
	'htmml': './template-def/template-versafix-1.it.htmml',
	'html': './dist/template.it/template-versafix-1.it.html',
	'imgDir': './template-def/img/', 
	'destImgDir': './dist/template.it/img/', 
	'modelPrefix': './model/template-versafix-1.it'
},
];

for (var i = 0; i < templates.length; i++) {
	htmml2html(templates[i].htmml, templates[i].html);
    replace.sync({
    	files: templates[i].html,
    	from: /__VERSION__/g,
    	to: pkg.version,
    });
	fse.copySync(templates[i].imgDir, templates[i].destImgDir);
	checkTemplateDefs(templates[i].html, templates[i].modelPrefix);
	makeThumbs(templates[i].html, './edres/', 680, 340);
}
