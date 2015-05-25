var _ = require('underscore');
var fs = require('fs');
var path = require('path');

function ModuleLoader(rocket, io, app, opts) {
  var defaultConfig = {
    moduleDir: 'modules'
  };

  this.rocket = rocket;
  this.io = io;
  this.app = app;
  this.config = _.extend(defaultConfig, opts);
  this.modules = {};
}

ModuleLoader.prototype.loadFromDir = function () {
  fs.readdirSync(__dirname + '/' + this.config.moduleDir).forEach(function (file) {
    if (path.extname(file).toLowerCase() === '.js') {
      console.log('Module Loader: loading file ', file);
      var Module = require(__dirname + '/' + this.config.moduleDir + '/' + file);
      this.addModule(Module);
    }
  }.bind(this));
};

ModuleLoader.prototype.getModules = function() {
  return _.map(this.modules, function(module) {
      return {
        name: module.name,
        enabled: module.isEnabled(),
        ui: module.getUserInterface()
      }
    }
  );
};

ModuleLoader.prototype.addModule = function(Module) {
  var m = new Module(this.rocket, this.io, this.app);
  this.modules[m.name] = m;
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