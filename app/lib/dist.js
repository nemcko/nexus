'use strict';
var mongoose = require('mongoose')
  , async = require("async")
  , path = require('path')
  , fs = require('fs')
  , ClosureCompiler = require("closurecompiler")
  , Compressor = require('node-minify')
  , srcDir = path.join(__dirname, '../../')
  , trgDir = path.join(__dirname, '../../dist/')
;

function copyFile(source, target, callback) {
    var cbCalled = false;
    
    var rd = fs.createReadStream(source);
    rd.on("error", done);
    
    var wr = fs.createWriteStream(target);
    wr.on("error", done);
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);
    
    function done(err) {
        if (!cbCalled) {
            callback(err);
            cbCalled = true;
        }
    }
}
function extension(element) {
    var extName = path.extname(element);
    return extName === '.js';
};
function distDir(dirName, callback) {
    fs.readdir(path.join(srcDir, dirName), function (err, list) {     
        async.eachSeries(list.filter(extension), function (filename, next){
            distFile(filename, dirName, next);
        }, function (err, result) {
            //console.log('...', dirName);
            if (callback) {
                callback(err);
            }
        });
    });
}
function distFile(filename, filedir, callback) {
    ClosureCompiler.compile([path.join(srcDir, filedir + '/' + filename)],
    {
        compilation_level: "SIMPLE_OPTIMIZATIONS",
    },
    function (error, result) {
        if (result) {
            var ofile = path.join(trgDir , filedir + '/' + filename);
            fs.writeFile(ofile, result, function (err) {
                if (err) {
                    console.log('***', err.message);
                } else {
                    console.log(ofile);
                }
                if (callback) {
                    callback(err);
                }
       
            });
        } else {
            console.log('***');
            if (callback) {
                callback(error);
            }
        }
    });
}
function distDirCopy(dirName, callback) {
    fs.readdir(path.join(srcDir, dirName), function (err, list) {
        async.eachSeries(list, function (filename, next) {
            distFileCopy(filename, dirName, next);
        }, function (err, result) {
            //console.log('...', dirName);
            if (callback) {
                callback(err);
            }
        });
    });
}

function distFileCopy(filename, filedir, callback) {
    //fs.createReadStream().pipe(fs.createWriteStream());
    var fin = path.join(srcDir, filedir + '/' + filename)
      , fou = path.join(trgDir, filedir + '/' + filename)
      ;
    copyFile(fin, fou, function (err) {
        if (err)
            console.log('***', err.message);
        else
            console.log(fou);

        if (callback) {
            callback(err);
        }
    });
}
function distDirPack(dirName, filename, callback) {
    var srcFiles = [];
    fs.readdir(path.join(srcDir, dirName), function (err, list) {
        list.forEach(function (file) {
            srcFiles.push(path.join(srcDir, dirName + '/' + file));
        });        
        ClosureCompiler.compile(srcFiles,
        {
            compilation_level: "WHITESPACE_ONLY",
        },
        function (error, result) {
            if (result) {
                var ofile = path.join(trgDir , dirName + '/' + filename);
                fs.writeFile(ofile, result, function (err) {
                    if (err) {
                        console.log('***', err.message);
                    } else {
                        console.log(ofile);
                    }
                    if (callback) {
                        callback(err);
                    }
       
                });
            } else {
                console.log('***');
                if (callback) {
                    callback(error);
                }
            }
        });
    });
}

function distCssFile(filename, filedir, callback) {
    new Compressor.minify({
        type: 'clean-css',
        fileIn: [path.join(srcDir, filedir + '/' + filename)],
        fileOut: path.join(trgDir, filedir + '/' + filename),
        callback: function (err, min) {
            if (err) {
                console.log('***', err.message);
            } else {
                console.log(path.join(trgDir, filedir + '/' + filename));
            }
            if (callback) {
                callback(err);
            }
        }
    });
}



function checkDir(dirName){
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }
}
//function deleteFolder(path) {
//    if (fs.existsSync(path)) {
//        fs.readdirSync(path).forEach(function (file, index) {
//            var curPath = path + "/" + file;
//            if (fs.lstatSync(curPath).isDirectory()) { 
//                deleteFolder(curPath);
//            } else { 
//                fs.unlinkSync(curPath);
//            }
//        });
//        fs.rmdirSync(path);
//    }
//};

checkDir(trgDir);
checkDir(path.join(trgDir, 'app'));
checkDir(path.join(trgDir, 'app/controllers'));
checkDir(path.join(trgDir, 'app/lib'));
checkDir(path.join(trgDir, 'app/models'));
checkDir(path.join(trgDir, 'app/routes'));
checkDir(path.join(trgDir, 'public'));
checkDir(path.join(trgDir, 'public/javascript'));
checkDir(path.join(trgDir, 'public/javascript/app'));
checkDir(path.join(trgDir, 'public/javascript/datacache'));
checkDir(path.join(trgDir, 'public/partials'));
checkDir(path.join(trgDir, 'public/partials/access'));
checkDir(path.join(trgDir, 'public/partials/autom'));
checkDir(path.join(trgDir, 'public/partials/board'));
checkDir(path.join(trgDir, 'public/partials/group'));
checkDir(path.join(trgDir, 'public/partials/kbase'));
checkDir(path.join(trgDir, 'public/partials/organ'));
checkDir(path.join(trgDir, 'public/partials/template'));
checkDir(path.join(trgDir, 'public/partials/ticket'));
checkDir(path.join(trgDir, 'public/partials/user'));
checkDir(path.join(trgDir, 'public/partials/view'));
checkDir(path.join(trgDir, 'public/styles'));
checkDir(path.join(trgDir, 'public/styles/app'));

async.series([
    function (callback) {
        distFile('index.js', '.', callback);
    },
    function (callback) {
        distDir('app/controllers', callback);
    },
    function (callback) {
        distDir('app/lib', callback);
    },
    function (callback) {
        distDirCopy('app/models', callback);
    },
    function (callback) {
        distDirCopy('app/routes', callback);
    },
     function (callback) {
        distDirPack('public/javascript/app', 'app.js', callback);
    },
    function (callback) {
        distDirCopy('public/javascript/datacache', callback);
    },
    function (callback) {
        distDirCopy('public/partials/access', callback);
    },
    function (callback) {
        distDirCopy('public/partials/autom', callback);
    },
    function (callback) {
        distDirCopy('public/partials/board', callback);
    },
    function (callback) {
        distDirCopy('public/partials/group', callback);
    },
    function (callback) {
        distDirCopy('public/partials/kbase', callback);
    },
    function (callback) {
        distFileCopy('index.html', 'public', callback);
    },
    function (callback) {
        distDirCopy('public/partials/organ', callback);
    },
    function (callback) {
        distDirCopy('public/partials/template', callback);
    },
    function (callback) {
        distDirCopy('public/partials/ticket', callback);
    },
    function (callback) {
        distDirCopy('public/partials/user', callback);
    },
    function (callback) {
        distDirCopy('public/partials/view', callback);
    },
    function (callback) {
        //distFileCopy('app.css', 'public/styles/app', callback);
        distCssFile('app.css', 'public/styles/app', callback);
    },

], function (err, msg) {
    console.log('FINISH');
    if(!err) process.exit();
});
