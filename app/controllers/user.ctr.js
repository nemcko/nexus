/**
 * @module Users Controller
 * @description User Administration module.
 */

'use strict';

/** Objects and variables of Module. */
var Passport = require('passport')
  ////, mqttCl = require('../lib/mqtt.js')
  , Image = require('../models/image.mod.js')
  , Access = require('../lib/access.js')
  //, gm = require('gm').subClass({ imageMagick: true })
  , root = {}
  , Crud = require('../lib/crud.js')
  , Autom = require('../lib/autom.js')
  , Ticket = require('../models/ticket.mod.js')
  , Organ = require('../models/organ.mod.js')
  , async = require("async")
  ;

//    config = require('../../config'),
//    mqtt = require('mqtt'),
//    mqttCl = mqtt.connect(config.mqttUri);
//    //mqtt = require('mows'),
//    //mqttCl = mqtt.createClient(config.mqttUri);

//mqttCl.on('connect', function () {
//    mqttCl.subscribe('#');
//});

//mqttCl.on('message', function (topic, message) {
//    console.log('Mqtt: ('+topic + ') ' + message);
//    //client.end();
//});

/**
 * Controller class.
 * @class
 * @classdesc The main class module User.
 */
var Controller = function (obj) {
    root = obj;
};

/*
 * @property {object} Controller.model  - Data model.
 */
Controller.prototype.model = require('../models/user.mod.js')

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.fullname = indata.fullname;
    fields.phone = indata.phone;
    fields.notes = indata.notes;
    fields.tags = indata.tags;
    fields.role = indata.role;
    fields.usertype = indata.usertype;
    //fields.avatar = indata.avatar;
};

/*
 * Where condition for data select.
 * @param req {Object} Request object
 */
Controller.prototype.whereCond = function (req) {
    if (req.body.qparam)
        return {
            $and: [
                { $or: [{ fullname: { $regex: req.body.search , $options: "i" } }, { phone: { $regex: req.body.search , $options: "i" } }, { notes: { $regex: req.body.search , $options: "i" } }] },
                { usertype: req.body.qparam }
            ]
        };
    else
        return { $or: [{ fullname: { $regex: req.body.search , $options: "i" } }, { phone: { $regex: req.body.search , $options: "i" } }, { notes: { $regex: req.body.search , $options: "i" } }] };
};

/*
 * Test for user authentication.
 * @method Controller.isAuthenticated
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param next {Object} next callback
 */
Controller.prototype.isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.status(401).json({
        err: 'User not authenticated'
    });
}

/*
 * Function for get full username.
 * @method Controller.getFullname
 * @param usr {String}/{Object} Login user name or object with user data.
 * @param cb {Object} Callback function in cases where usr is the username.
 */
Controller.prototype.getFullname = function (usr,cb) {
    if (typeof usr === 'string' && cb) {
        Controller.prototype.model.findOne({ 'username': usr })
            .select("username fullname name surname")
            .exec(function (err, user) {
            if (!err && user) {
                var userobj = user.toObject();
                //fullname = (userobj.title ? userobj.title + ' ': '') 
                //+ (userobj.name ? userobj.name + ' ': '') 
                //+ (userobj.surname ? userobj.surname + ' ': '');

                cb(userobj.fullname);
            }
        });
    } else {
        var userobj = usr;
        //, fullname = (userobj.title ? userobj.title + ' ': '') 
        //    + (userobj.name ? userobj.name + ' ': '') 
        //    + (userobj.surname ? userobj.surname + ' ': '');
        return userobj.fullname;
    }
}

/*
 * New user registration.
 * @method Controller.register
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param next {Object} next callback
 */
Controller.prototype.register = function (req, res, next) {
    var User = require('../models/user.mod.js');
    User.register(new User({ username: req.body.username, role: 'guest' }),
    req.body.password, function (err, account) {
        if (err) {
            return res.status(500).json({
                err: err
            });
        }
        //Passport.authenticate('local')(req, res, function () {
        //    return res.status(200).json({
        //        items: { username: req.body.username }
        //    });
        //});

        return res.status(200).json({
            items: { '_id': account._id, '__v': account.__v, username: req.body.username, role: account.role }
        });

    });
}

