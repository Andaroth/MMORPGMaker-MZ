const r       = require("rethinkdb")
  ,   async   = require("async")
  ,   fs      = require('fs');
var exports = module.exports = {};

/*****************************
      PUBLIC FUNCTIONS
*****************************/

exports.SERVER_CONFIG = {}; 

exports.initialize = function(callback) {
  // In case we need more tables in the future
  var tables = [
    "users",
    "config"
  ];

  // We check if the database exist
  onConnect(function(err, conn) {
    // IMPORTANT : DO NOT TOUCH THIS
    var initialServerConfig = {
      "port": 8097,
      "passwordRequired": true,
      "newPlayerDetails": {
        "permission": 0,
        "mapId": 1,
        "skin": {
          "characterIndex": 0,
          "characterName": "Actor1",
          "battlerName": "Actor1_1",
          "faceName": "Actor1",
          "faceIndex": 0
        },
        "x": 5,
        "y": 5
      },
      "globalSwitches": {
      },
      "partySwitches": {
      },
      "globalVariables": {
      },
      "offlineMaps": {
      }
    }
    
    r.dbList().run(conn, function(err, results){
      // If the database exist, we have nothing to do
      if(results.indexOf("mmorpg") !== -1) {
        conn.close(); // We close the connection
        MMO_Core["security"].loadTokens();
        console.log("[I] Database initialized with success"); // And we abort any additional procedures
        return callback();
      }

      console.log("[O] I have not found the database! 😱  Let me fix that for you...")
      // Else, we create the database and its tables
      r.dbCreate("mmorpg").run(conn, function(err, result){
        console.log("[I] Database was created with success");

        // We create the tables asynchronously
        async.each(tables, function(item, callback){
          r.db("mmorpg").tableCreate(item).run(conn, function(err, result){
            console.log("[I] Table " + item + " was created with success");

            if(item === "users") {
              let user = initialServerConfig["newPlayerDetails"];
              user.username   = "admin";
              user.password   = MMO_Core["security"].hashPassword("admin");
              user.permission = 100;

              r.db("mmorpg").table("users").insert([user]).run(conn, (err, result) => {
                 console.log("[I] Initial admin account created.");
                 return callback();
              })
            } else if(item === "config") {
              r.db("mmorpg").table("config").insert([initialServerConfig]).run(conn, (err, result) => {
                 console.log("[I] Initial server configuration was created with success.");
                 return callback();
              })
            } else { return callback(); }
          });
        }, function(err) {
          conn.close(); // We close the connection at the end
          console.log("[I] All good! Everything is ready for you 😘");
          console.log("[I] Database initialized with success");
          return callback(); // Yay
        });

      })
    })
  })
};

exports.findUser = function(userDetails, callback) {
  onConnect(function(err, conn) {
     r.db("mmorpg").table('users')
    .filter({ username: userDetails["username"] })
    .run(conn)
    .then(function(cursor) { return cursor.toArray(); })
    .then(function(output) {
      return callback(output);
    })
    .finally(function() { conn.close(); });
  })
}

exports.findUserById = function(userId, callback) {
  onConnect(function(err, conn) {
     r.db("mmorpg").table('users')
    .get(userId)
    .run(conn)
    .then(function(output) {
      return callback(output);
    })
    .finally(function() { conn.close(); });
  })
}

exports.registerUser = function(userDetails, callback) {
  let userPayload = exports.SERVER_CONFIG["newPlayerDetails"];
  userPayload.username = userDetails["username"];
  userPayload.permission = 0; // Just making sure.
  if(exports.SERVER_CONFIG["passwordRequired"]) userPayload.password = MMO_Core["security"].hashPassword(userDetails["password"].toLowerCase());

  onConnect(function(err, conn) {
    r.db("mmorpg").table('users')
    .insert(userPayload)
    .run(conn)
    .then(function(output) {
      return callback(output);
    })
    .finally(function() { conn.close(); });  
  })
}

exports.savePlayer = function(playerData, callback) {  
  // We delete what we don't want to be saved (in case it is there)
  delete playerData.permission;

  onConnect(function(err, conn) {
    let request = r.db("mmorpg").table('users')
    .filter({
      "username": playerData["username"],
    })
    .update(playerData)

    if(playerData.stats) { 
      request = request.do(r.db("mmorpg").table('users')
      .filter({
        "username": playerData["username"],
      }).update({"stats": r.literal(playerData.stats)}))
    }

    request.run(conn)
    .then(function(cursor) { return cursor; })
    .then(function(output) {
      return callback(output);
    })
    .finally(function() { conn.close(); });  
  })
}

exports.reloadConfig = function(callback) {
  onConnect(function(err, conn) {
    r.db("mmorpg").table("config")(0).run(conn)
      .then(function(cursor) { return cursor; })
      .then(function(output) {
        exports.SERVER_CONFIG = output;
        callback();
      })
      .finally(() => { conn.close(); })
  })
}

exports.saveConfig = function() {
  onConnect(function(err, conn) {
    r.db("mmorpg").table("config")(0)
    .update(exports.SERVER_CONFIG)
    .run(conn)
    .then(() => {
      console.log("[I] Server configuration changes saved.")
    })
    .finally(() => {
      conn.close();
    })
  })
}

onConnect = function(callback) {
  r.connect({host: "localhost", port: 28015 }, function(err, connection) {
    if(err) throw err;
    callback(err, connection);
  })
};
