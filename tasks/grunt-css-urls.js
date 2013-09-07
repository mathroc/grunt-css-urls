/*
 * grunt-css-urls
 * https://github.com/Ideame/grunt-css-urls
 *
 * Copyright (c) 2012 Juan Pablo Garcia & Ideame Dev Team
 */
module.exports = function (grunt) {
	var fs = require('fs');
	var path = require('path');
	var util = require('util');
	
	grunt.registerMultiTask("cssurls", "Parses a given main css file with @import rules, iterates through them replacing url() relative references with a relative url to the main css file.", function () {
		
		var options = this.options(), 
			targetDir = options.targetDir
			importDir = path.resolve(options.importDir);
		
		if(!grunt.file.isDir(importDir)) {
			grunt.file.mkdir(importDir);
		}
		
		if(targetDir === undefined) {
			targetDir = function(file_path) {
				return path.dirname(file_path);
			};
		}
		else if(typeof targetDir === 'string') {
			targetDir = (function(targetDir) {
				return function() {
					return targetDir;
				}
			}) (path.resolve(targetDir));
		}
		
		this.files.forEach(function(sourcefile) {
			var target_dir = targetDir(sourcefile.dest);
			
			grunt.file.write(
				sourcefile.dest, 
				grunt.file.read(
					sourcefile.src).replace(/@import\s+.([^;]+).;/gim, 
					function(match, location) {
						location = location.replace(/'|"/g, '');
						var importpath = path.resolve(path.dirname(sourcefile.src), location);
						var importcss = grunt.file.read(importpath).toString(); // sometimes css is interpreted as object
						
						grunt.log.writeln('Parsing "' + location + '"...');
						
						var css = importcss.replace(/url(?:\s+)?\(([^\)]+)\)/igm, function(match, media_url){
							media_url = media_url.replace(/'|"/g, '');
							
							if (/^\//.test(media_url)) {
								grunt.log.writeln(" - Absolute media_urls are not supported, url ignored => " + media_url);
								return media_url;
							}
							if (/^(\s+)?$/.test(media_url)) {
								grunt.log.writeln(" - Empty media_urls are not supported, url ignored => " + media_url);
								return media_url;
							}
							
							if (/#/.test(media_url) && !/\?#iefix|svg#/.test(media_url)) {
								grunt.log.writeln(" - Anchors not allowed, url ignored => " + media_url);
								return media_url;
							}
							
							var media_path = path.resolve(path.dirname(importpath), media_url), 
								new_media_url = path.relative(target_dir, media_path);
							
							return util.format("url(%s)", new_media_url);
						});
						
						var new_path = path.resolve(importDir, Math.floor(Math.random()*100000000) + path.extname('qsd.css'));
						
						grunt.file.write(new_path, css);
						
						return util.format("@import \"%s\"; /* %s */", path.relative(path.dirname(path.resolve(sourcefile.dest)), new_path), location);
					}
				)
			);
		}.bind(this));
	});
};
