const gulp = require('gulp');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const rm = require('rimraf');
const zip = require('gulp-zip');
const eslint = require('gulp-eslint');

const webpackConfig = require('./webpack.config');

gulp.task('clean', done => {
  rm('./dist', done);
});

gulp.task('lint', () => {
  return gulp.src([
    './app/scripts/*.js'
  ]).pipe(eslint({
    useEslintrc: true
  })).pipe(eslint.format()).pipe(eslint.failAfterError());
});

gulp.task('copy-src-files', () => {
  return gulp.src([
    './app/*.*',
    './app/_locales/**',
    './app/scripts/background.js',
    './app/libs/ace/*.js',
    './app/styles/*.css',
    './app/images/*.ico',
    './app/images/*.png',
    './app/images/*.gif'
], {
    base: 'app'
  }).pipe(gulp.dest('./dist'));
});

gulp.task('copy-dependent-files', () => {
  return gulp.src([
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jcanvas/dist/jcanvas.js',
    './node_modules/bootstrap/dist/js/bootstrap.min.js',
    './node_modules/bootstrap/dist/css/bootstrap.min.css',
    './node_modules/responsive-toolkit/dist/bootstrap-toolkit.min.js',
    './node_modules/fullcalendar/dist/fullcalendar.min.css',
    './node_modules/moment/min/moment.min.js',
    './node_modules/fullcalendar/dist/fullcalendar.min.js'
], {
    base: 'node_modules'
  }).pipe(gulp.dest('./dist/node_modules'));
});

gulp.task('copy-files', gulp.parallel('copy-src-files', 'copy-dependent-files'));

gulp.task('package', () => {
  const manifest = require('./dist/manifest.json');
  const version = manifest.version;
  return gulp.src('./dist/**/*').pipe(zip(`mindmap-tab-${version}.zip`)).pipe(gulp.dest('./package'));
});

gulp.task('webpack', () => {
  return webpackStream(webpackConfig,webpack)
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('service-worker', () => {
  return gulp.src('app/scripts/service_worker*.js')
    .pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series('clean', 'lint', 'webpack', 'service-worker', 'copy-files', 'package'));
