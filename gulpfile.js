var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('build', function() {

});

function build() {
    return gulp.src(['./src/*.js'])
    .pipe(concat("supaplex.js"))
    .pipe(gulp.dest('./dist/'));
}

function watchFiles() {
    gulp.watch(['./src/*.js', './src/**/*.js'], build);
}

gulp.task('watch', watchFiles);