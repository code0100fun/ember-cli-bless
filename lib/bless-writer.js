/*eslint node:true */
var fs = require('fs');
var RSVP = require('rsvp');
var path = require('path');
var mkdirpSync = require('fs-extra').mkdirpSync;
var Writer = require('broccoli-caching-writer');
var walkSync = require('walk-sync');
var mapSeries = require('promise-map-series');
var { chunkFile } = require('bless');
var copyDereferenceSync = require('copy-dereference').sync;

module.exports = BlessWriter;

BlessWriter.prototype = Object.create(Writer.prototype);
BlessWriter.prototype.constructor = BlessWriter;

function BlessWriter(inputTrees, options) {
  if (!(this instanceof BlessWriter)) {
    return new BlessWriter(inputTrees, options);
  }
  this.options = options;
  Writer.call(this, inputTrees, options);
}

BlessWriter.prototype.build = function() {
  var srcDir = this.inputPaths[0];
  var destDir = this.outputPath;
  var self = this;
  var paths = walkSync(srcDir);

  return mapSeries(paths, function(relativePath) {
    if (/\/$/.test(relativePath)) {
      var destPath = destDir + '/' + relativePath;
      mkdirpSync(destPath);
    } else {
      let outputPath = path.join(destDir, relativePath);
      let outputDir = path.dirname(outputPath);

      if (/\.css$/.test(relativePath)) {
        var srcPath = path.join(srcDir, relativePath);
        let basename = path.basename(relativePath, '.css');

        return self.bless(srcPath, relativePath, self.options).then(function(outputs) {
          if (outputs.length > 1) {
            return outputs.map(function(output, index) {

              let outputFilename = path.join(outputDir, `${basename}.${index}.css`);
              fs.writeFileSync(outputFilename, output, {
                encoding: 'utf8'
              });

              return outputFilename;
            });
          } else {
            copyDereferenceSync(
              path.join(srcDir, relativePath),
              path.join(destDir, relativePath)
            );
          }
        }, function(error) {
          console.log('error:', error);
        }).then((result) => {
          if (result && result.length > 1) {
            let outputFilename = path.join(destDir, relativePath);
            let imports = result.map((css) => {
              let basename = path.basename(css);
              return `@import url('${basename}');`;
            }).join('\n') + '\n';
            fs.writeFileSync(outputFilename, imports, {
              encoding: 'utf8'
            });
          }
        });
      }
    }
  });
};

BlessWriter.prototype.bless = function(srcPath, output, options) {
  return chunkFile(srcPath, options).then(function({ data, maps, totalSelectorCount }) {
    var blessedFiles = data;
    var numSelectors = totalSelectorCount;
    if (options.log) {
      // print log message
      var msg = 'Found ' + numSelectors + ' selector' + (numSelectors === 1 ? '' : 's') + ', ';
      if (blessedFiles.length > 1) {
        msg += 'splitting into ' + blessedFiles.length + ' blessedFiles.';
      } else {
        msg += 'not splitting.';
      }
      console.log(msg);
    }

    // write processed file(s)
    return blessedFiles;

  }, function(err) {
    throw new Error(err);
  });
};
