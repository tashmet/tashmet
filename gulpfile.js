var gulp    = require('gulp'),
    jshint  = require('gulp-jshint'),
    util    = require('gulp-util'),
    stylish = require('jshint-stylish');

gulp.task('lint', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('watch', ['default'], function () {
  gulp.watch('./lib/**/*.js', ['lint']);
});

gulp.task('default', ['lint']);
