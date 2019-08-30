const { src, dest, watch, series, parallel, task } = require('gulp')

// js
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const babelify = require('babelify')
const sourcemaps = require('gulp-sourcemaps')

// css
const concatCss = require('gulp-concat-css')
const sass = require('gulp-sass')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

// others
const serve = require('gulp-serve')
const del = require('del')
const inject = require('gulp-inject')
const hash = require('gulp-hash-filename')

// clean build dest
function cleanDest(done) {
    del.sync('build');
    return done();
}

// build development mode of javascripts
function buildJavascriptDev() {
    var bundler = browserify('src/js/index.js', { debug: true }).transform(babelify);

    function rebundle() {
        return bundler
            .bundle()
            .on('error', function (err) { console.error(err); this.emit('end'); })
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(sourcemaps.write('.'))
            .pipe(hash({ "format": "{name}.{hash:8}{ext}" }))
            .pipe(dest('build/js'))
    };

    return rebundle()
}

// build development mode of css
function buildStylesDev() {
    var processors = [
        autoprefixer(),
        cssnano()
    ];
    return src('src/scss/main.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(concatCss('style.css'))
        .pipe(hash({ "format": "{name}.{hash:8}{ext}" }))
        .pipe(sourcemaps.write())
        .pipe(dest('build/css'))

}

// copy html files
function copyHTML() {
    return src('src/pages/*.html')
        .pipe(dest('build'))
}

// inject css and javascript
function injection() {
    return src('build/*.html')
        .pipe(inject(src('build/css/*.css', { read: false }), { relative: true }))
        .pipe(inject(src('build/js/*.js', { read: false }), { relative: true }))
        .pipe(dest('build'))
}

// watch for any, any change!
function watchFiles() {
    watch('src/js/*.js', buildJavascriptDev, injection);
    watch('src/scss/*.scss', buildStylesDev, injection);
    watch('src/pages/*.html', series(copyHTML, injection));
}

// serve
task('serve', serve('build'));

// main tasks
function start() {
    return series(cleanDest, copyHTML, parallel(buildJavascriptDev, buildStylesDev), injection, 'serve', watchFiles);
}
exports.start = start();
exports.default = start();