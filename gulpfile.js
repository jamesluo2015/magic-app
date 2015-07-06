var gulp         = require('gulp-param')(require('gulp'), process.argv),
    del          = require("del"),
    Q            = require("q"),
    fs           = require("fs"),
    gulpif       = require("gulp-if"),
    sass         = require("gulp-sass"),
    replace      = require("gulp-replace"),
    hashint      = require("hash-int"),
    autoprefixer = require("gulp-autoprefixer"),
    minifycss    = require("gulp-minify-css"),
    mininline    = require("gulp-minify-inline"),
    uglify       = require("gulp-uglify"),
    rename       = require("gulp-rename"),
    webpack      = require("gulp-webpack"),
    browserSync  = require("browser-sync"),
    reload       = browserSync.reload,
    concat       = require("gulp-concat");


var DIR_APP       = __dirname + "/app/",
    DIR_MIXIN     = __dirname + "/dev/mixin/",
    DIR_MINJS     = __dirname + "/dev/minjs/",
    DIR_MAGIC     = __dirname + "/dev/magic/",
    DIR_MAGIC_VUE = __dirname + "/dev/magic-vue/";

var release = false;    // 是否为发布输出，发布输出会压缩优化

/* mixin 想关任务方法 */
function task_dev_mixin() {
    var defer = Q.defer();

    gulp.src([DIR_MIXIN+"core/*.scss",
        DIR_MIXIN+"eui/varible/_z-index.scss",
        DIR_MIXIN+"eui/varible/_color.scss",
        DIR_MIXIN+"eui/varible/_base.scss",
        DIR_MIXIN+"eui/varible/button.scss",
        DIR_MIXIN+"eui/varible/*.scss",
        DIR_MIXIN+"eui/component/*.scss"])
    .pipe(concat("mixin.scss"))
    .pipe(gulp.dest(DIR_MAGIC+"lib/"))
    .pipe(gulp.dest(DIR_APP+"pub/lib/"))
    .on("finish", function() { defer.resolve(); })

    return defer.promise
}
gulp.task("dev-mixin", task_dev_mixin);


/* minjs 相关任务方法 */
function task_dev_minjs() {
    var defer = Q.defer()

    gulp.src(DIR_MINJS+"*.js")
    .pipe(gulp.dest(DIR_MAGIC+"lib/minjs/"))
    .on("finish", function() { defer.resolve() })

    return defer.promise
}
gulp.task("dev-minjs", task_dev_minjs)


/* magic 相关任务方法 */
function task_dev_magic_css() {
    var defer = Q.defer()

    gulp.src(DIR_MAGIC+"core/main.scss")
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(rename("magic.css"))
    .pipe(gulp.dest(DIR_APP+"pub/lib/"))
    .on("finish", function() { defer.resolve(); })

    return defer.promise
}
gulp.task("dev-magic-css", task_dev_magic_css);

function task_dev_magic_js() {
    var LIB_MINJS = DIR_MAGIC + "lib/minjs/",
        DIR_CORE  = DIR_MAGIC + "core/";

    var defer = Q.defer()

    webpack({
            entry: DIR_CORE + "main.js",
            output: {
                filename: "magic.js"
            },
            resolve: {
                alias: {
                    util:  LIB_MINJS + "util.js",
                    query: LIB_MINJS + "selector.js",
                    director: LIB_MINJS + "director.js",
                    domready: LIB_MINJS + "ondomready.js",
                    extend:   LIB_MINJS + "extend.js",
                    promise:  LIB_MINJS + "promise.js",
                    jsonp  :  LIB_MINJS + "jsonp.js",
                }
            },
            module: {
                loaders: [
                    { test: /\.html$/, loader: "html" },
                    { test: /\.scss$/, loader: "style!css!sass!autoprefixer" }
                ]
            }
        })
    .pipe(gulp.dest(DIR_MAGIC_VUE+"lib/"))
    .on("finish", function() { defer.resolve(); })

    return defer.promise;
}
gulp.task("dev-magic-js", task_dev_magic_js);


/* magic-vue 相关任务*/
function task_dev_magic_vue() {
    var DIR_SRC = DIR_MAGIC_VUE;

    var defer = Q.defer()

    webpack({
            entry: DIR_SRC+"main.js",
            output: {
                filename: "magic.vue.js"
            },
            module: {
                loaders: [
                    { test: /\.html$/, loader: "html" },
                    { test: /\.scss$/, loader: "style!css!sass!autoprefixer" }
                ]
            }
        })
    .pipe(gulp.dest(DIR_APP+"pub/lib/"))
    .on("finish", function() { defer.resolve() })

    return defer.promise 
}
gulp.task("dev-magic-vue", task_dev_magic_vue);


/* APP 相关任务 */
function task_dev_app_html() {
    var inline = {
            js: {output: { comments: true }},
            css: {output: { comments: true }}
        },
        html = { conditionals: true, spare: true };

    var defer = Q.defer(), dirpub = "pub";

    gulp.src(DIR_APP+"index.html")
    .pipe(gulpif(release, mininline(inline)))
    .pipe(gulp.dest(DIR_APP+"dist/"))
    .on("finish", function() { defer.resolve() })

    return defer.promise
}
gulp.task("dev-app-html", task_dev_app_html);

