const gulp = require("gulp");
const less = require("gulp-less");
const cssmin = require("gulp-clean-css");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const htmlmin = require("gulp-htmlmin");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
const shell = require("gulp-shell");
const qn = require("gulp-qiniu-up");
const fs = require("fs");
const del = require("del");
const asar = require('asar');
const crypto = require('crypto');
const fileValidation = require('./utils/fileValidation');

// config file
const package = require('./package.json');
const qiniuConfig = require("./qiniu.config");
const signConfig = require('./sign.config');

// jquery
gulp.task("jquery", async function() {
    await gulp.src("node_modules/jquery/dist/jquery.min.js").pipe(gulp.dest("public/static"));
});

// bootstrap
gulp.task("bootstrap", async function() {
    gulp.src("node_modules/bootstrap/dist/js/bootstrap.min.js").pipe(gulp.dest("public/static"));
    gulp.src("node_modules/bootstrap/dist/css/bootstrap.min.css").pipe(gulp.dest("public/static"));
    //checkbox
    await gulp
        .src("node_modules/awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css")
        .pipe(cssmin())
        .pipe(rename("awesome-bootstrap-checkbox.min.css"))
        .pipe(gulp.dest("public/static"));
});

// fontawesome
gulp.task("fontawesome", async function() {
    gulp.src("node_modules/font-awesome/fonts/**/*").pipe(gulp.dest("public/static/fonts"));
    await gulp.src("node_modules/font-awesome/css/font-awesome.min.css").pipe(gulp.dest("public/static"));
});

// animate.css
gulp.task("animate-css", async function() {
    await gulp.src("node_modules/animate.css/animate.min.css").pipe(gulp.dest("public/static"));
});

// moment.js
gulp.task("momentjs", async function() {
    await gulp
        .src("node_modules/moment/moment.js")
        .pipe(concat("node_modules/moment/locale/zh-cn.js"))
        .pipe(uglify())
        .pipe(rename("moment.min.js"))
        .pipe(gulp.dest("public/static"));
});

// html5sortable
gulp.task("html5sortable", async function() {
    await gulp.src("node_modules/html5sortable/dist/html5sortable.min.js").pipe(gulp.dest("public/static"));
});

// 3rdparty
gulp.task("3rdparty", function() {
    return gulp.src("src/scripts/3rdparty/**/*.js").pipe(gulp.dest("public/static"));
});

gulp.task("requirements", gulp.parallel(["jquery", "bootstrap", "fontawesome", "animate-css", "momentjs", "html5sortable", "3rdparty"]));

gulp.task("less", function() {
    return gulp
        .src(["src/less/main.*.less", "!src/less/main.common.less"])
        .pipe(less())
        .pipe(cssmin())
        .pipe(gulp.dest("public/static"));
});
gulp.task("scripts", function() {
    gulp.src("src/scripts/*.js").pipe(gulp.dest("public/static"));
    gulp.src("src/scripts/config/*.js").pipe(gulp.dest("public/static/config"));
    return gulp.src("src/scripts/tools/**/*.js").pipe(gulp.dest("public/static/tools"));
});
gulp.task("i18n", function() {
    gulp.src("src/scripts/i18n/render/*.js")
        .pipe(concat("render.js"))
        .pipe(gulp.dest("public/static/i18n"));
    return gulp.src("src/scripts/i18n/*.js").pipe(gulp.dest("public/static/i18n"));
});
gulp.task("pages", function() {
    var htmloptions = {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeComments: true,
        removeEmptyAttributes: false,
        removeScriptTypeAttributes: false,
        removeStyleLinkTypeAttributes: false,
        minifyJS: true,
        minifyCSS: true
    };
    return gulp
        .src("src/pages/**/*.html")
        .pipe(htmlmin(htmloptions))
        .pipe(gulp.dest("public"));
});
gulp.task("assets", function() {
    gulp.src("assets/icons/**/*").pipe(gulp.dest("public/static/icons"));
    return gulp.src("assets/images/**/*").pipe(gulp.dest("public/static/images"));
});

// watch
gulp.task("watch", function() {
    gulp.watch("src/less/**/*.less", gulp.series("less"));
    gulp.watch("node_modules/**/*", gulp.series("requirements"));
    gulp.watch("src/pages/**/*", gulp.series("pages"));
    gulp.watch("src/scripts/*.js", gulp.series("scripts"));
    gulp.watch("src/scripts/i18n/**/*.js", gulp.series("i18n"));
    gulp.watch("src/scripts/3rdparty/*.js", gulp.series("3rdparty"));
});

gulp.task("clean", function() {
    return del("public/**");
});
gulp.task("build", gulp.series(["requirements", "less", "scripts", "i18n", "pages", "assets"]));
gulp.task("clean build", gulp.series(["clean", "build"]));

// build
gulp.task("win32", function() {
    return gulp
        .src("main.js")
        .pipe(replace("global.indebug = true", "global.indebug = false"))
        .pipe(replace("global.isOS64 = true", "global.isOS64 = false"))
        .pipe(gulp.dest("./"));
});
gulp.task("win64", function() {
    return gulp
        .src("main.js")
        .pipe(replace("global.indebug = true", "global.indebug = false"))
        .pipe(replace("global.isOS64 = false", "global.isOS64 = true"))
        .pipe(gulp.dest("./"));
});
gulp.task("debug", function() {
    return gulp
        .src("main.js")
        .pipe(replace("global.indebug = false", "global.indebug = true"))
        .pipe(gulp.dest("./"));
});

