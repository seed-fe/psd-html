const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
// 调用 .create() 意味着你得到一个唯一的实例并允许您创建多个服务器或代理。
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const gutil = require('gulp-util');
const cleanCSS = require('gulp-clean-css');
const combiner = require('stream-combiner2');
const del = require('del');
const rev = require('gulp-rev');
const lazypipe = require('lazypipe');


const handleError = function(err) {
    var colors = gutil.colors;
    console.log('\n');
    gutil.log(colors.red('Error!'));
    gutil.log('fileName: ' + colors.red(err.fileName));
    gutil.log('lineNumber: ' + colors.red(err.lineNumber));
    gutil.log('message: ' + err.message);
    gutil.log('plugin: ' + colors.yellow(err.plugin));
};
/*开发阶段，监听各种文件并自动刷新浏览器，如果用LESS还要加上LESS编译*/
// 定义一个任务，任务的名字，该任务所要执行的一些操作
gulp.task('watchdev', function() {
	// 启动Browsersync服务。这将启动一个服务器，代理服务器（proxy）或静态服务器（server）
	browserSync.init({
		// 设置监听的文件，以gulpfile.js所在的根目录为起点，单个文件就用字符串，多个文件就用数组
		files: ["src/*.html", "src/css/*.css", "src/script/*.js", "src/images/*.*"],
		// ，这里是静态服务器，监听3000端口
		server: {
			baseDir: "./src"
		},
		// 在不同浏览器上镜像点击、滚动和表单，即所有浏览器都会同步
		ghostMode: {
			clicks: true,
			scroll: true
		},
		// 更改控制台日志前缀
		logPrefix: "from psd to html",
		// 设置监听时打开的浏览器
		browser: ["firefox", "chrome"],
		// 设置服务器监听的端口号
		port: 8080
	});
	console.log('Debugging in dev.');
});
/*发布阶段，css、js的合并压缩，image的压缩等（合并，重命名，防缓存……）*/
/*由于给文件添加了哈希值，所以每次编译出来的css和js都是不一样的，这会导致有很多冗余文件，所以我们可以每次在生成文件之前，先将原来的文件全部清空。*/
gulp.task('clean', function() {
    return del([
    	'dist/css/**/*',
    	'dist/script/**/*',
    	'rev/**/*'
    ]);
});
/*如果开发阶段各种调试测试没问题了，就一次性压缩所有文件*/
/*一次压缩所有CSS文件，当只有单个CSS文件的时候就不用concat，通过rev和rev.manifest和revCollector可以添加hash并重新导入html*/
gulp.task('minifycss', function() {
    return gulp.src('src/css/**/*.css')
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.autoprefixer({
      	// 设置支持的浏览器，这里是主要浏览器的最新两个版本
      	browsers: 'last 2 versions'
      }))
      // 合并为all.js
      .pipe(plugins.concat('all.css'))
      .pipe(cleanCSS())
      // 添加hash编码
      .pipe(plugins.rev())
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest('dist/css/'))
      .pipe(plugins.rev.manifest())
      .pipe(gulp.dest('rev/css'));
});
gulp.task('cssReplace', function() {
	var cssFilter = plugins.filter('**/*.css', {restore: true});
	var indexHtmlFilter = plugins.filter(['**/*', '!**/index.html'], {restore: true});
    return gulp.src('src/index.html')
    	// useref解析html文件里build注释的部分并且合并build注释部分包括的css/js文件，然后把html和合并的文件传递到流
      .pipe(plugins.useref({}, lazypipe().pipe(plugins.sourcemaps.init, {loadMaps: true})))
      .pipe(cssFilter)
      .pipe(cleanCSS())
      .pipe(cssFilter.restore)
      .pipe(indexHtmlFilter)
      .pipe(rev())
      .pipe(indexHtmlFilter.restore)
      .pipe(plugins.revReplace())
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest('dist/'));
});
// 需要一次编译所有js文件就用这个
gulp.task('uglifyjs', function () {
    var combined = combiner.obj([
        gulp.src('src/script/**/*.js'),
        plugins.sourcemaps.init(),
        plugins.uglify(),
        plugins.rev(),
        plugins.sourcemaps.write('./'),
        gulp.dest('dist/script/'),
        plugins.rev.manifest(),
        gulp.dest('rev/script')
    ]);
    combined.on('error', handleError);
    return combined;
});
// 压缩所有图片
gulp.task('images', function () {
    return gulp.src('src/images/**/*')
        .pipe(plugins.imagemin({
            progressive: true
        }))
        .pipe(gulp.dest('dist/images'));
});
// 将处理过的CSS引入html，当CSS没有合并或者只有一个CSS文件的时候可以直接顺利引入，如果有合并操作就要用上面的cssReplace这个task
gulp.task('reCollector', ['clean', 'minifycss'], function() {
    return gulp.src(['rev/**/*.json', 'src/*.html'])
      .pipe(plugins.revCollector({
      	replaceReved: true,
      	dirReplacements: {
      		'css': 'dist/css'
      	}
      }))
      .pipe(gulp.dest('dist'));
});
gulp.task('build', ['clean', 'images', 'uglifyjs'], function() {
	var cssFilter = plugins.filter('**/*.css', {restore: true});
	var indexHtmlFilter = plugins.filter(['**/*', '!**/index.html'], {restore: true});
    return gulp.src(['rev/**/*.json', 'src/*.html'])
      .pipe(plugins.revCollector({
      	replaceReved: true,
      	dirReplacements: {
      		// rev-manifest.json文件中只有加了hash的文件名，需要通过dirReplacements指明路径信息
      		'script': 'script'
      	}
      }))
      .pipe(plugins.useref({}, lazypipe().pipe(plugins.sourcemaps.init, {loadMaps: true})))
      .pipe(cssFilter)
      .pipe(cleanCSS())
      .pipe(cssFilter.restore)
      .pipe(indexHtmlFilter)
      .pipe(rev())
      .pipe(indexHtmlFilter.restore)
      .pipe(plugins.revReplace())
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest('dist/'));
});
/*复制HTML，第二个参数是依赖任务的数组，数组里的这些任务是并行处理的*/
gulp.task('html',['minifycss', 'uglifyjs', 'images'], function() {
    return gulp.src('src/*.html')
      .pipe(gulp.dest('dist/'));
});
/*build之后的调试，只压缩修改过的文件，还是结合Browsersync自动注入文件和刷新*/
/*配置css任务*/
/*只压缩修改过的CSS文件*/
gulp.task('watchcss', function() {
    gulp.watch('src/css/**/*.css', function(event) {
    	var paths = plugins.watchPath(event, 'src/', 'dist/');
    	// 文件操作的事件类型
        gutil.log('File ' + paths.srcPath + ' was ' + gutil.colors.green(event.type));
        // 文件输出路径
        gutil.log('Dist ' + paths.distPath);
        return gulp.src(paths.srcPath)
          .pipe(plugins.sourcemaps.init())
          .pipe(plugins.autoprefixer({
          	browsers: 'last 2 versions'
          }))
          .pipe(cleanCSS())
          .pipe(plugins.sourcemaps.write('./'))
          .pipe(gulp.dest(paths.distDir))
          .pipe(reload({stream: true}));
    });
});

