var gulp   = require('gulp'),
    concat = require('gulp-concat');

gulp.task('concatScripts', function() {
  gulp.src('src/client/**/*.js')
    .pipe(concat('tashmetu.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('watch', ['default'], function () {
  gulp.watch('./js/**/*.js', ['concatScripts']);
});

gulp.task('default', ['concatScripts']);