// sign
gulp.task("sign", function() {
    return gulp.src("dist/*.exe")
        .pipe(shell([`signtool sign /v /f ${signConfig.cert} /p ${signConfig.password} /tr http://timestamp.digicert.com "<%= file.path %>"`]));
});

// pack
gulp.task("move old", function() {
    return gulp.src("dist/*.exe").pipe(gulp.dest("old_version"));
});
gulp.task("move old x86", function() {
    return gulp.src("dist/*.exe").pipe(gulp.dest("old_version/x86"));
});
gulp.task("clean dist", function() {
    return del(["dist/**", "!dist", "!dist/ver.json"]);
});
gulp.task("build win32", shell.task("npm run build32"));
gulp.task("build win64", shell.task("npm run build"));
gulp.task("pack win32", gulp.series(["clean", "build", "clean dist", "win32", "build win32", "sign"]));
gulp.task("pack win64", gulp.series(["clean", "build", "clean dist", "win64", "build win64", "sign"]));

// pack hotfix
gulp.task("pack hotfix", async function() {
    // 读取热更新的配置缓存
    let log;
    if (fs.existsSync('./hotfix.log.json')) {
        log = require('./hotfix.log.json');
    }
    if (log) {
        if (log.version !== package.version) {
            log = null;
        }
    }
    if (fs.existsSync('./hotfix')) {
        gulp.src(['hotfix/*.json', 'hotfix/*.asar'])
            .pipe(gulp.dest(`hotfix/history/${package.version}/${log ? log.hash : new Date().getTime().toString()}/`))
            .pipe(del(['hotfix/*.json', 'hotfix/*.asar']));
    }
    let md5 = crypto.createHash('md5');
    md5.update(new Date().getTime().toString());
    let resource = `hotfix.${md5.digest('hex')}.asar`;
    let resourcePath = `./hotfix/${resource}`;
    await asar.createPackage('./public/', resourcePath);
    // 生成manifest文件
    const manifest = {
        version: package.version,
        resource: resource,
        build: log ? log.build + 1 : 1,
        check: await fileValidation.sha256(resourcePath),
        revoke: false
    };
    fs.writeFileSync('./hotfix.log.json', JSON.stringify(manifest));
    return fs.writeFileSync('./hotfix/manifest.json', JSON.stringify(manifest));
});

gulp.task('revoke manifest', () => {
    let log;
    if (fs.existsSync('./hotfix.log.json')) {
        log = require('./hotfix.log.json');
    }
    if (log) {
        if (log.version !== package.version) {
            log = null;
        }
    }
    if (fs.existsSync('./hotfix')) {
        gulp.src(['hotfix/*.json', 'hotfix/*.asar'])
            .pipe(gulp.dest(`hotfix/history/${package.version}/${log ? log.hash : new Date().getTime().toString()}/`))
            .pipe(del(['hotfix/*.json', 'hotfix/*.asar']));
    }
    const manifest = {
        version: package.version,
        resource: null,
        build: log ? log.build + 1 : 1,
        check: null,
        revoke: true
    };
    return fs.writeFileSync('./hotfix/manifest.json', JSON.stringify(manifest));
});

// publish
gulp.task("upload win32", function() {
    return gulp.src(["dist/Fastnote Setup " + package.version + ".exe", "dist/*.yml", "dist/ver.json"]).pipe(
        qn({
            qiniu: qiniuConfig,
            prefix: "fastnote/win32/",
            forceUpload: true
        })
    );
});

gulp.task("upload win64", function() {
    var version = fs.readFileSync("dist/ver.json");
    version = JSON.parse(version);
    return gulp.src(["dist/Fastnote Setup " + package.version + ".exe", "dist/*.yml", "dist/ver.json"]).pipe(
        qn({
            qiniu: qiniuConfig,
            prefix: "fastnote/win32/x64/",
            forceUpload: true
        })
    );
});

gulp.task("upload ver win32", function() {
    return gulp.src("dist/ver.json").pipe(
        qn({
            qiniu: qiniuConfig.update,
            prefix: "fastnote/win32/",
            forceUpload: true
        })
    );
});

gulp.task("upload ver win64", function() {
    return gulp.src("dist/ver.json").pipe(
        qn({
            qiniu: qiniuConfig.update,
            prefix: "fastnote/win32/x64/",
            forceUpload: true
        })
    );
});

gulp.task("upload hotfix", function() {
    return gulp.src(['hotfix/manifest.json', 'hotfix/*.asar'])
        .pipe(
            qn({
                qiniu: qiniuConfig.hotfix,
                prefix: `fastnote/${package.version}/`,
                forceUpload: true
            })
        );
});

gulp.task("upload manifest", function() {
    return gulp.src('hotfix/manifest.json')
        .pipe(
            qn({
                qiniu: qiniuConfig.hotfix,
                prefix: `fastnote/${package.version}/`,
                forceUpload: true
            })
        );
});

gulp.task("upload-ver", gulp.series(["upload ver win32", "upload ver win64"]));

gulp.task("publish", gulp.series(["move old", "pack win32", "upload win32"]));
gulp.task("publish64", gulp.series(["move old x86", "pack win64", "upload win64"]));
gulp.task("publish", gulp.series(["publish", "publish64", "debug"]));

gulp.task('clean hotfix', function() {
    return del(['hotfix/*.json', 'hotfix/*.asar', 'hotfix.log.json']);
});
gulp.task("publish-hotfix", gulp.series(["clean build", "pack hotfix", "upload hotfix"]));
gulp.task("revoke-hotfix", gulp.series(["clean build", "revoke manifest", "upload manifest"]));