var gulp = require('gulp');
var less = require('gulp-less');
var cssmin = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');

//jquery
gulp.task('jquery',async function(){
    await gulp.src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('public/static'));
});

//bootstrap
gulp.task('bootstrap',async function(){
    gulp.src('node_modules/bootstrap/dist/js/bootstrap.min.js')
        .pipe(gulp.dest('public/static'));
    await gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
        .pipe(gulp.dest('public/static'));
});

//fontawesome
gulp.task('fontawesome',async function(){
    gulp.src('node_modules/font-awesome/fonts/**/*')
        .pipe(gulp.dest('public/static/fonts'));
    await gulp.src('node_modules/font-awesome/css/font-awesome.min.css')
        .pipe(gulp.dest('public/static'));
});

//animate.css
gulp.task('animate-css',async function(){
    await gulp.src('node_modules/animate.css/animate.min.css')
        .pipe(gulp.dest('public/static'));
});

//moment.js
gulp.task('momentjs', async function(){
    await gulp.src('node_modules/moment/moment.js').pipe(concat('node_modules/moment/locale/zh-cn.js'))
        .pipe(uglify()).pipe(rename('moment.min.js')).pipe(gulp.dest('public/static'));
});

gulp.task('requirements', gulp.parallel(['jquery','bootstrap','fontawesome','animate-css', 'momentjs']));
gulp.task('less',function(){
    return gulp.src(['src/less/main.*.less', '!src/less/main.common.less'])
        .pipe(less())
        .pipe(cssmin())
        .pipe(gulp.dest('public/static'));
});
gulp.task('scripts', function(){
    return gulp.src('src/scripts/**/*.js')
        .pipe(gulp.dest('public/static'));
});
gulp.task('pages', function(){
    var htmloptions = {
        collapseWhitespace:true,
        collapseBooleanAttributes:true,
        removeComments:true,
        removeEmptyAttributes:false,
        removeScriptTypeAttributes:false,
        removeStyleLinkTypeAttributes:false,
        minifyJS:true,
        minifyCSS:true
    };
    return gulp.src('src/pages/**/*.html')
        .pipe(htmlmin(htmloptions))
        .pipe(gulp.dest('public'));
});
gulp.task('assets', function(){
    return gulp.src('assets/images/**/*')
        .pipe(gulp.dest('public/static/images'));
});

//watch
gulp.task('watch',function(){
    gulp.watch('src/less/**/*.less',gulp.series('less'));
    gulp.watch('node_modules/**/*',gulp.series('requirements'));
    gulp.watch('src/pages/**/*',gulp.series('pages'));
    gulp.watch('src/scripts/**/*',gulp.series('scripts'));
});

gulp.task('clean', function(){
    return del('public/**/*');
});


gulp.task('build', gulp.series(['requirements','less','scripts','pages','assets']));
gulp.task('clean build',gulp.series(['clean','build']));