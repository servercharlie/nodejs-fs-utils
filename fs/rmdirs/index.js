var _classes = {
	fs	: require("fs")
};

var rmdirAsync = function(path, opts, callback) {
	var fs;
	if (typeof(opts) === "function") {
		callback	= opts;
		opts	= {};
	}
	
	if (typeof(opts) !== "object") {
		opts	= {};
	}

	if (typeof(opts.symbolicLinks) === "undefined") {
		opts.symbolicLinks	= true;
	}

	if (!fs)
		fs	= opts.fs || _classes.fs;
	
	fs.readdir(path, function(err, files) {
		if(err) {
			// Pass the error on to callback
			callback(err, []);
			return;
		}
		var wait = files.length,
			count = 0,
			folderDone = function(err) {
			count++;
			// If we cleaned out all the files, continue
			if( count >= wait || err) {
				fs.rmdir(path,callback);
			}
		};
		// Empty directory to bail early
		if(!wait) {
			folderDone();
			return;
		}
		
		// Remove one or more trailing slash to keep from doubling up
		path = path.replace(/\/+$/,"");
		files.forEach(function(file) {
			var curPath = path + "/" + file;
			fs[opts.symbolicLinks ? 'lstat' : 'stat'](curPath, function(err, stats) {
				if( err || ( stats && stats.isSymbolicLink() )) {
					callback(err || new Error("Exception: Symbolic link"), []);
					return;
				}
				if( stats.isDirectory() ) {
					rmdirAsync(curPath, folderDone, opts);
				} else {
					fs.unlink(curPath, folderDone);
				}
			});
		});
	});
};

rmdirAsync.sync = function (path, opts) {
	var fs;
	
	if (typeof(opts) !== "object") {
		opts	= {};
	}

	if (typeof(opts.symbolicLinks) === "undefined") {
		opts.symbolicLinks	= true;
	}

	if (!fs)
		fs	= opts.fs || _classes.fs;
	
	var files	= fs.readdirSync(path);
	var wait = files.length;
	
	// Remove one or more trailing slash to keep from doubling up
	path = path.replace(/\/+$/,"");
	files.forEach(function(file) {
		var curPath = path + "/" + file;
		var stats = fs[opts.symbolicLinks ? 'lstatSync' : 'statSync'](curPath);

		if( stats.isDirectory() && !stats.isSymbolicLink() ) {
			rmdirAsync.sync(curPath, opts);
		} else {
			fs.unlinkSync(curPath);
		}
	});
	fs.rmdirSync(path);
};

module.exports	= rmdirAsync;