function task_dev_app_css() {
    var defer = Q.defer();

    del(DIR_APP+"dist/page/main*.css", function() {
        gulp.src(DIR_APP+"pub/main.scss")
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(gulpif(release, minifycss()))
        .pipe(gulp.dest(DIR_APP+"pub/"))
        .on("finish", function() {
            var hash = hashint((new Date).getTime())+"",
                name = "main"+hash.substr(0, 5)+".css",
                newn = release?name:"main.css";

            gulp.src([DIR_APP+"pub/lib/magic.css",
                      DIR_APP+"pub/main.css"])
            .pipe(concat(newn))
            .pipe(gulpif(release, minifycss()))
            .pipe(gulp.dest(DIR_APP+"dist/page/"))
            .on("finish", function() {
                gulp.src(DIR_APP+"dist/index.html")
                .pipe(replace(/main.*\.css/, newn))
                .pipe(gulp.dest(DIR_APP+"dist/"))

                defer.resolve();
            })
        })
    })

    return defer.promise
}
gulp.task("dev-app-css", task_dev_app_css);

function task_dev_app_pub() {
    var defer = Q.defer()

    gulp.src([DIR_APP+"pub/**/*", "!"+DIR_APP+"pub/main*",
              "!"+DIR_APP+"pub/lib/magic*",
              "!"+DIR_APP+"pub/lib/mixin.scss"])
    .pipe(gulp.dest(DIR_APP+"dist/pub/"))
    .on("finish", function() {
        defer.resolve()
    })

    return defer.promise
}
gulp.task("dev-app-pub", task_dev_app_pub);

function task_dev_app_js() {
    var UglifyJsPlugin = require("webpack/lib/optimize/UglifyJsPlugin.js");
    var pugl = new UglifyJsPlugin({ sourceMap: false, mangle: false });

    var defer = Q.defer(),
        wname = release?"[name][hash:5].js":"[name].js";

    del(DIR_APP+"dist/page/*.js", function() {
        gulp.src(DIR_APP+"pub/lib/vue.min.js")
            .pipe(gulp.dest(DIR_APP+"dist/pub/lib/"));

        webpack({
                entry: [DIR_APP  + "pub/main.js"],
                output: {
                    filename: wname,
                    publicPath: "./page/"
                },
                module: {
                    loaders: [
                        { test: /\.html$/, loader: "html" },
                        { test: /\.scss$/, loader: "style!css!sass!autoprefixer" },
                        { test: /\.(png|jpg|gif)$/, loader: 'url-loader?limit=8192&name=../pub/img/[name].[ext]?[hash]'},
                    ]
                },
                plugins: release ?  [pugl] : [],
            })
        .pipe(gulp.dest(DIR_APP + "dist/page"))
        .on("finish", function() {
            if (release /* 发布时才添加hash */) {
                var hash = hashint((new Date).getTime())+"",
                    name = "main"+hash.substr(0, 5)+".js",
                    path = DIR_APP+"dist/page/";

                fs.readdir(path, function(error, files) {
                    for(var i=0; i<files.length; i++) {
                        var str = files[i].toString();
                        if (str.match(/main.*\.js/)) {
                            fs.rename(path+str, path+name);

                            // 修改 index.html 中的引用
                            gulp.src(DIR_APP+"dist/index.html")
                            .pipe(replace(/main.*\.js/, name))
                            .pipe(gulp.dest(DIR_APP+"dist/"))

                            break;      defer.resolve();
                        }
                    }
                })
            } else {
                defer.resolve();
            }
        })
    })

    return defer.promise
}
gulp.task("dev-app-js", task_dev_app_js);

gulp.task("dev-app", function(rel) {
    release = rel ? true : false;

    return Q.all([
        task_dev_app_pub(),
        task_dev_app_html(),
        task_dev_app_css(),
        task_dev_app_js()
    ])
})


/* 监控刷新调试 */
gulp.task("serve", function() {
    browserSync({
        server: "./app/dist/"
    });

    /* mixin 动态刷新任务 */
    gulp.watch(["dev/mixin/**/*"], ["dev-mixin"])

    /* minjs 动态刷新任务 */
    gulp.watch(["dev/minjs/*"], ["dev-minjs"])

    /* magic 动态刷新任务 */
    gulp.watch(["dev/magic/**/*.scss"], ["dev-magic-css"])
    gulp.watch(["dev/magic/**/*.js"], ["dev-magic-js"])

    /* magic-vue 动态刷新任务 */
    gulp.watch(["dev/magic-vue/**/*"], ["dev-magic-vue"])

    /* APP 动态刷新任务 */
    gulp.watch(["app/index.html"], ["dev-app-html", reload])
    gulp.watch(["app/pub/lib/*.css", "app/pub/lib/*.scss",
                "app/pub/main.scss"], ["dev-app-css", reload])
    gulp.watch(["app/pub/lib/*.js", "app/page/**/*", "app/srvs/*.js",
                "app/pub/main.js"], ["dev-app-js", reload])
    gulp.watch(["app/pub/**/*", "!app/pub/main*", "!app/pub/lib/magic*",
                "!app/pub/lib/mixin.scss"], ["dev-app-pub", reload])
})

/* 全局构建任务 */
gulp.task("build.base", function() {
    return Q.all([
        task_dev_mixin(),
        task_dev_minjs()
    ])
})

gulp.task("build.magic", ["build.base"], function(rel) {
    release = rel ? true : false;

    return Q.all([
        task_dev_magic_css(),
        task_dev_magic_js()
    ])
})

gulp.task("build.vue", ["build.magic"], function(rel) {
    release = rel ? true : false;

    return Q.all([task_dev_magic_vue()])
})

gulp.task("build.app", ["build.vue"], function(rel) {
    release = rel ? true : false;

    gulp.run("dev-app");
})

gulp.task("build", function(rel) {
    release = rel ? true : false;

    gulp.run("build.app");
})

/* APP 清理任务 */
gulp.task("clean", function() {
    del(DIR_APP + "dist/");
    del(DIR_APP + "pub/main.css");
    del(DIR_APP + "pub/lib/magic*");
    del(DIR_APP + "pub/lib/mixin.scss");
})