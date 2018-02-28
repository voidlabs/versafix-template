"use strict";

var mml2html = require('htmml');
var makeThumbs = require('./makeThumbs');
var checkTemplateDefs = require('./checkTemplateDefs');
var fse = require('fs-extra');

var templates = [ { 
	'mml': './template-def/template-versafix-1.mml', 
	'html': './dist/template/template-versafix-1.html',
	'imgDir': './template-def/img/', 
	'destImgDir': './dist/template/img/', 
	'modelPrefix': './model/template-versafix-1'
}, {
	'mml': './template-def/template-versafix-1.it.mml',
	'html': './dist/template.it/template-versafix-1.it.html',
	'imgDir': './template-def/img/', 
	'destImgDir': './dist/template.it/img/', 
	'modelPrefix': './model/template-versafix-1.it'
},
];

for (var i = 0; i < templates.length; i++) {
	mml2html(templates[i].mml, templates[i].html);
	fse.copySync(templates[i].imgDir, templates[i].destImgDir);
	checkTemplateDefs(templates[i].html, templates[i].modelPrefix);
	makeThumbs(templates[i].html, './edres/', 680, 340);
}
