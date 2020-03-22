const gulp = require('gulp');
const less = require('gulp-less');
const cssmin = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const shell = require('gulp-shell');
const qn = require('gulp-qiniu-up');
const fs = require('fs');
const del = require('del');
const qiniuConfig = require('./qiniu.config');

//jquery
gulp.task('jquery',async function(){
    await gulp.src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('public/static'));
});

//bootstrap
gulp.task('bootstrap',async function(){
    gulp.src('node_modules/bootstrap/dist/js/bootstrap.min.js')
        .pipe(gulp.dest('public/static'));
    gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
        .pipe(gulp.dest('public/static'));
    //checkbox
    await gulp.src('node_modules/awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css')
        .pipe(cssmin())
        .pipe(rename('awesome-bootstrap-checkbox.min.css'))
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

//html5sortable
gulp.task('html5sortable', async function(){
    await gulp.src('node_modules/html5sortable/dist/html5sortable.min.js')
        .pipe(gulp.dest('public/static'));
});

//3rdparty
gulp.task('3rdparty', function(){
    return gulp.src('src/scripts/3rdparty/**/*.js')
        .pipe(gulp.dest('public/static'));
});

gulp.task('requirements', gulp.parallel(['jquery','bootstrap','fontawesome','animate-css', 'momentjs','html5sortable','3rdparty']));


gulp.task('less',function(){
    return gulp.src(['src/less/main.*.less', '!src/less/main.common.less'])
        .pipe(less())
        .pipe(cssmin())
        .pipe(gulp.dest('public/static'));
});
gulp.task('scripts', function(){
    return gulp.src('src/scripts/*.js')
        .pipe(gulp.dest('public/static'));
});
gulp.task('i18n', function(){
    gulp.src('src/scripts/i18n/render/*.js').pipe(concat('render.js'))
        .pipe(gulp.dest('public/static/i18n'));
    return gulp.src('src/scripts/i18n/*.js')
        .pipe(gulp.dest('public/static/i18n'));
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
    gulp.src('assets/icons/**/*')
        .pipe(gulp.dest('public/static/icons'));
    return gulp.src('assets/images/**/*')
        .pipe(gulp.dest('public/static/images'));
});

//watch
gulp.task('watch',function(){
    gulp.watch('src/less/**/*.less',gulp.series('less'));
    gulp.watch('node_modules/**/*',gulp.series('requirements'));
    gulp.watch('src/pages/**/*',gulp.series('pages'));
    gulp.watch('src/scripts/*.js',gulp.series('scripts'));
    gulp.watch('src/scripts/i18n/**/*.js',gulp.series('i18n'));
    gulp.watch('src/scripts/3rdparty/*.js',gulp.series('3rdparty'));
});

gulp.task('clean', function(){
    return del('public/**');
});
gulp.task('build', gulp.series(['requirements','less','scripts','i18n','pages','assets']));
gulp.task('clean build',gulp.series(['clean','build']));

//build
gulp.task('win32', function(){
    return gulp.src('main.js')
    .pipe(replace('global.indebug = true','global.indebug = false'))
    .pipe(replace('global.isOS64 = true', 'global.isOS64 = false'))
    .pipe(gulp.dest('./'));
});
gulp.task('win64',function(){
    return gulp.src('main.js')
        .pipe(replace('global.indebug = true','global.indebug = false'))
        .pipe(replace('global.isOS64 = false', 'global.isOS64 = true'))
        .pipe(gulp.dest('./'));
});
gulp.task('debug',function(){
    return gulp.src('main.js')
        .pipe(replace('global.indebug = false','global.indebug = true'))
        .pipe(gulp.dest('./'));
});

//pack
gulp.task('move old', function(){
    return gulp.src('dist/*.exe').pipe(gulp.dest('old_version'));
});
gulp.task('move old x86', function(){
    return gulp.src('dist/*.exe').pipe(gulp.dest('old_version/x86'));
});
gulp.task('clean dist',function(){
    return del(['dist/**','!dist','!dist/ver.json']);
});
gulp.task('build win32', shell.task('npm run build32'));
gulp.task('build win64', shell.task('npm run build'));
gulp.task('pack win32',gulp.series(['clean','build','clean dist','win32','build win32']));
gulp.task('pack win64',gulp.series(['clean','build','clean dist','win64','build win64']));

//publish
gulp.task('upload win32', function(){
    var version = fs.readFileSync('dist/ver.json');
    version = JSON.parse(version);
    return gulp.src(['dist/Fastnote Setup '+version.ver+'.exe','dist/*.yml','dist/ver.json'])
        .pipe(qn({
            qiniu: qiniuConfig,
            prefix: 'fastnote/win32/',
            forceUpload: true
        }));
});
gulp.task('upload win64', function(){
    var version = fs.readFileSync('dist/ver.json');
    version = JSON.parse(version);
    return gulp.src(['dist/Fastnote Setup '+version.ver+'.exe','dist/*.yml','dist/ver.json'])
        .pipe(qn({
            qiniu: qiniuConfig,
            prefix: 'fastnote/win32/x64/',
            forceUpload: true
        }));
});
gulp.task('upload ver win32', function(){
    return gulp.src('dist/ver.json')
        .pipe(qn({
            qiniu: qiniuConfig,
            prefix: 'fastnote/win32/',
            forceUpload: true
        }));
});

gulp.task('upload ver win64', function(){
    return gulp.src('dist/ver.json')
        .pipe(qn({
            qiniu: qiniuConfig,
            prefix: 'fastnote/win32/x64/',
            forceUpload: true
        }));
});

gulp.task('upload-ver',gulp.series(['upload ver win32','upload ver win64']));

gulp.task('publish',gulp.series(['move old','pack win32','upload win32']));
gulp.task('publish64',gulp.series(['move old x86','pack win64','upload win64']));
gulp.task('publish',gulp.series(['publish','publish64','debug']));