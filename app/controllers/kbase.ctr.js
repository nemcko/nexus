/**
 * @module Settings Controller for KB category
 */

'use strict';

/** Module objects. */
var async = require("async")
  , Access = require('../lib/access.js')
  , Crud = require('../lib/crud.js')
  , Board = require('../lib/board.js')
  , Kbase = require('../models/kbase.mod.js')
  , Kbattach = require('../models/kbattach.mod.js')
  , User = require('../models/user.mod.js')
  , slug = require('slug')
  , ObjectID = require('mongodb').ObjectID
  , Ticket = require('../models/ticket.mod.js')
  , root = {};

/**
 * Controller class.
 * @class
 */
var Controller = function (obj) {
    root = obj;
};

/*
 * @property {object} Controller.model  - Data model.
 */
Controller.prototype.model = require('../models/kbcateg.mod.js');

/*
 * Assign data fields into model.
 * @method Controller.assignData
 * @param fields {Array} fields of data model
 * @param indata {Array} web request fields
 * @param user {Object} Current User
 */
Controller.prototype.assignData = function (fields, indata, user) {
    fields.name = indata.name;
    fields.slug = slug(indata.name);
};

/*
 * Where condition for data select.
 * @param req {Object} Request object
 */
Controller.prototype.whereCond = function (req) {
    return { name: { $regex: req.body.search , $options: "i" } };
};

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
    return Crud.delete(Controller, req, res);
}


/** Export controller. */
module.exports = exports = function (server) {
    return new Controller(server);
}


Controller.prototype.getCategoryItems = function (req, res, retval, callback) {
    var search = {};
    if (req.body.search) {
        search = {
            $text: {
                $search: req.body.search,
                $caseSensitive: false, $diacriticSensitive: false
            }
        };
        //Kbase.find(search, function (err, results) {
        //    async.map(results, function (article, next) {
        //        Controller.prototype.model.populate(article, { path: 'refCateg' , select: '_id name' }, function (err, cat) {
        //            var category = {
        //                _id: cat.refCateg._id,
        //                name: cat.refCateg.name,
        //                articles: [article]
        //            }
        //            retval.items.push(category);
        //            next();
        //        });
        //    }, function (err) {
        //        callback();
        //    });

        //});
    } //else {

    Kbase.find(search)
            .populate('refCateg', '_id name slug').sort('refCateg')
            .exec(function (err, results) {
        //retval.items = results;
        
        var aitems = {};
        
        for (var i = 0, len = results.length; i < len; i++) {
            if (results[i].refCateg) {
                var catid = results[i].refCateg._id;
                if (!aitems[catid])
                    aitems[catid] = {
                        name: results[i].refCateg.name,
                        slug: results[i].refCateg.slug,
                        articles: []
                    };

                aitems[catid].articles.push({
                    _id: results[i]._id,
                    title: results[i].title,
                    slug: results[i].slug,
                    //article: results[i].article,
                    //attachment: results[i].attachment,
                    //comments: results[i].comments,
                    //refAuthor: results[i].refAuthor,
                    //lastUpdated: results[i].lastUpdated,
                });
            }
        }
        if (!retval.items) retval.items = [];
        async.map(aitems, function (aitem, cbcategory) {
            retval.items.push(aitem);
            cbcategory();
        }, function (err) {
            callback();
        });

          
        //if (!retval.items) retval.items = [];
        //async.map(aitems, function (aitem, cbcategory) {
        //    async.everySeries(aitem.articles, function (article, cbarticle) {
        //        async.everySeries(article.comments, function (comment, cbcomment) {
        //            if (comment.attachment) {
        //                Controller.prototype.getAttachment(comment, cbcomment);
        //            } else {
        //                cbcomment();
        //            }
        //        }, function (err) {                
        //            if (article.attachment) {
        //                Controller.prototype.getAttachment(article, cbarticle);
        //            } else {
        //                cbarticle();
        //            }         
        //        });
        //    }, function (err) {
        //        retval.items.push(aitem);
        //        cbcategory();
        //    });
        //}, function (err) {
        //    callback();
        //});
        
    });        
}

Controller.prototype.populateDetail = function (req, cond, retval, callback) {
    Kbase.find(cond, function (err, results) {
        if (err) return callback(400, err);
        var items = [];
        async.map(results, function (article, cbarticle) {
            Controller.prototype.setTicketViewed(req, article.ticnum);
            User.populate(article, { path: 'refAuthor' , select: '_id username fullname phone' }, function (err, result) {
                var comments = [];
                async.map(article.comments, function (comment, cbcomment) {
                    User.populate(comment, { path: 'refAgent' , select: '_id username fullname phone' }, function (err, result) {
                        var acomment= {
                            _id: comment._id,
                            comment: comment.comment,
                            posted: comment.posted,
                            refAgent: comment.refAgent,
                            attachment: comment.attachment,
                        }
                        Controller.prototype.getAttachment(acomment, function () {
                            comments.push(acomment);
                            cbcomment();
                        });
                    });
                }, function (err) {
                    var item = {
                        _id: article._id,
                        refCateg: article.refCateg,
                        refAuthor: article.refAuthor,
                        article: article.article,
                        attachment: article.attachment,
                        comments: comments,
                        createDate: article.createDate,
                        createUser: article.createUser,
                        lastUpdated: article.lastUpdated,
                        lastUpdater: article.lastUpdater,
                        slug: article.slug,
                        title: article.title,
                        ticnum: article.ticnum,
                    }
                    items.push(item);
                    Controller.prototype.getAttachment(item, cbarticle);
                });
            });
        }, function (err) {
            retval.items = items;
            callback();
        });
    });

}

