var gulp       = require('gulp'),
    mocha      = require('gulp-mocha'),
    jshint     = require('gulp-jshint'),
    util       = require('gulp-util'),
    browserify = require('browserify'),
    source     = require('vinyl-source-stream'),
    stylish    = require('jshint-stylish');

gulp.task('lint', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('test', ['lint'], function() {
  gulp.src('test/**/*.js', {read: false})
    .pipe(mocha({reporter: 'dot'}))
    .on('error', util.log);
});

gulp.task('browserify', ['lint'], function() {
    return browserify('./lib/client/app.js', {standalone: 'tashmetu'})
        .bundle()
        .pipe(source('tashmetu.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', ['default'], function () {
  gulp.watch(['./lib/**/*.js', './test/**/*.js'], ['lint', 'test', 'browserify']);
});

gulp.task('default', ['lint', 'test', 'browserify']);
