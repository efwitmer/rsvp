'use strict';

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const Hapi = require('hapi');
const inert = require('inert');
const server = new Hapi.Server();
const good = require('good');
const vision = require('vision');
const ejs = require('ejs');
const goodConsole = require('good-console');
const async = require('async');
const good_options = {
    ops: {
        interval: 1000
    },
    reporters: {
        myConsoleReporter: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ log: '*', response: '*' }]
            }, 
            {
                module: 'good-console'
            }, 
            'stdout'
        ],
        myFileReporter: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ ops: '*' }]
            }, 
            {
                module: 'good-squeeze',
                name: 'SafeJson'
            }, 
            {
                module: 'good-file',
                args: ['./test/fixtures/awesome_log']
            }
        ],
        myHTTPReporter: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ error: '*' }]
            },
            {
                module: 'good-http',
                args: [
                    'http://prod.logs:3000',
                    {
                        wreck: {
                            headers: { 'x-api-key': 12345 }
                        }
                    }
                ]
            }
        ]
    }
};

server.connection({ port: port, host: host });

async.series([
    function (cb) {
        // serve static files from public
        server.register(inert, (err) => {
            if (err) {
                console.log("Error registering inert: ", err);
                return cb(err)
            } else {
                console.log("loaded inert");
                cb();
            }
        });
    },
    function (cb) {
        // load ejs templating engine
        server.register(vision, (err) => {
            if (err) {
                console.log("Error loading vision: ", err);
                return cb(err);
            } else {
                console.log("loaded vision");
                server.views({
                    engines: { ejs: ejs },
                    relativeTo: __dirname,
                    path: './views'
                });
                console.log("ejs templating selected");
                cb();
            }
        });
    },
    function (cb) {
        server.register(require('./plugins/rsvpRoutesAndHandlers'), function (err) {
            if (err) {
                console.log("Error loading login plugin");
                return cb(err);
            } else {
                console.log("loaded login plugin");
                cb();
            }
        });
    },
    function (cb) {
        server.register({
            register: require('good'),
            good_options,
        }, (err) => {
            if (err) {
                return cb(err);
            } else {
                console.log("loaded good module");
                cb();
            }
        });
    },
    function (cb) {
        server.route({
            method: 'GET',
            path: '/public/{filename}',
            handler: function (request, reply) {
                reply.file(`./public/${request.params.filename}`);
            }
        });
        server.route({
            method: 'GET',
            path: '/js/{filename}',
            handler: function (request, reply) {
                reply.file(`./public/${request.params.filename}.js`);
            }
        });
        server.route({
            method: 'GET',
            path: '/css/{filename}',
            handler: function (request, reply) {
                reply.file(`./public/${request.params.filename}.css`);
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {
                reply('Hello, world!');
            }
        });
        cb();
    }
], function (err) {
    server.start((err) => {
        if (err) {
            console.log("Error registering plugins: ", err);
            throw err;
        } else {
            console.log(`Server running at: ${server.info.uri}`);
        }
    });
});

    

        

        

        


        
