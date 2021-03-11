
var express = require('express')
  , app = express()
  , mongoose = require('mongoose')
  , fs = require('fs')
  , path = require('path')
  , morgan = require('morgan')
  , flash = require('connect-flash')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , passport = require('passport')
  , localStrategy = require('passport-local').Strategy
  , config = require('./config')
  , logDirectory = __dirname + '/logs'
  , debugLog = 'log'
  , exceptionLog = 'err'
  , winston = require('winston')
  , expressWinston = require('express-winston')
  , expressSession = require('express-session')
  , filePath = path.join(__dirname, 'app/models')
  , options = {
        key: fs.readFileSync(config.sslPathKey),
        cert: fs.readFileSync(config.sslPathCert),
        ca: fs.readFileSync(config.sslPathCert),
        requestCert: false,
        rejectUnauthorized: false
    }
  , http = require('http')
  , https = require('http')
//   , server = https.createServer(options,app)
  , server = https.createServer(app)
  , ioserver = require('./app/lib/ioserver.js')(server)
  , timexe = require('timexe')
  , exec = require('child_process').exec
  , canrun = true
  ;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//mongoose.set('debug', true);


fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.DailyRotateFile)({
            filename: debugLog,
            datePattern: '.yyyy-MM-dd_HH',
            dirname: logDirectory
        }),
        //new winston.transports.File({
        //    filename: debugLog, 
        //    json: false
        //}),
        new winston.transports.Console({
            json: false,
            colorize: true
        })
    ],
    exceptionHandlers: [
        new (winston.transports.DailyRotateFile)({
            filename: exceptionLog,
            datePattern: '.yyyy-MM-dd_HH',
            dirname: logDirectory
        }),
        //new winston.transports.File({
        //    filename: exceptionLog, 
        //    json: false
        //}),
        new winston.transports.Console({
            json: true,
            colorize: true
        })
    ],
    exitOnError: false
});
logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
}; 
//app.use(morgan(':method :url :status :response-time ms - :referrer', { stream: logger.stream }));
app.use(morgan('dev', { stream: logger.stream }));



var conn = mongoose.connection;
conn.once('open', function () {
});
//mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUri);
app.set('mongoose', mongoose);

app.use(function(req, res, next) {
    if (!req.secure) return next();
    if (req.url.indexOf("/api/image/") == 0) return next();
    if (req.url.indexOf("/attachment/") == 0) return next();

    res.status(401);
    //res.json({
    //    "status": 401,
    //    "message": "Invalid credentials"
    //});
    res.end();
})



//app.use(express.static(path.dirname(require.resolve("mosca")) + "/public"));
app.use(expressSession({ secret: config.secret, cookie: { maxAge: config.loginTimeout*60*1000 /*5*60*1000*/ }, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ 'extended': 'false' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride('X-HTTP-Method'));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(methodOverride('X-Method-Override'));
//app.use(flash());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

var ctrls = {};
filePath = path.join(__dirname, 'app/controllers');
fs.readdirSync(filePath).forEach(function (file) {
    ctrls[file.split(".")[0].toLowerCase()] = require(filePath + '/' + file)({
        'ctrls': ctrls, 
        'ioserver': ioserver , 
        'config': config , 
        'logger': logger,
        'app': app
    });
});

passport.use(new localStrategy(ctrls.user.model.authenticate()));
passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    ctrls.user.model.findById(id, function (err, user) {
        //console.log('deserializeUser->username: ' + user._doc.username);  
        user.latestAccess = Date.now();
        user.save();
        ctrls.active.checkActiveUsers();
        done(err, user);
    });
});

app.use(function (req, res, next) {
    if (req.isAuthenticated()) next();
    else {
       //return  next();

        ctrls.user.model.findById('56e752475297d7d80e2d6e88', function (err, user) { //ferko
            req.logIn(user, { session: true }, function (err) {
                next();
            });
        });
    }
});

filePath = path.join(__dirname, 'app/routes');
fs.readdirSync(filePath).forEach(function (file) {
    require(filePath + '/' + file)(app, ctrls);
});

app.get('/styles/app.css', function (req, res) {
    res.writeHead(200, { "Content-Type": "text/css" });
    fs.readdirSync(path.join(__dirname, 'public', 'styles', 'app')).forEach(function (file) {
        res.write(fs.readFileSync(path.join(__dirname, 'public', 'styles', 'app', file), "utf8"));
    });
    res.end();
});

app.get('/javascript/app.js', function (req, res) {
    res.writeHead(200, { "Content-Type": "text/javascript" });
    fs.readdirSync(path.join(__dirname, 'public', 'javascript', 'app'), "utf8").forEach(function (file) {
        if (file === "app.js") {
            var appjs = fs.readFileSync(path.join(__dirname, 'public', 'javascript', 'app', file), "utf8")
                appjs = appjs.replace("IOSERVERADDR", config.ioServerAddr);
            res.write(appjs);
        } else {
            res.write(fs.readFileSync(path.join(__dirname, 'public', 'javascript', 'app', file), "utf8"));
        }
    });
    res.end();
});

app.get('/javascript/datacache.js', function (req, res) {
    var Esc = function (string) {
        return ('' + string).replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
            switch (character) {
                case '"':
                case "'":
                case '\\':
                    return '\\' + character
                case '\n':
                    return '\\n'
                case '\r':
                    return '\\r'
                case '\u2028':
                    return '\\u2028'
                case '\u2029':
                    return '\\u2029'
            }
        })
    };

    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.write("app.run(['dataCache', function (dataCache) {");
    fs.readdirSync(path.join(__dirname, 'public', 'javascript', 'datacache')).forEach(function (file) {
        var filename = path.join(__dirname, 'public', 'javascript', 'datacache', file)
          , ext = path.extname(filename)
          , cont = fs.readFileSync(filename, "utf8").substr(1);
        res.write("\ndataCache.put('" + path.basename(filename, ext) + "',");
        if (ext === '.json') {
            res.write(cont);
        } else {
            res.write("'" + Esc(cont) + "'");
        }
        res.write(");");
    });
    res.write("}]);\n");
    res.end();
});

app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});



function runScript(name, scr) {
    var child = exec('node ./app/' + scr)
      , title 
      , startdt = new Date();
    
    title = name + startdt.toISOString();
    console.info(title);
    
    child.stdout.on('data', function (data) {
        try {
            dataObj=JSON.parse(data);
        } catch (err) {
            var str = data.toString()
            var lines = str.split(/(\r?\n)/g);
            logger.info(lines.join(""));
            return;
        }
        //logger.info(dataObj.type);
        ioserver.notice(name, config.automuser, dataObj);
    });
    child.stderr.on('data', function (data) {
        logger.error('*** ' + data);
    });
    child.on('close', function (code) {
        if (code) logger.warn(title + ' ended at ' + new Date().toISOString() + ' code ' + code + ', ' + Math.ceil((new Date()-startdt)/1000) +'s');
    });
}

function runMailer() {
    runScript('Mailer', 'lib/mailer.js');
}

function runService() {
    runScript('Service', 'lib/service.js');
}

console.log(
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n" +
    " App listening on port " + config.serverPort + "\n" +
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~" 
);


server.listen(config.serverPort);
http.createServer(app).listen(config.serverFreePort);

var sheduler = timexe('* * * * /' + config.intervalMail, function () {
    if (canrun) {
        runMailer();
    } else {
        process.send('Mailer paused...');
    }
});
runMailer();


var service = timexe('* * * * /' + config.intervalService, function () {
    if (canrun) {
        runService();
    } else {
        process.send('Service paused...');
    }
});
runService();
