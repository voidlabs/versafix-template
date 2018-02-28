"use strict";

var path = require('path');
var cp = require('child_process');
var phantombin = require('phantomjs-prebuilt').path;

var makeThumbs = function (templateFile, outputFolder, renderWidth, outputWidth) {

	var async = require('async');
	var script = './src/phantom-thumbnailer-editor.js';

	console.log("Creating thumbnails for ", templateFile);

	// var templateFile = './templates/ml/template-ml.html';
	var outFolder = path.join(path.dirname(templateFile), outputFolder);
	var args = [script, renderWidth, outputWidth, templateFile, outFolder];

	try {
		var result = cp.execSync(phantombin + ' ' + args.join(' '), { stdio: [0, 1, 2] });
		console.log("DONE", result);
		return true;
	} catch (e) {
		console.log("FAILED to run command: " + e, "Command line: ", cmd);
		return false;
	}

};

module.exports = makeThumbs;

