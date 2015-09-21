var gulp   = require('gulp'),
    concat = require('gulp-concat');

gulp.task('concatScripts', function() {
  gulp.src('js/**/*.js')
    .pipe(concat('tashmetu.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('default', ['concatScripts']);