var _ = require('underscore');
var fs = require('fs');
var path = require('path');

function ModuleLoader(rocket, io, opts) {
  var defaultConfig = {
    moduleDir: 'modules'
  };

  this.rocket = rocket;
  this.io = io;
  this.config = _.extend(defaultConfig, opts);
  this.modules = {};
}

ModuleLoader.prototype.loadFromDir = function () {
  fs.readdirSync(__dirname + '/' + this.config.moduleDir).forEach(function (file) {
    if (path.extname(file).toLowerCase() === '.js') {
      var module = require(__dirname + '/' + this.config.moduleDir + '/' + file);
      this.addModule(module);
    }
  }.bind(this));
};

ModuleLoader.prototype.getModules = function() {
  return this.modules;
};

ModuleLoader.prototype.addModule = function(module) {
  this.modules[module.name] = module;
  module(this.rocket, this.io);
};

ModuleLoader.prototype.removeModule = function(module) {
  this.modules[module].disable();
  delete(this.modules[module]);
};

ModuleLoader.prototype.enable = function(moduleName) {
  this.modules[moduleName].enable();
};

ModuleLoader.prototype.disable = function(moduleName) {
  this.modules[moduleName].disable();
};

module.exports = ModuleLoader;
