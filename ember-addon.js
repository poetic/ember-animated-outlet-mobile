'use strict';

var pickFiles = require('broccoli-static-compiler');
var path      = require('path');
var fs        = require('fs');

function AnimatedOutletMobile(project) {
  this.project = project;
  this.name = "Ember CLI Ember Animated Outlet Mobile";
}

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

AnimatedOutletMobile.prototype.treeFor = function(name) {
  if (name !== 'vendor') {
    return;
  }

  var libPath = unwatchedTree(path.join(__dirname, 'dist'));

  var lib = pickFiles(libPath, {
    srcDir: '/',
    files: ['*.js', '*.css'],
    destDir: '/ember-animated-outlet-mobile/dist'
  });

  return lib;
};

AnimatedOutletMobile.prototype.included = function(app) {
  app.import('vendor/ember-animated-outlet-mobile/dist/ember-animated-outlet-mobile.css');
  app.import('vendor/ember-animated-outlet-mobile/dist/ember-animated-outlet-mobile.js');
};

module.exports = AnimatedOutletMobile;
