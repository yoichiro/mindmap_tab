// generated on 2016-04-12 using generator-chrome-extension 0.5.1
import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import del from "del";
import runSequence from "run-sequence";
import browserify from "browserify";
import source from "vinyl-source-stream";
import babelify from "babelify";

const $ = gulpLoadPlugins();

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe($.eslint(options))
      .pipe($.eslint.format());
  };
}

gulp.task("extras", () => {
  return gulp.src([
    "app/*.*",
    "app/_locales/**",
    "!app/scripts.babel",
    "app/scripts/bundle.js",
    "app/scripts/background.js",
    "app/bower_components/jquery/dist/jquery.min.js",
    "app/bower_components/jcanvas/jcanvas.js",
    "app/bower_components/bootstrap/dist/js/bootstrap.min.js",
    "app/bower_components/bootstrap/dist/css/bootstrap.min.css",
    "app/bower_components/responsive-bootstrap-toolkit/dist/bootstrap-toolkit.min.js",
    "app/bower_components/fullcalendar/dist/fullcalendar.min.css",
    "app/bower_components/moment/min/moment.min.js",
    "app/bower_components/fullcalendar/dist/fullcalendar.min.js",
    "app/libs/ace/*.js",
    "app/*.json",
    "app/*.html",
    "app/styles/*.css",
    "app/images/*.ico",
    "app/images/*.png",
    "app/images/*.gif"
  ], {
    base: "app",
    dot: true
  }).pipe(gulp.dest("dist"));
});

gulp.task("lint", lint("app/scripts.babel/**/*.js", {
  env: {
    es6: true
  }
}));

gulp.task("babel", () => {
  return gulp.src("app/scripts.babel/**/*.js")
      .pipe($.babel({
        presets: ["es2015"]
      }))
      .pipe(gulp.dest("app/scripts"));
});

gulp.task("browserify", () => {
  return browserify({
    entries: [
      "app/scripts/newtab.js"
    ],
    extensions: [
      ".jsx"
    ]
  }).transform(babelify, {
    presets: ["es2015", "react"]
  }).bundle()
    .pipe(source("bundle.js"))
    .pipe(gulp.dest("app/scripts"));
});

gulp.task("serviceWorker", () => {
  gulp.src("app/scripts/service_worker*.js")
    .pipe(gulp.dest("app"));
});

gulp.task("package", function () {
  const manifest = require("./dist/manifest.json");
  return gulp.src("dist/**")
      .pipe($.zip("mindmap_tab-" + manifest.version + ".zip"))
      .pipe(gulp.dest("package"));
});

gulp.task("clean", del.bind(null, [".tmp", "dist"]));

gulp.task("build", (cb) => {
  runSequence(
    "lint", "babel", "serviceWorker", "browserify", "extras", "package", cb);
});

gulp.task("default", ["clean"], cb => {
  runSequence("build", cb);
});
