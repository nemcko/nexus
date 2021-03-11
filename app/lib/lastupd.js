module.exports = exports = function lastUpdatedPlugin(schema, options) {
    var mongoose = require('mongoose')
      , Schema = mongoose.Schema
      , ObjectId = Schema.ObjectId;

    schema.add({
        createDate: Date, 
        createUser: { type: String },
        lastUpdated: Date, 
        lastUpdater: { type: String }
    });
    
    schema.pre('save', function (next, req, callback) {
        if (req.user && req.user.username) {
            this.lastUpdated = new Date;
            this.lastUpdater = req.user.username;
            if (this.isNew) {
                this.createDate = this.lastUpdated;
                this.createUser = this.lastUpdater;
            }
        }
        next(callback);
    })
    
    if (options && options.index) {
        schema.path('lastUpdated').path('lastUpdater').index(options.index);
    }
}