"use strict";

var path = require('path');
var console = require('console');
var async = require('async');
var fs = require('fs');
var cheerio = require('cheerio');
var domutils = require("./domutils.js");

/* funzioni prese da mosaico ma modificate per usare cc:tagoriginale al posto di cc (in modo da poterli stilare) */

function conditional_replace(html, $) {
  return html.replace(/<!--\[if ([^\]]*)\]>((?:(?!--)[\s\S])*?)<!\[endif\]-->/g, function (match, condition, body) {
    var dd = '<!-- cc:start -->';
    dd += body.replace(/<([A-Za-z:]+)/g, '<!-- cc:bo:$1 --><cc-$1') // before open tag
      .replace(/<\/([A-Za-z:]+)>/g, '<!-- cc:bc:$1 --></cc-$1><!-- cc:ac:$1 -->') // before/after close tag
      .replace(/\/>/g, '/><!-- cc:sc -->'); // self-close tag
    dd += '<!-- cc:end -->';
    var output = '<replacedcc condition="' + condition + '" style="display: none">';
    output += $('<div>').append($(dd)).html()
      .replace(/^<!-- cc:start -->/, '')
      .replace(/<!-- cc:end -->$/, '');
    output += '</replacedcc>';
    return output;
  });
}

function conditional_restore(html) {
  return html.replace(/<replacedcc[^>]* condition="([^"]*)"[^>]*>([\s\S]*?)<\/replacedcc>/g, function (match, condition, body) {
    var dd = '<!--[if ' + condition.replace(/&amp;/, '&') + ']>';
    dd += body.replace(/<!-- cc:bc:([A-Za-z:]*) -->(<\/cc(?:-[a-zA-Z0-9]*)?>)?<!-- cc:ac:\1 -->/g, '</$1>') // restore closing tags (including lost tags)
      .replace(/><\/cc(?:-[a-zA-Z0-9]*)?><!-- cc:sc -->/g, '/>') // restore selfclosing tags
      .replace(/<!-- cc:bo:([A-Za-z:]*) --><cc(?:-[a-zA-Z0-9]*)?/g, '<$1') // restore open tags
      .replace(/^.*<!-- cc:start -->/, '') // remove content before start
      .replace(/<!-- cc:end -->.*$/, ''); // remove content after end
    dd += '<![endif]-->';
    return dd;
  });
}


var domutils_listAttributes = function (element) {
  return element.attribs;
};

var domutils_appendStyle = function (element, style) {
  var curStyle = domutils.getAttribute(element, 'style');
  if (curStyle === null) curStyle = '';
  if (curStyle.trim().length > 0 && curStyle.trim().substr(curStyle.trim().length - 1) !== ';') curStyle += '; ';
  if (curStyle.length > 0 && curStyle.substr(curStyle.length - 1) === ';') curStyle += ' ';
  curStyle += style;
  domutils.setAttribute(element, 'style', curStyle);
};

var domutils_appendClass = function (element, style) {
  var curClass = domutils.getAttribute(element, 'class');
  if (curClass === null) curClass = '';
  if (curClass.trim().length > 0 && curClass.trim().substr(curClass.trim().length - 1) !== ' ') curClass += ' ';
  curClass += style;
  domutils.setAttribute(element, 'class', curClass);
};