Controller.prototype.getAttachment = function (item, callback) {
    if (item.attachment) {
        Kbattach.findById({ _id: item.attachment }, { _id: 0, attachment: 1 }, function (err, attach) {
            var attachment = [];
            for (var i = 0, len = attach.attachment.length; i < len; i++) {
                attachment.push(
                    {
                        uri: attach.attachment[i].uri,
                        filename: attach.attachment[i].filename,
                        type: attach.attachment[i].type,
                    }
                );
            }
            item.attachment_id = item.attachment;
            item.attachment = attachment;
            callback();
        });
    } else {
        callback();
    }
}
Controller.prototype.delAttachments = function (aid, callback) {
    Kbattach.remove({ refKbase: aid }, function (err, result) {
        callback(err, result);
    });
}
Controller.prototype.delAttachment = function (aid, id, callback) {
    Kbattach.remove({ refKbase: aid, refKbcom: id }, function (err, result) {
        callback(err, result);
    });
}


/*
 * Search in knowledge.
 * @method Controller.search
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.search = function (req, res) {
    var conditions = {}
  , categories = []
  , retval = {
            pageNumber: Math.max(1, parseInt(req.params.page)),
            pageLimit: parseInt(req.params.limit),
            pageCount: 0,
            items: []
        }
  ;
    
    //if (req.body.search || req.query.search) {
    //    conditions = Controller.prototype.whereCond(req);
    //}
    
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No read Access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            return Controller.prototype.getCategoryItems(req, res, retval, callback);          
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

/*
 * Update KB article.
 * @method Controller.updarticle
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.updarticle = function (req, res) {
    var retval = {}, article;
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.update === false) return callback(403, 'No update access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            if (req.body._id) {
                Kbase.findById(req.body._id, function (err, result) {
                    if (err || !result) {
                        article = new Kbase();
                    } else {
                        article = result;
                    }
                    callback();
                });
            } else {
                article = new Kbase();
                callback();
            }
        },
        function (callback) {
            if (req.body.attachfiles && req.body.attachfiles.length) {
                Controller.prototype.attachFiles(req, article._id, article, callback);
            } else {
                callback();
            }      
        },
        function (callback) {
            article.refCateg = req.body.refCateg;
            article.refAuthor = req.user;
            article.title = req.body.title;
            article.article = req.body.article;
            article.slug = slug(req.body.title);
            article.lastUpdater =  req.user.username;
            article.lastUpdated = new Date;

            article.save(req, function (err, result) {
                if (err) return callback(400, err);
                //if (req.body._id) {
                //    Controller.prototype.getCategoryItems(req, res, retval, callback);
                //} else {
                //    Controller.prototype.populateDetail(req, { 'slug': slug(req.body.title) }, retval, callback);
                //}
                //Controller.prototype.getCategoryItems(req, res, retval, callback);
                
                Controller.prototype.populateDetail(req, { 'slug': slug(article.title) }, retval, callback);

            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

Controller.prototype.attachFiles = function (request, aid, model, callback) {
    if (model.attachment) {
        Kbattach.findOneAndUpdate({ _id: model.attachment }, { $set: {'attachment': request.body.attachfiles } }, callback);
    } else {
        var attach = new Kbattach();
        attach.refKbase = aid;
        attach.refKbcom = model._id;
        attach.attachment = request.body.attachfiles;
        model.attachment = attach;
        attach.save(callback);
    }
}

/*
 * Delete KB article.
 * @method Controller.delarticle
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.delarticle = function (req, res) {
    var retval = {
        items: []
    }, article;
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.delete === false) return callback(403, 'No create access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Controller.prototype.delAttachments(req.params.id, callback);
        },
        function (callback) {
            //Kbase.remove({ _id: req.params.id }, callback);
            Kbase.findById(req.params.id, function (err, kbase) {
                if (err) return callback(err);
                if (kbase.ticnum) {
                    var userId = new ObjectID(req.user._id);
                    Ticket.update({ ticnum: kbase.ticnum, viewed: { $exists: true, $in: [userId] } }, { $pull: { viewed: userId } }, function (err, result) {
                        kbase.remove(callback);
                    });
                } else {
                    kbase.remove(callback);
                }
            });

        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}



/*
 * Get KB article data.
 * @method Controller.detail
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.detail = function (req, res) {
    var retval = {
        items: []
    };
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No create access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Controller.prototype.populateDetail(req, { 'slug': req.body.slug }, retval, callback);
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        res.status(200).json(retval);
    });
}


/*
 * Update comment of article.
 * @method Controller.updcomment
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.updcomment = function (req, res) {
    var retval = {
        items: []
    }
    , comment = {
            _id: (req.body._id ?req.body._id:new ObjectID()),
            refAgent: req.user,
            posted: new Date,
            comment : req.body.comment, 
            lastUpdater: req.user.username, 
            lastUpdated: new Date
        };
    
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.update === false) return callback(403, 'No update access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            if (req.body.attachfiles && req.body.attachfiles.length) {
                Controller.prototype.attachFiles(req, req.body.aid, comment, callback);
            } else {
                callback();
            }
        },
        function (callback) {
            if (req.body._id) {
                Kbase.update({ _id: req.body.aid, "comments._id": req.body._id   }, { $set: { 'comments.$': comment } }, function (err, result) {
                    if (err) return callback(400, err);
                    Controller.prototype.populateDetail(req, { 'slug': req.body.aslug }, retval, callback);
                });
            } else {
                Kbase.update({ _id: req.body.aid }, { $push: { 'comments': comment } }, function (err, result) {
                    if (err) return callback(400, err);
                    Controller.prototype.populateDetail(req, { 'slug': req.body.aslug }, retval, callback);
                });
            }
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

/*
 * Delete KB article.
 * @method Controller.delcomment
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.delcomment = function (req, res) {
    var retval = {
        items: []
    }, article;
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.delete === false) return callback(403, 'No create access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Controller.prototype.delAttachment(req.body.aid, req.params.id, callback);
        },
        function (callback) {
            Kbase.update({ _id: req.body.aid }, { $pull: { 'comments': { _id: req.params.id} } }, function (err, result) {
                if (err) return callback(400, err);
                //Controller.prototype.delAttachment(acomment, function () {
                //    comments.push(acomment);
                //    cbcomment();
                //});

                Controller.prototype.populateDetail(req, { 'slug': req.body.aslug }, retval, callback);
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}


/*
 * Category list.
 * @method Controller.catlist
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.catlist = function (req, res) {
    var retval = {
        items: []
    };
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.create === false) return callback(403, 'No create access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Controller.prototype.model.find({}, { name: 1, slug: 1 }, function (err, results) {
                retval.items = results;
                callback();
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

/*
 * KB attachment.
 * @method Controller.attachment
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.attachment = function (req, res) {
    var items = [];
    Kbattach.findById(req.params.atid,function (err, attach) {
        if (err || !attach) return res.send(500, { error: err });
        attach.attachment.map(function (att) {
            if (req.params.uri === att.uri) {
                var matches = att.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
                      , img = {};
                
                if (matches) {
                    if (matches.length !== 3) {
                        return res.send(500, { error: 'Invalid input string' });
                    }
                    img = new Buffer(matches[2], 'base64');
                } else {
                    img = att.data;
                }
                res.writeHead(200, {
                    'Content-Type': att.type,
                    'Content-Length': img.length
                });
                res.end(img);
            }
        });
        res.end();
    });
}

/*
 * New items in KB.
 * @method Controller.kbnew
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.kbnew = function (req, res) {
    var retval = {
        items: []
    };
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.read === false) return callback(403, 'No create access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Kbase.find({ refCateg: { $exists: false } }, { title: 1, slug: 1, ticnum: 1 }, function (err, results) {
                retval.items = results;
                callback();
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });
        
        res.status(200).json(retval);
    });
}

/*
 * Update category of item KB.
 * @method Controller.savenewkbitem
 * @param req {Object} Request object
 * @param res {Object} Response object
 */
