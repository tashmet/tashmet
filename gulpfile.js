var gulp    = require('gulp'),
    mocha   = require('gulp-mocha'),
    jshint  = require('gulp-jshint'),
    util    = require('gulp-util'),
    stylish = require('jshint-stylish');

gulp.task('lint', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('test', ['lint'], function() {
  gulp.src('test/**/*.js', {read: false})
    .pipe(mocha({reporter: 'spec'}))
    .on('error', util.log);
});

gulp.task('watch', ['default'], function () {
  gulp.watch(['./lib/**/*.js', './test/**/*.js'], ['lint', 'test']);
});

gulp.task('default', ['lint', 'test']);
