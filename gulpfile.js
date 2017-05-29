'use strict';

var gulp=  require('gulp');
var less = require('gulp-less');

var browserSync = require('browser-sync');//.create();
var reload      = browserSync.reload;
var connectPHP = require('gulp-connect-php');

var notify = require('gulp-notify');
var combiner = require('stream-combiner2').obj;

var rigger = require('gulp-rigger');
var uglify = require('gulp-uglify');

var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

var rimraf = require('rimraf');
var ghPages = require('gulp-gh-pages');

var postcss = require('gulp-postcss');
var postcsssvgtwo = require('postcss-inline-svg');
var mqPacker = require("css-mqpacker");
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var rename = require('gulp-rename');

var path = {
    public: {
      html: 'public/',
       php: 'public/',
        js: 'public/js/',
        style: 'public/css/',
        img: 'public/img/',
        fonts: 'public/fonts/'
    },
    src: {
        html: 'src/*.html',
        php: 'src/*.php',
        js: 'src/js/script.js',
        style: 'src/style/style.less',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
       html: 'src/**/*.html',
       php: 'src/**/*.php',
       js: 'src/js/**/*.js',
       style: 'src/style/**/*.less',
       img: 'src/img/**/*.*',
       fonts: 'src/fonts/**/*.*'
   },
   watchPub: {
       html: 'public/**/*.html',
       php: 'public/**/*.php',
       js: 'public/js/**/*.js',
       style: 'public/css/**/min-style.css',
       img: 'public/img/**/*.*',
       fonts: 'public/fonts/**/*.*'
   },
    clean: './public/'
};



// ******************* Compiling


  //less transform
gulp.task('less', function () {
  return combiner(
   gulp.src(path.src.style),
   less(),
   postcss([postcsssvgtwo,mqPacker,autoprefixer({browsers: ['last 2 versions', '> 2%']})]),
   gulp.dest(path.public.style),
   postcss([cssnano]),
   rename({prefix : 'min-'}),
   gulp.dest(path.public.style)).on('error', notify.onError());
});


//delete public
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

// compiling HTML
gulp.task('html', function () {
    return combiner(
        gulp.src(path.src.html),
        rigger(),
        gulp.dest(path.public.html)).on('error', notify.onError());
});
//  compiling php
gulp.task('php', function () {
    return combiner(
        gulp.src(path.src.php),
        gulp.dest(path.public.php)).on('error', notify.onError());
});

//minify js
gulp.task('js', function () {
  return combiner(
    gulp.src(path.src.js),
    gulp.dest(path.public.js),
    rigger(),
    uglify(),
    rename({prefix : 'min-'}),
    gulp.dest(path.public.js)).on('error', notify.onError());
});

//copy img
gulp.task('img', function () {
    return combiner(
    gulp.src(path.src.img),
        gulp.dest(path.public.img)).on('error', notify.onError());
});

//optimization + copy img
gulp.task('img-optim', function () {
    return combiner(
    gulp.src(path.src.img),
      imagemin({
            progressive: true,
            optimizationLevel:3,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }),
        gulp.dest(path.public.img)).on('error', notify.onError());
});

//copy fonts
gulp.task('fonts', function() {
  return combiner(
    gulp.src(path.src.fonts),
        gulp.dest(path.public.fonts)).on('error', notify.onError());
});

// ******************* Compiling



//watcher
gulp.task('watch' , function(){
  gulp.watch([path.watch.style], gulp.series('less'));
  gulp.watch([path.watch.html], gulp.series('html'));
  gulp.watch([path.watch.js], gulp.series('js'));
  gulp.watch([path.watch.fonts], gulp.series('fonts'));
  gulp.watch([path.watch.img], gulp.series('img'));
  gulp.watch([path.watch.php], gulp.series('php'));
  gulp.watch([path.watchPub.html , path.watchPub.js, path.watchPub.style, path.watchPub.img, path.watchPub.fonts]).on("change", reload);
});


//*************************** Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
          baseDir: "./public/"
        },
          host: 'localhost',
          port: 9000,
          logPrefix: "lBeJIuk-server",
          notify: false,
    });
});

//*************************** Static server PHP`
gulp.task('browser-sync-php', function() {
  connectPHP.server({
    base:"./public/"
      }, function (){
        browserSync.init({
            proxy: '127.0.0.1:8000',
            port: 9000
    });
  });
});
//*************************** Static server PHP

//push to gh-pages, for hosting on Github
gulp.task('git-host', function() {
    return gulp.src(path.public.html +'**/*')
    .pipe(ghPages());
});


//task for development
gulp.task('dev' , gulp.series('less' ,'html','js', 'fonts', gulp.parallel('watch' , 'browser-sync')));

//task for development PHP
gulp.task('dev-php' , gulp.series('less' ,'html','php','js', 'fonts', gulp.parallel('watch' , 'browser-sync-php')));

//task for final test
gulp.task('build' , gulp.series('clean','less' ,'html','js', 'fonts','img-optim', 'browser-sync'));

//task for final hosting on Github
gulp.task('deploy' , gulp.series('clean','less' ,'html','js', 'fonts','img-optim','git-host'));