var replaceIf = function (newTmpl, values) {
  return newTmpl.replace(/{{#([a-zA-Z0-9-]+)}}([\S\s]*?){{\/\1}}/g, function (match, tag, inner) {
    if (values.hasOwnProperty(tag)) return replaceIf(inner, values);
    else return '';
  });
};

var applyTemplating = function (newTmpl, values) {
  // IF
  newTmpl = replaceIf(newTmpl, values);

  // TAG SEMPLICI
  newTmpl = newTmpl.replace(/{{([a-zA-Z0-9-]+)}}/g, function (match, content) {
    if (values.hasOwnProperty(content)) return values[content];
    else console.log("Property non found", match, content);
  });

  for (var v in values) if (values.hasOwnProperty(v)) {
    newTmpl = newTmpl.replace(new RegExp('{{' + v + '}}', 'g'), values[v]);
  }

  return newTmpl;
};

var tagRepeater = function ($, tagName) {

  $(tagName).each(function (index, element) {
    var templContent = domutils.getInnerHtml(element);

    var attributes = domutils_listAttributes(element);

    var maxLength = 0;
    var replaceValues = [];
    for (var attr in attributes) if (attributes.hasOwnProperty(attr)) {
      var attrValues = domutils.getAttribute(element, attr).split(',');
      if (maxLength === 0) maxLength = attrValues.length;
      else if (maxLength != attrValues.length) {
        console.log("Numero valori non uniforme tra gli attributi", element, maxLength, attr);
      }
      for (var i = 0; i < attrValues.length; i++) {
        while (replaceValues.length <= i) replaceValues.push({});
        replaceValues[i][attr] = attrValues[i];
      }
    }

    var content = '';
    for (var k = 0; k < maxLength; k++) {
      content += applyTemplating(templContent, replaceValues[k]);
    }

    domutils.replaceHtml(element, content);
  });

};

var tagReplace = function ($, tagName, template, attributesDef) {

  $(tagName).each(function (index, element) {
    var content = domutils.getInnerHtml(element);

    var tmplContent = (typeof template == 'string' ? template : template.join("\r\n"));
    tmplContent = conditional_replace(tmplContent, $);
    var tmpl = $('<root>' + tmplContent + '</root>');

    var attributes = domutils_listAttributes(element);

    var values = {
      replacedcontent: content
    };


    for (var attribute in attributesDef) if (attributesDef.hasOwnProperty(attribute)) {
      if (attributes.hasOwnProperty(attribute)) {
        var defs = attributesDef[attribute];
        values[attribute] = attributes[attribute];
        for (var i = 0; i < defs.length; i++) {
          var def = defs[i];
          $(def.selector, tmpl).each(function (idx, el) {
            for (var d in def) if (def.hasOwnProperty(d) && d !== 'selector') {
              if (d == 'style' || d == 'addStyle') {
                domutils_appendStyle(el, def[d]);
              } else if (d == 'class') {
                domutils_appendClass(el, def[d]);
              } else if (d == 'addAttributeName') {
                domutils.setAttribute(el, def.addAttributeName, def.addAttributeValue);
              } else if (d == 'addAttributeValue') {
              } else {
                domutils.setAttribute(el, d, def[d]);
              }
            }
          });
        }
        delete attributes[attribute];
      }
    }

    for (attribute in attributes) if (attributes.hasOwnProperty(attribute)) {
      console.warn("Attributo ", attribute, " non previsto dalla definizione dell'elemento");
    }


    var newTmpl = conditional_restore(domutils.getInnerHtml(tmpl[0]));

    newTmpl = applyTemplating(newTmpl, values);

    domutils.replaceHtml(element, newTmpl);
  });

};

var translateMetaTemplate = function (input, output) {

  console.log("translating ", input, output);

  var templatecode = "" + fs.readFileSync(input);

  var $ = cheerio.load(templatecode, {
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: false,
    recognizeSelfClosing: false,
    lowerCaseTags: false,
  });

  // inlining
  $('default').each(function (idx, el) {
    var attributes = domutils_listAttributes(el);
    var sel = attributes.selector;
    delete attributes.selector;

    $(sel).each(function (id, elem) {
      for (var attrib in attributes) if (attributes.hasOwnProperty(attrib)) {
        if (domutils.getAttribute(elem, attrib) === null) {
          domutils.setAttribute(elem, attrib, attributes[attrib]);
        }
      }
    });

  }).remove();

  var blockDefs = {};

  $('template-def').each(function (idx1, el1) {
    $('template', el1).each(function (idx, el) {
      var def = {};
      var tagName = domutils.getAttribute(el, 'tag');

      $('def', el).each(function (id, e) {
        var attributes = domutils_listAttributes(e);
        var name = attributes.attr;
        delete attributes.attr;
        if (typeof def[name] == 'undefined') def[name] = [];
        if (typeof attributes.selector != 'undefined') def[name].push(attributes);
        // else console.log("found no selector ", name, attributes.length);
      });

      var tmpl = $('tmpl', el).html();

      var blockDef = {
        'attrs': def,
        'tmpl': tmpl
      };

      blockDefs[tagName] = blockDef;
    }).remove();
  }).remove();

  tagRepeater($, 'repeater');

  for (var block in blockDefs) if (blockDefs.hasOwnProperty(block)) {
    tagReplace($, block, blockDefs[block].tmpl, blockDefs[block].attrs);
  }

  var dir = path.dirname(output);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);


  fs.writeFileSync(output, $.html());

};

module.exports = translateMetaTemplate;