/*
 * Log the user into the system.
 * @method Controller.login
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param next {Object} next callback
 */
Controller.prototype.login = function (req, res, next) {
    Passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({
                err: info
            });
        }
        req.logIn(user, { session: true}, function (err) {
            if (err) {
                return res.status(500).json({
                    err: 'Could not log in user'
                });
            }
            ////mqttCl.publish('user-login', JSON.stringify({ username: req.user.username }), { retain: true });
            Controller.prototype.model.findOne({ username: req.user.username })
            .exec(function (err, user) {
                if (!err && user) {
                    root.ctrls.active.addUser(user.toObject().username);
                    res.status(200).json(currentUser(user));
                    return next();
                }
            });
        });
    })(req, res, next);
}

/*
 * Log off a user from the system.
 * @method Controller.logout
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param next {Object} next callback
 */
Controller.prototype.logout = function (req, res) {
    if (req.isAuthenticated()) {
        ////mqttCl.publish('user-logout', JSON.stringify({ username: req.user.username }), { retain: true });
        Controller.prototype.model.findOne({ username: req.user.username })
            .select("username fullname name surname")
            .exec(function (err, user) {
            if (!err && user) {
                root.ctrls.active.delUser(user.toObject().username);
            }
        });
    }
    req.logout();
    res.status(200).json({
        status: 'Bye!'
    });
}

function currentUser(user){
    var userObj = {
        username: '', 
        email: '',
        fullname: '',
        role: 'guest',
        usertype: 'suppliers'
    };
    if (user) {
        userObj.username = user.username;
        userObj.email = user.email;
        userObj.fullname = user.fullname;
        userObj.role = user.role;
        userObj.usertype = user.usertype;
        userObj.photo = '/api/image/' + user._id;
    }
    return userObj;
}

/*
 * User status.
 * @method Controller.currentUser
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param next {Object} next callback
 */
Controller.prototype.currentUser = function (req, res) {
    if (!req.isAuthenticated()) {
        return res.status(200).json(currentUser());
    }
    Controller.prototype.model.findOne({ username: req.user.username }, function (err, result) {
        if (err) return res.status(200).json(currentUser());
        return res.status(200).json(currentUser(result));
    });
}
/*
 * User status.
 * @method Controller.setpwd
 * @param req {Object} Request object
 * @param res {Object} Response object
 * @param next {Object} next callback
 */
Controller.prototype.setpwd = function (req, res) {
    Controller.prototype.model.findByUsername(req.body.username).then(function (sanitizedUser) {
        if (sanitizedUser) {
            sanitizedUser.setPassword(req.body.password, function () {
                sanitizedUser.save();
                res.status(200).json({ message: 'password reset successful' });
            });
        } else {
            res.status(500).json({ message: 'This user does not exist' });
        }
    }, function (err) {
        res.status(500).json(err);
    })
}

