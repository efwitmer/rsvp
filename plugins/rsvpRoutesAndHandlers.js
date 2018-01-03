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
	        	var sql =  "SELECT *                       \
	        				FROM family AS f               \
	        				LEFT JOIN family_members AS fm \
	        					ON fm.family_id = f.id     \
	        				WHERE f.family_name = ?;";
	        	queryDb(sql, [familyName], function(err, results) {
	        		if (err) {
	        			return console.log("db qeury error....");
	        		} else {
	        			console.log("Results are: ", results);
	        			if (results && results.length) {
	        				if (results.length && results[0].firstName) {
	        					// already rsvp'd
	        					console.log("already rsvp'd");
	        					return reply.view("batMitzvahRSVP.ejs", {
	        																alreadyRSVPed : results,
	        																familyName 	  : results[0].family_name
	        															}
	        					);
	        				} else {
	        					// should be first time rsvp
	        					console.log("..results.length: ", results.length);
	        					return reply.view("batMitzvahRSVP.ejs", {
	        																alreadyRSVPed : [],
	        																familyName 	  : results[0].family_name
	        															}
	        					);
	        				}
	        			} else {
	        				console.log("No matching family name.  TODO: create error reply");
	        				return reply("Uh-oh, we've encountered a database issue.  Blame Nat, not Emma.... and please call Laurie to rsvp  :)");
	        			}
	        		}
	        	});
	        }
	    });
		
		server.route({
	        method: 'POST',
	        path: '/submit_rsvp_data',
	        handler: function (request, reply) {
	        	console.log("request.payload: ", request.payload);
	        	var rsvpArray;
	        	var familyName = request.payload.familyName;
	        	try {
	        		rsvpArray = JSON.parse(request.payload.data);
	        	}
	        	catch(e) {
	        		console.log("parse error: ", e);
	        		return reply("Oops, looks like something went wrong (Nat's fault).  Please refresh the page or call Laurie to rsvp.  Sorry!")
	        	}
	        	var sql1 = "SELECT id \
	        				FROM family \
	        				WHERE family_name = ?;";

	        	var sql2 = "INSERT INTO family_members \
	        				SET ?;";
	        	queryDb(sql1, [familyName], function(err, results) {
	        		if (err) {
	        			console.log("Error getting family.id while saving rsvps to db: ", err);
	        			return reply("Error completing your rsvp (Nat's fault!).  Please refresh the screen and try again or call Laurie :)");
	        		} else {
	        			console.log("results of saving rsvp to db: ", results);
	        			if (results && Array.isArray(results) && results.length) {
	        				var family_id = results[0].id;
	        				var successCounter = 0;
	        				var errorCounter = 0;
	        				var i;
	        				for (i = 0; i < rsvpArray.length; i++) {
	        					rsvpArray[i].family_id = family_id;
	        					queryDb(sql2, [rsvpArray[i]], function(err, results) {
		        					if (err) {
		        						errorCounter++
		        						console.log("Error saving rsvps: ", rsvp);
		        					} else {
		        						successCounter++
		        					}
		        					if (successCounter + errorCounter === rsvpArray.length) {
		        						console.log("\n\n\n Results for " + familyName + " family: ");
		        						console.log("successCounter: ", successCounter);
		        						console.log("errorCounter: ", errorCounter);
		        						if (errorCounter > 0) {
		        							return reply("Error");
		        						} else {
		        							return reply("Success");
		        						}
		        					}
		        				});
	        				}
	        			} else {
	        				console.log("Something went wrong when getting family_id from family while saving rsvp");
	        				return reply("Error completing your rsvp (Nat's fault!).  Please refresh the screen and try again or call Laurie :)")
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