Controller.prototype.savenewkbitem = function (req, res) {
    var retval = {
        items: []
    };
    
    async.series([
        function (callback) {
            Access.getAccess(req, function (err, acc) {
                if (err || acc.update === false) return callback(403, 'No update access for ' + acc.oid + '.');
                retval.acc = acc;
                callback();
            });
        },
        function (callback) {
            Kbase.update({ _id: req.body._id }, { refCateg: req.body.refCateg, lastUpdater: req.user.username,lastUpdated: new Date }, function (err, result) {
                if (err) return callback(400, err);
                //callback();
                Kbase.find({ refCateg: { $exists: false } }, { title: 1, slug: 1, ticnum: 1 }, function (err, results) {
                    retval.items = results;
                    callback();
                });
            });
        }
    ], function (err, msg) {
        if (err) return res.status(err).json({ err: msg });       
        //res.status(200).json({ msg: 'o.k.' });
        res.status(200).json(retval);
    });
}

Controller.prototype.setTicketViewed = function (req, ticnum) {
    var userId = new ObjectID(req.user._id);
    if (ticnum) {
        Ticket.update({ ticnum: ticnum, viewed: { $exists: true, $nin: [userId] } }, { $push: { viewed: userId } }, function (err, result) {
            if (err) return;
        });
    }
}