/*
 * List of fields.
 * @method Controller.list
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.list = function (req, res) {
    return Crud.read(Controller, req, res);
}

/*
 * Create data record.
 * @method Controller.create
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.create = function (req, res) {
    return Crud.create(Controller, req, res);
}

/*
 * Update fields data.
 * @method Controller.update
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.update = function (req, res) {
    return Crud.update(Controller, req, res);
}

/*
 * Delete fields collection.
 * @method Controller.delete
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.delete = function (req, res) {
    Image.remove({ name: req.params.id }).exec();
    return Crud.delete(Controller, req, res);
}

/*
 * Update avatar image.
 * @method Controller.uploadAvatar
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.uploadAvatar = function (req, res) {
    Image.findOneAndUpdate({ name: req.params.id }, {
        name: req.params.id, 
        filename: req.body.filename, 
        type: req.body.type, 
        src: req.body.data
    }, { upsert: true }, function (err, result) {
        if (err) return res.send(500, { error: err });

        //res.contentType(doc.img.contentType);
        //res.send(doc.img.data);
        res.status(200).json({
            status: 'O.k.'
        });
    });
}

/*
 * Get avatar image code.
 * @method Controller.getAvatar
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.getAvatar = function (req, res) {
    //Image.findOne({ name: req.params.id }, function (err, result) {
    //    if (err || !result) {
    //        result = {
    //            type: 'image/png',
    //            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AcVByc6FvG3zQAABrlJREFUWMO1mFtsXFcVhr+1z5mLPTc7noydxLEdO4mctiRuqlCCVBQESoVoBQJCVYQIUl8qUYF4gYc8gUBFeUFCqOItDxVQRWorhUugkKpqIdC0oqZOmpTUje04djO+xJ7xuHM7e/FwxsnMZMaXJF3SzGjmrNnrP//6115rH+EO7Up6QQAQQSq/qerN6ztSbXon68odADkIfA4YAgZEJAWEfDy6DEwB74vI28aYMz0dsQ/uOaCpTD5eLBS+o6qPAT1AOxAHWhqs4QE5EckozAucF5GXepPxF+8a0FxBQ9ls9jFUj6jqAaC/+roRcAxIZRWr4FnQmmSJJ8J5Vf2nMeaF3mT8jTsC9L9r6W2hUPiIqh5V1aFGQD4uwnwOlou+jlqDkIwpQdcHZutUJCJ/AU64rnuquz2SXzegsZnFrar6fRH5HhCtFusKkHRGGJuBsRnhxrIgApsi0J+y9HRAKqGEKsCqAKGqkyJyTFVf2pFqW1oT0LujE9F4PPELVX0acOqdrcLwhOH0sPDeNR+IMYCCAtbCUJ/y5SHL4FbFSH0KAciKyDOZzOLv9g70lKsvuPWesVj8p6r67Xow4Ac++77h1H+EazeEUKABvQ6MTAiZZYevPGT57G5LoXSbVwz4WSwWLwIv1MSoS9W3gMeBRKNUzmaFv40I0wuCa5oL0zEwNgvnRoWJWf97vanqdhE5OjG/dLAhoKnFjxPAM8DOZnk99yHMLgnKrcpqKMzKtdE0jFw1uE5T18PW855QVakBtOipKZZKT6rqA6vV4sVrQqEMzjp2L9fxGR2f9auyiRlVPTQ+m3m0BlBmMRdF9SmgdbUg8zmh7K1vOxWgUIJcQWoqrS5tAIOq+o1qhI7n2T3Ag42EXLv/bKzTiKFZlVVbSET2j80sbgMwcwWNgH4JUGkWsLJgKq4EnDUDVO4eQi5EwxBw13TfpKqHAcxyLhcGDqyWiJX493crLcH1AfIsdCWUgZTF89Z0T4jIgysaCgL3qarRNSId3GnpTCiydhooW9jVBQ/1Q8lbrSIFVaKqOliRhbiq2r0eqbYE4esHLDs7laIHZe8WeytMlj1YLsDDA8rn77PEwnpbT7td2OoCWwFca61ptGM3MmthV5fytQOWN0eFC5OGjxZ8BkTANdC9SXmgGw7usvQldV3prWi3BcA1xmCtXVfVrGyI+3qUZEzZsRmmbviMIBAJQneHsnc7tEd8MHb9c6OsALIbKWVVKJZhSwJ6Ovy/Fko+2NYAeOoz5tmNrKkABQC3XC57wDTQtZaOpGrX9iyUirXizhZ8Bo1UtRat1VkzTCJyHcAVMSURHVXVThGR1SpNK28iUChDNg/ZvJAvVkQfgmhIaWv1W4euM10ikgOuALgtrS353NLSW8Bn6ru/AI7jf15fFC5OCaPX4eq8sLAslMo+yJXAUmEm6Pga2t6h7O5SdnbBljal3DyVi6r6DoCbDJtcbolXgB9UewRdXxvnx4Vzo8LVeWEpLywXIV+Ekl1R+a08VzM4nxOmbggjExBrUXqSyqf7lU9t98VetjWjwYLrumduKmJ8NrNZVc+q6gCIBF1lfFY4e1l4b1KYvCHkCr42TL1GVhG/rbxUIRKC3qSyZ5tyaI+yKaqoBURUVV/ckWo7crPbd3TE5oCTQD7owpW08Nd3hVdGDJemhWLZ70sBp/aUsboufN+AU2G7DBeuCaeHDaf/a0gvij/6wofAn2rGj1IZFZETRuRKoaS8dlF4/ZIhX4JwYNV5Zt1mxL+pogenh4V3xoR8CRzRsyJyqgZQe0C0Nxn/IBSU316akvTEnM/KamPq3QBT4OKUcPkjM9wWkZf7NifmG87UnfHYs+mMvO3Zm3R+ImaMf8OXpjkZa0m83HTIFxHds935cb4k/wgHBFX0XoNR9Q+Uivx6X6/z/G1g6394uD9yvnez/GRzXP8dDiKevXdgrArRMGxrtye62uS5L94fmWxwirrdXj/5w4l/XQ5eVrQ94DKYy9eeJjbESIUVEehqg0iYXw5ukV8d+2r0UsPDQeOSTZaB1579Q3ZuLC2zKI8Uy+zOFW51b5HmjU+r+lfAgdYQGnJ5KxnnzONDpeOH97Yv3NXjmON/zDx1YVKemFsyvaDbrCVS8qp227oFXccHAswHHKZTCR3Z38fzT38h9ud7+sDqub9nH52ck6PXM7o/vSjxXEECjtHAyjoKVi3FtgilzgQzqbi+2peSE999JHr+E3uC9qPfL8nxJ6P6m1eXA/mS6c8XikOKiaFqHcNcKOi8eehwS3qfiB47meXn34xtqFL/D5av7scx5f7QAAAAAElFTkSuQmCC'
    //        };
    //    }
    //    if (result) {
    //        var matches = result.src.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    //      , img = {};
            
    //        if (matches.length !== 3) {
    //            return res.send(500, { error: 'Invalid input string' });
    //        }
    //        img = new Buffer(matches[2], 'base64');

    //        res.writeHead(200, {
    //            'Content-Type': result.type,
    //            'Content-Length': img.length
    //        });
            
    //        res.end(img);
    //    }
    //});

    Autom.getAvatar(req.params.id, function (result) {
        var matches = result.src.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
          , img = {};
        
        if (matches.length !== 3) {
            return res.send(500, { error: 'Invalid input string' });
        }
        img = new Buffer(matches[2], 'base64');
        
        res.writeHead(200, {
            'Content-Type': result.type,
            'Content-Length': img.length
        });
        
        res.end(img);

    });

}

/*
 * Get tickets data.
 * @method Controller.userTickets
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.userTickets = function (req, res) {
    var retval = {}
      , view
      , state = Access.createState(req)
      ;
    

    retval.pageNumber = Math.max(1, parseInt(req.params.page));
    retval.pageLimit = parseInt(req.params.limit);
    retval.pageCount = 0;
    retval.pageTotal = 0;
    retval.pageMarked = 0;
    retval.markers = true;
    retval.items = [];
    retval.grpfld = 'status';
    retval.fields = ['ticnum', 'subject', 'requester', 'requestDate', 'strGroup', 'assignee'];
    
    
    function createQuery() {
        if (req.body.username) {
            return Ticket.find({
                $or: [
                    { 'requester': req.body.username }, 
                    { 'strAgent': req.body.username }
                ]
            }, { status: 1, ticnum: 1, subject: 1, requester: 1, requestDate: 1, strGroup: 1, assignee: 1 }
            );

        } else {
            return Ticket.find({
               'strOrgan': req.body.organ 
            }, { status: 1, ticnum: 1, subject: 1, requester: 1, requestDate: 1, strGroup: 1, assignee: 1 }
            );

        }
    }

    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No read Access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        //function (callback) {
        //    Autom.assignRefData(state, callback);
        //},
        function (callback) {
            var query = createQuery();
            query.count(function (err, cnt) {
                if (err) return callback(400, err);
                retval.pageTotal = cnt;
                retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit)+1);
                retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                return callback();
            });
        },
        function (callback) {
            var query = createQuery();
            query.select('lastComment')
            .sort({ status: 1 ,ticnum:1 })
            .skip((retval.pageNumber - 1) * retval.pageLimit)
            .limit(retval.pageLimit);
                    
            query.exec(function (err, result) {
                if (err) return callback(400, err.message);
                var grpval = '';
                retval.items = [];
                for (var i = 0, len = result.length; i < len; i++) {
                    var item = result[i]._doc;
                    if (retval.grpfld) {
                        if (i==0 && retval.pageNumber > 1) grpval = item[retval.grpfld];

                        if (grpval !== item[retval.grpfld]) {
                            grpval = item[retval.grpfld];
                            retval.items.push({ _grpfld: grpval });
                        }
                    }
                    retval.items.push(item);
                }
                return callback();
            });

        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        res.status(200).json(retval);
    });


}

/*
 * Get users of organisation data.
 * @method Controller.organUsers
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.organUsers = function (req, res) {
    var retval = {}
      , view
      , state = Access.createState(req)
      , domains = []
      ;
    
    
    retval.pageNumber = Math.max(1, parseInt(req.params.page));
    retval.pageLimit = parseInt(req.params.limit);
    retval.pageCount = 0;
    retval.pageTotal = 0;
    retval.pageMarked = 0;
    retval.markers = true;
    retval.items = [];
    retval.grpfld = '';
    retval.fields = ['username', 'fullname', 'phone', 'role', 'usertype', 'latestAccess'];
    
    
    function createQuery() {
        var expr = '('+domains.join('|')+')$'
          , query = Controller.prototype.model.find({username: new RegExp(expr, 'i') });
        return query.select('username fullname phone role usertype latestAccess');
    }
    
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No read Access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        //function (callback) {
        //    Autom.assignRefData(state, callback);
        //},
        function (callback) {
            Organ.findOne({ name: req.body.organ }, {domains:1}, function (err, result) {
                if (err) return callback3(500, err);
                domains = result.domains;
                return callback();
            });

        },
        function (callback) {
            var query = createQuery();
            query.count(function (err, cnt) {
                if (err) return callback(400, err);
                retval.pageTotal = cnt;
                retval.pageCount = Math.max(1, Math.floor(cnt / retval.pageLimit) + 1);
                retval.pageNumber = Math.max(1, Math.min(retval.pageNumber, retval.pageCount));
                return callback();
            });
        },
        function (callback) {
            var query = createQuery();
            query.sort({ username: 1 })
            .skip((retval.pageNumber - 1) * retval.pageLimit)
            .limit(retval.pageLimit);
            
            query.exec(function (err, result) {
                if (err) return callback(400, err.message);
                var grpval = '';
                retval.items = [];
                for (var i = 0, len = result.length; i < len; i++) {
                    var item = result[i]._doc;
                    retval.items.push(item);
                }
                return callback();
            });

        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        res.status(200).json(retval);
    });


}


/** Export controller. */
module.exports = exports = function (server){
    return new Controller(server);
}
/*    app.get('/api/getcake', function(req, res) {
        console.log("Get cake function");
        model.find(function (err, doc) {
            if (err) return next(err);
        var base64 = (doc[0].img.data.toString('base64'));
         res.send(base64);        
        });
    });
 */
