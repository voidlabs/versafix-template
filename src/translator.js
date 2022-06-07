"use strict";
var path = require('path');
var fs = require('fs');
var cheerio = require('cheerio');
var cssParse = require('mensch/lib/parser.js');
var entities = require('entities');

function templateTranslator(templatePath, transformDefPath, outputPath, testRun) {

	var templatecode = "" + fs.readFileSync(templatePath);
	var output = outputPath;
	var transformDef = JSON.parse(fs.readFileSync(transformDefPath));
	var ok = true;

	var $ = cheerio.load(templatecode, {
	    normalizeWhitespace: false,
	    xmlMode: false,
	    decodeEntities: false,
	    // in mosaico we use false, let's try true here.
	    recognizeSelfClosing: true,
	    lowerCaseTags: false,
	    _useHtmlParser2: true,
	    // use attr="" instead of attr for empty attr (to stay consistent with previous cheerio releases)
	    emptyAttrs: true,
	    // not really used
	    withStartIndices: true,
	    withEndIndices: true,
	});

	// Almost magic selector to detect content nodes:
	if (transformDef.hasOwnProperty('strings')) $(':not(:empty):not(style)').each(function(idx, el) {
	    if (el.children.length >= 1) {
	        // If the element has only one child and is not a text element then it is not text content.
	        if (el.children.length == 1 && el.children[0].type !== 'text') return;
	        // if we have multiple children and at least once of them is a non empty text then we consider the whole thing as a translatable
	        var foundText = '';
	        for (var i = 0; i < el.children.length; i++)
	            if (el.children[i].type == 'text') {
	            	var t = entities.decodeHTML(el.children[i].data).trim();
	                if (t !== '' && !t.match(/^{{.*}}$/)) foundText += el.children[i].data.trim();
	            }
	        if (foundText) {
	            var c = $(el).html().trim();
	            if (transformDef.strings.hasOwnProperty(c)) {
	                var repl = transformDef.strings[c];
	                if (repl !== null) {
	                    var newContent = $(el).html().replace(c, repl);
	                    $(el).html(newContent);
	                }
	            } else if (!transformDef.hasOwnProperty("partial") || !transformDef.partial) {
	            	ok = false;
	                console.log("Missing translation for ", '[' + c + ']', '[' + foundText + ']');
	            }
	        }
	    }
	});

	var _removeOptionalQuotes = function(str) {
	    if ((str[0] == "'" || str[0] == '"') && str[str.length - 1] == str[0]) {
	        // unescapeing
	        var res = str.substr(1, str.length - 2).replace(/\\([\s\S])/gm, '$1');
	        return res;
	    }
	    return str;
	};

	var _transformOffsets = function(style, startPos, endPos, skipRows, startOffset, endOffset, insert) {
	    var styleRows = style.split("\n");
	    var start = startOffset;
	    var end = endOffset;
	    for (var r = 1 + skipRows; r < startPos.line; r++) start += styleRows[r - 1 - skipRows].length + 1;
	    start += startPos.col;
	    if (endPos !== null) {
	        for (var r2 = 1 + skipRows; r2 < endPos.line; r2++) end += styleRows[r2 - 1 - skipRows].length + 1;
	        end += endPos.col;
	    } else end += style.length + 1;
	    return {
	        start: start,
	        end: end
	    };
	    // var newStyle = style.substr(0, start - 1) + insert + style.substr(end - 1);
	    // return newStyle;
	};

	var processStylesheetRules = function(style, rules) {
	    var newStyle = style;
	    var lastStart = null;
	    if (typeof rules == 'undefined') {
	        var styleSheet = cssParse(style, {
	            comments: true,
	            position: true
	        });
	        if (styleSheet.type != 'stylesheet' || typeof styleSheet.stylesheet == 'undefined') {
	            throw "Unable to parse stylesheet";
	        }
	        rules = styleSheet.stylesheet.rules;
	    }
	    // WARN currenlty this parses rules in reverse order so that string transformDef.strings works using input "positions"
	    // otherwise it should compute new offsets on every replacement.
	    var bindingProvider;
	    for (var a = rules.length - 1; a >= 0; a--) {
	        if (rules[a].type == 'supports' && rules[a].name == '-ko-blockdefs') {
	            var bdrules = rules[a].rules;
	            for (var i = bdrules.length - 1; i >= 0; i--) {
	                if (bdrules[i].type == 'rule') {
	                    var sels = bdrules[i].selectors;
	                    var hasDeclarations = false;
	                    var hasPreviews = false;
	                    for (var j = 0; j < sels.length; j++) {
	                        if (sels[j].match(/:preview$/)) {
	                            hasPreviews = true;
	                        } else {
	                            hasDeclarations = true;
	                        }
	                    }
	                    if (hasPreviews && hasDeclarations) {
	                        throw "Cannot mix selectors type (:preview and declarations) in @supports -ko-blockdefs";
	                    }
	                    if (!hasPreviews && !hasDeclarations) {
	                        throw "Cannot find known selectors in @supports -ko-blockdefs";
	                    }
	                    if (hasDeclarations || hasPreviews) {
	                        var decls = bdrules[i].declarations;
	                        for (var k = decls.length - 1, val; k >= 0; k--)
	                            if (decls[k].type == 'property') {
	                                val = _removeOptionalQuotes(decls[k].value);
	                                switch (decls[k].name) {
	                                    case 'label':
	                                    case 'help':
	                                    case 'options':
	                                    case 'buttonsetLabels':
	                                    case '-ko-bind-text':
	                                        if (transformDef.strings.hasOwnProperty(val)) {
	                                            if (transformDef.strings[val] !== null) {
	                                                var offsets = _transformOffsets(newStyle, decls[k].position.start, decls[k].position.end, 0, 0, 0);
	                                                var prop = newStyle.substr(offsets.start - 1, offsets.end - offsets.start);
	                                                // TODO detect when we need to escape the value.
	                                                prop = prop.replace(decls[k].value, transformDef.strings[val]);
	                                                if (!prop.includes(transformDef.strings[val])) {
	                                                    console.log("Unable to replace", "[" + prop + "]", "[" + decls[k].value + "]", "[" + transformDef.strings[val] + "]");
	                                                }
	                                                newStyle = newStyle.substr(0, offsets.start - 1) + prop + newStyle.substr(offsets.end - 1);
	                                                // newStyle = removeStyle(newStyle, decls[k].position.start, decls[k].position.end, 0, 0, 0, decls[k].name+': '+transformDef.strings[val]);
	                                            }
	                                        } else if (!transformDef.hasOwnProperty("partial") || !transformDef.partial) {
	                                        	ok = false;
	                                            console.log("Missing translation: ", decls[k].name, decls[k].value);
	                                        }
	                                        break;
	                                }
	                            }
	                    }
	                }
	            }
	        }
	        lastStart = rules[a].position.start;
	    }
	    return newStyle;
	};

	if (transformDef.hasOwnProperty('strings')) $('style').each(function(idx, el) {
	    if (el.children.length >= 1) {
	        var style = el.children[0].data;
	        var newStyle = processStylesheetRules(style);
	        if (style != newStyle) {
	            $(el).empty();
	            $(el).append(newStyle);
	        }
	    }
	});

	if (transformDef.hasOwnProperty('customReplacements'))
	    for (var selector in transformDef.customReplacements)
	        if (transformDef.customReplacements.hasOwnProperty(selector)) {
	            $(selector).each(function(idx, el) {
	                // Attribute mode
	                transformDef.customReplacements[selector].forEach(function(rule) {
	                    if (rule.hasOwnProperty('attribute')) {
	                        var content = $(el).attr(rule.attribute);
	                        var newContent = content.replace(rule['search'], rule['replace']);
	                        if (newContent !== content) {
	                            $(el).attr(rule.attribute, newContent);
	                        }
	                        // HTML mode
	                    } else {
	                        // global.console.log("CR", selector, rule);
	                        var content = $(el).html();
	                        var newContent = content.replace(rule['search'], rule['replace']);
	                        if (newContent !== content) {
	                            $(el).html(newContent);
	                        }
	                    }
	                });
	            });
	        }

	if (ok && !testRun) {
		var dir = path.dirname(output);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir);
		fs.writeFileSync(output, $.html());
	}
	return ok;
}

module.exports = templateTranslator;