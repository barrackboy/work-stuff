module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['http-server:dev', 'wipe', 'jshint', 'angularFileLoader', 'imagemin', 'less', 'copy', 'uglify', 'cssmin', 'copy:copyfonts', 'watch', ]);
    grunt.registerTask('build', ['compress:main']);
    grunt.registerTask('hint', ['jshint']);
    grunt.registerTask('wipe', ['clean:build']);

    grunt.initConfig({
        'http-server': {
            'dev': {
                port: 8080,
                host: "0.0.0.0",
                ext: "html",
                runInBackground: true, // run in parallel with other tasks
                root: "dist"
            }
        },

        clean: {
          build: {
            src: ['dist/*']
          }
        },

        jshint: {
            files: ['src/js/**'],
            options: {
              asi: true,
              esversion: 6,
              validthis: true,
              loopfunc: true,
              shadow: true
            }
        },

        compress: {
          main: {
            options: {
              archive: 'production.zip',
            },
            files : [
                 { expand: true,
                   src : "**/*",
                   cwd : "dist/" }]
          }
        },

        angularFileLoader: {
           options: {
             scripts: ['src/js/**/*.js']
           },
           your_target: {
             src: ['src/index.html']
           },
         },

        less: {
            build: {
                options: {
                    paths: ["src/css"],
                    compress: true,
                },
                files: [{
                    "dist/css/core.css": "src/css/core.less"
                }, {
                    "dist/css/login.css": "src/css/login.less"
                }]
            }
        },

        imagemin: {
            options: {
                cache: false
            },

            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['img/**/*.{png,jpg,gif,svg,jpeg}'],
                    dest: 'dist'
                }]
            }
        },

        watch: {
            files: ['src/css/**/*.less', 'src/index.html', 'src/views/**/*.html', 'src/js/**/*.js'], // which files to watch
            tasks: ['angularFileLoader', 'jshint', 'less', 'copy:main'],
            options: {
                nospawn: true,
                livereload: true
            }
        },

        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['js/**'],
                    dest: 'dist'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: ['views/**'],
                    dest: 'dist'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: ['index.html'],
                    dest: 'dist/'
                }],
            },
            copyfonts: {
                files: [{
                    src: ['bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff2'],
                    dest: 'dist/fonts/glyphicons-halflings-regular.woff2'
                }, {
                    src: ['bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff'],
                    dest: 'dist/fonts/glyphicons-halflings-regular.woff'
                }, {
                    src: ['bower_components/bootstrap/fonts/glyphicons-halflings-regular.ttf'],
                    dest: 'dist/fonts/glyphicons-halflings-regular.ttf'
                },
                {
                    src: ['bower_components/font-awesome/fonts/fontawesome-webfont.eot'],
                    dest: 'dist/fonts/fontawesome-webfont.eot'
                },
                {
                    src: ['bower_components/font-awesome/fonts/fontawesome-webfont.svg'],
                    dest: 'dist/fonts/fontawesome-webfont.svg'
                },
                {
                    src: ['bower_components/font-awesome/fonts/fontawesome-webfont.ttf'],
                    dest: 'dist/fonts/fontawesome-webfont.ttf'
                },
                {
                    src: ['bower_components/font-awesome/fonts/fontawesome-webfont.woff'],
                    dest: 'dist/fonts/fontawesome-webfont.woff'
                },
                {
                    src: ['bower_components/font-awesome/fonts/fontawesome-webfont.woff2'],
                    dest: 'dist/fonts/fontawesome-webfont.woff2'
                },
                {
                    src: ['bower_components/font-awesome/fonts/Fontawesome.otf'],
                    dest: 'dist/fonts/Fontawesome.otf'
                }
              ],
            }
        },

        //Get Vendor JS and bundle
        uglify: {
            options: {
                compress: true,
            },
            applib: {
                src: [
                    'bower_components/lodash/dist/lodash.min.js',
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/moment/moment.js',
                    'bower_components/angular/angular.js',
                    'bower_components/ng-file-upload/angular-file-upload.min.js',
                    'bower_components/d3/d3.min.js',
                    'bower_components/Chart.js/Chart.js',
                    'bower_components/angular-chart.js/dist/angular-chart.min.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/cometd-namespace.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/cometd-json.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/Cometd.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/Utils.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/TransportRegistry.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/Transport.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/RequestTransport.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/LongPollingTransport.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/CallbackPollingTransport.js',
                    'bower_components/cometd-jquery/cometd-javascript/common/src/main/js/org/cometd/WebSocketTransport.js',
                    'bower_components/cometd-jquery/cometd-javascript/jquery/src/main/webapp/jquery/jquery.cometd.js',
                    'bower_components/cumulocity-clients-javascript/build/main.js',
                    'bower_components/angular-route/angular-route.min.js',
                    'bower_components/angular-ui-bootstrap-bower/ui-bootstrap.min.js',
                    'bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.min.js',
                    'bower_components/angular-ui-router/release/angular-ui-router.min.js',
                    'bower_components/bootstrap/dist/js/bootstrap.min.js',
                    'bower_components/leaflet/dist/leaflet.js',
                    'bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.min.js',
                    'bower_components/bootstrap-sweetalert/dist/sweetalert.min.js',
                    'bower_components/javascript-detect-element-resize/jquery.resize.js',
                    'bower_components/angular-gridster/dist/angular-gridster.min.js',
                    'bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min.js',
                ],
                dest: 'dist/vendor/vendorbundle.js'
            }
        },
        //This is for vendor CSS
        cssmin: {
          options: {
            shorthandCompacting: false,
            roundingPrecision: -1
          },
          target: {
            files: {
              'dist/vendor/vendorbundle.min.css':
              [
               'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
               'bower_components/bootstrap/dist/css/bootstrap.min.css',
               'bower_components/angular-chart.js/dist/angular-chart.min.css',
               'bower_components/cumulocity-clients-javascript/build/main.css',
               'bower_components/font-awesome/css/font-awesome.min.css',
               'bower_components/leaflet/dist/leaflet.css',
               'bower_components/bootstrap-sweetalert/dist/sweetalert.css',
               'bower_components/angular-gridster/dist/angular-gridster.min.css'
              ]
            }
          }
        }

    }); //END OF initConfig

}; //END OF MODULE
