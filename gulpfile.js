'use strict';

var gulp        = require('gulp'),
    tslint      = require('gulp-tslint'),
    tsc         = require('gulp-typescript'),
    runSequence = require('run-sequence');

// Lint
//-----------------------------------------------------------------------------
gulp.task('lint', function() {
  var config =  {formatter: 'verbose'};
  return gulp.src([
    'src/**/**.ts'
  ])
  .pipe(tslint(config))
  .pipe(tslint.report());
});

var tstProject = tsc.createProject('tsconfig.json', {
  typescript: require('typescript')
});

// Build
//-----------------------------------------------------------------------------
gulp.task('build', function() {
  return gulp.src([
    'src/**/*.ts'
  ])
  .pipe(tstProject())
  .on('error', function (err) {
      process.exit(1);
  })
  .js.pipe(gulp.dest('dist/'));
});

// Build dts
//-----------------------------------------------------------------------------
var tsDtsProject = tsc.createProject('tsconfig.json', {
  declaration: true,
  noResolve: false,
  typescript: require('typescript')
});

gulp.task('build-dts', function() {
  return gulp.src([
    'src/**/*.ts'
  ])
  .pipe(tsDtsProject())
  .on('error', function (err) {
    process.exit(1);
  })
  .dts.pipe(gulp.dest('dts'));
});

// Default
//-----------------------------------------------------------------------------
gulp.task('default', function (cb) {
  runSequence('lint', ['build', 'build-dts'], cb);
});
