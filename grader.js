#!/usr/bin/env node
/* 
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio.  Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 - commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 - JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function (infile) {
	var instr = infile.toString();
	if (!fs.existsSync(instr)) {
	  console.log("%s does not exist.  Exiting", instr);
	  process.exit(1);  //http://node.js.org/api/process.html#process_process_exit_code
	}
	return instr;
};

var cheerioHtmlFile = function(htmlfile) {
	return cheerio.load(fs.readFileSync(htmlfile));
}
var cheerioHtmlStream = function(htmlString) {
//	console.log("Parsing HTML String " + htmlString);
	return cheerio.load(htmlString);
}

var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, url) {
	var $;
	if (url) {
		rest.get(url).on('complete', function(result) {
			if (result instanceof Error) {
				console.log("Error in getting url: " + result.message);
				this.retry(50000);
			} else {
				//console.log(result);
				$ = cheerioHtmlStream(result);
				//console.log("Finished checking...: " + $);
				//return checkChecks($, checksfile);
				console.log(JSON.stringify(checkChecks($, checksfile), null, 4));
			}
		});
	} else {
		$ = cheerioHtmlFile(htmlfile);
		//console.log("Finished checking...: " + $);
		//return checkChecks($, checksfile);
		console.log(JSON.stringify(checkChecks($, checksfile), null, 4));
	}
};

var checkChecks = function( $, checksfile ) {

	var checks = loadChecks(checksfile).sort();
	//console.log("Loaded checks");
	var out = {};
	for (var ii in checks) {
		var present = $(checks[ii]).length > 0;
		//console.log("Found something: "  + ($(checks[ii]).length > 0));
		out[checks[ii]] = present;
	}
	//console.log("Results: " + out);
	return out;
};

var clone = function(fn) {
	// Workaround for commander.js issue
	// http://stackoverflow.com/a/6772648
	return fn.bind({});
};

if (require.main == module) {
	program
	  .option('-c, --checks <check-file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	  .option('-f, --file <html-file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
  	  .option('u, --url <url>', 'URL to check')
	  .parse(process.argv);
	//var checkJson = checkHtmlFile(program.file, program.checks, program.url);
	var outJson = checkHtmlFile(program.file, program.checks, program.url);
	//var outJson = JSON.stringify(checkJson, null, 4);
} else {
	exports.checkHtmlFile = checkHtmlFile;
}

