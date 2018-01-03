var mysql = require('mysql');

var routes = {
	register: function (server, options, next) {

		server.route({
	        method: 'GET',
	        path: '/rsvp/{familyName?}',
	        handler: function (request, reply) {
	        	console.log("familyName: ", request.params.familyName);
	        	var familyName = request.params.familyName ? request.params.familyName : null;
	        	if (!familyName) {
	        		console.log("No matching family name.  TODO: create error reply");
	        		return reply("Uh-oh, we've encountered a database issue.  Blame Nat, not Emma.... and please call Laurie to rsvp  :)");
	        	}
	        	var sql =  "SELECT *\
	        				FROM family AS f\
	        				LEFT JOIN family_members AS fm\
	        					ON fm.family_id = f.id\
	        				WHERE f.family_name = ?;";
	        	queryDb(sql, [familyName], function(err, results) {
	        		if (err) {
	        			return console.log("db qeury error....");
	        		} else {
	        			console.log("Results are: ", results);
	        			if (results && results.length) {
	        				if (results.length && results[0].first_name) {
	        					// already rsvp'd
	        					console.log("already rsvp'd");
	        					return reply("It looks like you already rsvp'd.  Please call Laurie if you need to make any changes to your rsvp.");
	        				} else {
	        					// should be first time rsvp
	        					console.log("results.length: ", results.length);
	        					return reply.view("batMitzvahRSVP.ejs", {});
	        				}
	        			} else {
	        				console.log("No matching family name.  TODO: create error reply");
	        				return reply("Uh-oh, we've encountered a database issue.  Blame Nat, not Emma.... and please call Laurie to rsvp  :)");
	        			}
	        		}
	        	});
	        }
	    });

	    next();
	}
};

function queryDb(query, params, cb) {
	var connection = mysql.createConnection({
		host: process.env.DATABASE_HOST,
		user: 'beckes_dev',
		password: process.env.DATABASE_PW,
		database: 'rsvp_app'
	});
	connection.connect(function(err) {
		if (err) {
			return console.log("Error connecting to db: ", err);
		} else {
			console.log("DB connection established...");
			var sql = params && Array.isArray(params) && params.length ? mysql.format(query, params) : query;
			connection.query(sql, function(err, results) {
				connection.end(function(err) {
					if (err) {
						return console.log("Error ending db connection: ", err);
					} else {
						return console.log("Db connection ended successfully");
					}
				});
				if (err) {
					console.log("Error executing db query at queryDb func with sql: " + sql + " : ", err);
					return cb ? cb(err) : null;
				} else {
					return cb ? cb(null, results) : null;
				}
			});
		}
	});
}

routes.register.attributes = {
	name: 'rsvp_app_basic_routes',
	version : '0.0.1'
};

module.exports = routes;