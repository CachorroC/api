var koa = require( 'koa' );
var router = require( 'koa-router' );
var bodyParser = require( 'koa-body' );

var app = koa();

//Set up body parsing middleware
app.use( bodyParser( {
   formidable: { uploadDir: './uploads' },
   multipart: true,
   urlencoded: true
} ) );

//Require the Router we defined in movies.js
var movies = require( './movies.js' );

//Use the Router on the sub route /movies
app.use( movies.routes() );

app.listen( 3000 );