/*配置js任务*/
gulp.task('watchjs', function() {
    // 用到了glob匹配规则：**匹配路径中的0个或多个目录及其子目录，如果出现在末尾，也能匹配文件；*匹配文件路径中的0个或多个字符
    // **/*.js 能匹配 foo.js,a/foo.js,a/b/foo.js,a/b/c/foo.js
    gulp.watch('src/js/**/*.js', function(event) {
        // 利用gulp-watch-path，只重新编译被修改的文件
        var paths = plugins.watchPath(event, 'src/', 'dist/');
        gutil.log(gutil.colors.green(event.type) + ' ' + paths.srcPath);
        gutil.log('Dist ' + paths.distPath);
        var combined = combiner.obj([
            gulp.src(paths.srcPath),
            // 使用sourcemap帮助调试
            plugins.sourcemaps.init(),
            // 这里的gulp-uglify用低版本的（这里是1.5.4）才会有详细的错误信息
            plugins.uglify(),
            plugins.sourcemaps.write('./'),
            gulp.dest(paths.distDir),
            reload({stream: true})
        ]);
        combined.on('error', handleError);
        return combined;
    });
});

/*压缩图片*/
gulp.task('watchimage', function () {
    gulp.watch('src/images/**/*', function (event) {
        var paths = plugins.watchPath(event,'src/','dist/');
        gutil.log(gutil.colors.green(event.type) + ' ' + paths.srcPath);
        gutil.log('Dist ' + paths.distPath);
        return gulp.src(paths.srcPath)
            .pipe(plugins.imagemin({
                progressive: true
            }))
            .pipe(gulp.dest(paths.distDir))
            .pipe(reload({stream: true}));
    });
});


// 发布阶段的调试
gulp.task('watchbuild', ['watchcss', 'watchjs', 'watchimage'], function() {
	// 启动Browsersync服务。这将启动一个服务器，代理服务器（proxy）或静态服务器（server）
	browserSync.init({
		// 设置监听的文件，以gulpfile.js所在的根目录为起点，单个文件就用字符串，多个文件就用数组
		files: ["*.html", "css/*.css", "script/*.js", "images/*.*"],
		// ，这里是静态服务器，监听3000端口
		server: {
			baseDir: "./dist"
		},
		// 在不同浏览器上镜像点击、滚动和表单，即所有浏览器都会同步
		ghostMode: {
			clicks: true,
			scroll: true
		},
		// 更改控制台日志前缀
		logPrefix: "from psd to html",
		// 设置监听时打开的浏览器
		browser: ["firefox", "chrome"],
		// 设置服务器监听的端口号
		port: 8080
	});
	console.log('Debugging after built.');
});
gulp.task('deploy', function() {
    return gulp.src('./dist/**/*')
      .pipe(plugins.ghPages());
});
