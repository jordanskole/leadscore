var gulp = require('gulp');
var server = require('gulp-express');

// watch files for changes and reload
gulp.task('serve', function() {
  //start the server at the beginning of the task
  server.run({
      file: 'app.js'
  });

  // restart the server when file changes
  gulp.watch(['*.js'], server.notify);
});

gulp.task('default', ['serve']);
