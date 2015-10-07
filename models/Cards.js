var mongoose = require('mongoose');

var CardSchema = new mongoose.Schema({
  title: String,
  created: { type: Date, default: Date.now },
  modified: { type: Date, default: Date.now },
  name: {
    first: String, 
    last: String
  },
  sport: String,
  atts: String,
  stats: String
});

CardSchema.methods.updateStats = function () {
  // updating stats - eventually pulled using api
};

CardSchema.methods.updateAtts = function () {
  // updating attributes - eventually pulled using api
};

mongoose.model('Card', CardSchema);