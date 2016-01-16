var express = require('express');
var app = express();
var fs = require('fs');
var Future = require('future');
var crypto = require('crypto');
var mkdirp = require('mkdirp');
var querystring = require('querystring');
var router = express.Router();  
var http = require('http');
var promise = require('promise');
var BLOCK_SIZE = 44;
var uint8 = require('uint8')
var file_chunks = [];
var checksums = [];
var diff_blocks = [];
var request = require("request");
var body_parser = require('body-parser');
var mongojs = require('mongojs');
var ArrayBufferToBuffer = require('arraybuffer-to-buffer');
var ObjectID = require('mongodb').ObjectID;
var db  =  mongojs('FileSystemDatabase', ['Users', 'Files', 'Folders']);
var path = require('path');
var file = "";
var dirString = path.dirname(fs.realpathSync(__filename));


app.use(express.static(path.join(__dirname, '/')));
app.use(body_parser.json({limit: '50mb'}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
var logged_in_users = [];
function toBuffer(Arr) {
    var buff = new Buffer(Arr.length);
    for (var i = 0; i < buff.length; ++i) {
        buff[i] = Arr[i];
    }
    return buff;
}

var insert = function(FileName_On_Server, Content, FileName, Owner, Size, Type, FileLocation, checksums) {
                  fetch_file_info(Owner, FileName).then( 
                  function (data) {
                  if(data == null) {
                  fs.writeFile(FileName_On_Server, Content, function (err) {
                   if (err) {
                    console.log(err);
                   }
                   else {
                       var data = {Owner: Owner, FileName: FileName, Size: Size, Type: Type, FileLocation: path.join(__dirname + FileName_On_Server)};
                       db.Files.insert(data, function (err, result) {
                       if(err) {
                            console.log(err);
                        }
                        else {
                            console.log("Inserted File " + FileName);
                        }
                      });
                    }      
                 });
                }
                else {
                    console.log("File exists already");
                  }
                });
}

//THIS FUNCTION SYNCS EXISTING FILES
var sync =  function (Filename, Client_Checksums) {
  console.log("Syncing " + Filename);
  var FileName = Filename.split('+');
  var user = FileName[0];
  FileName = Filename.split('/');
  var Filename = user + '+' + FileName[FileName.length - 1];
  console.log(Filename);
  var checksums = [];
  var diff_blocks = [];
  var rolling_checksums = [];
  var data = fs.readFileSync(Filename);
        data = data.toString();
        //console.log(data);

        //FIND MD5 CHECKSUMS FOR SERVER SIDE DATA HERE
        for(character = 0; character < data.length; character = character + BLOCK_SIZE) {
                var chunk = data.substring(character, character+ BLOCK_SIZE)
                file_chunks.push(chunk);
                hash = crypto.createHash('md5').update(chunk).digest('hex');
                checksums.push(hash);
        }
        if(checksums.length == Client_Checksums.length) {
          for(i = 0; i < Client_Checksums.length; i++) {
            if(Client_Checksums[i] != checksums[i]) { 
                diff_blocks.push(i);
            }
          }
        }
        else {
          console.log("Calculating rolling checksums because file size is different");
          var block = 0;
          var rolling_checksum = 0;
           for(character = 0; character < data.length; character = character + 1) {
             rolling_checksum = rolling_checksum + data[character].charCodeAt(0);
             block ++;
             if(block == BLOCK_SIZE-1 || character == data.length - 1) {
              rolling_checksums.push(rolling_checksum);
              block = 0;
             }
          }
          console.log(rolling_checksums);
        }
        return diff_blocks;
}


var fetch_file_info = function(owner, FileName) {
  console.log(owner);
  return new promise(function (resolve, reject) {
        db.Files.findOne({$and: [{"Owner": owner}, {"FileName": FileName}]}, function (err, docs) {
          if(err) {
              console.log(err);
              reject("lol");
          }
          else {
                 resolve(docs);
            }
      }) 
  });
}

app.post('/Files', function (req, res) {
  //FROM LOCAL CLIENT APPLICATION
//IF FILE DOES NOT EXIST AT SERVER, IT WILL BE ADDED TO THE DATABASE WITH THE RELEVANT DETAILS
//IF FILE EXISTS, SYNC TAKES PLACE

  console.log("INSERTING NEW FILES IN DATABASE");
  var files = req.body.files;
  var total_files= req.body.files.length;
  var Owner = new ObjectID(req.body._id);
  for(file = 0; file < total_files; file++) {
    var f = files[file];
    var FileName = f.Filename;
    var Size = f.filesize;
    var checksums = f.checksums;
    var Type = "";
    var Content = f.encrypted_content;
    var FileName_On_Server = Owner + '+' + FileName+ '.txt'; 
    var FileLocation =  path.join(__dirname + FileName_On_Server);
    insert(FileName_On_Server, Content, FileName,  Owner, Size, Type, FileLocation, checksums);
  }
  res.send("Inserted new files");
});


app.post('/GetFolders', function (req, res) {
      var id = req.body.USER_ID;
      console.log(id);
      var Owner = new ObjectID(id);
      db.Folders.find({"Owner" : Owner}, function (err, docs) {
        if(err) {
          console.log(err);
        }
        else {
          res.send(docs);
        }
      });
});

app.post('/NewFolder', function (req, res) {
 console.log("INSERTING NEW FOLDER IN DATABASE");
 var foldername = req.body.folder_name;
 var Owner = new ObjectID(req.body.Owner);
 var data = {FolderName: foldername, Owner: Owner, Shared: "No", Shared_Owners: []};
 db.Folders.insert(data, function (err, result) {
 if(err) {
      console.log(err);
  }
  else {
      console.log("Inserted folder");
  }

         var data1 = JSON.stringify(data);
            console.log(err);
                var options = {
              host: '',
              port: 1234,
              path: '/NewFolder',
              method: 'POST',
              keepAlive: false,
              headers: {
                  'Content-Type': "application/json",
                  'Content-Length': Buffer.byteLength(data1)
              }
          };

          var reqs = http.request(options, function(resp) {
              resp.setEncoding('utf8');
              resp.on('data', function (chunk) {
                console.log(chunk);
              });
          });
            reqs.write(data1);
            reqs.end();
});

  res.send("Inserted");
});


app.get('/Folders/:_id', function(req, res) {
 console.log("A");
  // console.log(logged_in_users);
  var id = req.params._id;
  var logged_in = false;
  for(i = 0; i < logged_in_users.length; i++) {
    console.log(JSON.parse(logged_in_users[i])._id);
    console.log(id);
      if( JSON.parse(logged_in_users[i])._id === id) {
        logged_in = true;
        console.log("yoohoooo");
      }
  }
          app.use(express.static('C:/Users/Aiza/Desktop/New folder (3)/SProj'));
          res.sendFile(path.join(__dirname + '/MyFolders.html'));
    
});

app.get('/Folders/:user_id/:folder_id', function(req, res) {
 console.log("AHHHHHH");
          app.use(express.static('C:/Users/Aiza/Desktop/New folder (3)/SProj'));
          res.sendFile(path.join(__dirname + '/BrowseFolders.html'));
    
});




app.post('/ShareFolder', function(req, res) {
  var Owner= new ObjectID(req.body.User_ID);
  var share_with = req.body.Users;
  var Folder = new ObjectID(req.body.Folder_ID);
  //SEND REQUEST TO LOCAL APP TO RE ENCRYPT SHARED FOLDER SEND USERS PUBLIC KEY ALSO
  //RESPONSE WILL CONTAIN REENCRYPTED FILES AND ENCRYPTED ENCRYPTION KEY FOR SHARED USER INSERT THESE IN THE DATABASE
  //FOLDER SHARED WITH NEW OWNER WHO WILL RECEIVE ENCRYPTION KEY ON HIS/HER LOCAL APP AND DECRYPT USING OWN PUBLIC KEY AND
  //DISPLAY THESE FILES IN SHARED FOLDER PART OF THE WEB APP
});





app.post('/new_user', function (req, res) {
  console.log("A new user wants to join in");
  console.log(req.body);
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var certificate = req.body.cert;
  var picture = req.body.picture;
  var Owned_Files = [];
  var Shared_Files  = [];
  var Role = "User";
  var inserted = false;
  var user = {
    username: username,
    email: email,
    picture : picture,
    Owned_Files: Owned_Files,
    Shared_Files: Shared_Files,
    Role: Role
  }
db.Users.insert(user, function (err, result) {
        if(err) {
          console.log(err);
        }
        else {
          console.log("New User Inserted");
        }
      }
  );
db.Users.findOne({email: email}, function (err, result){
      console.log(result._id);
      var user = result._id;
      var cert_name = user + ".pem";
      var profile_picture =
    mkdirp(dirString + '/' + user, function(err) { 
      if(err) {
        console.log(err);
      }
      else {
        cert = certificate.split(',');
        var buff = toBuffer(cert);
        console.log(buff);
        var path = dirString +'/' + user + '/' + cert_name;
        fs.writeFileSync(path, buff);
         res.send("Account Created Successfully");
      }
    });
});
});
//login requests and then check if credentials exist or not. if not, give a login error. if they exist route to homepage
app.post('/Login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var message = "";
    console.log(req.body.password);
    var authenticate = function() {
    return new promise(
     function (resolve, reject) {
    db.Users.findOne({"email": email}, {"password": password}, function (err, docs) {
      if(err) {
        console.log(err);
      }
    console.log(docs);
    docs = JSON.stringify(docs);
    message = JSON.parse(docs)._id;
   // console.log(JSON.parse(docs)._id);
    if(docs.length == 0) {
     reject("Authentication Error");
    }
    else {
      resolve(docs);
    }
           res.send(message);
//    console.log(message);
  });
  });
  }
  authenticate().then(
      function (data) {
       console.log(data);
       logged_in_users.push(data);
       console.log(logged_in_users);
      }
    )
});


app.post('/upload', function (req, res) {
    var Owner = new ObjectID(req.body.Owner);
    var body = req.body;
    var FileName = req.body.FileName;
    var Folder = "Default";
    var Size = req.body.Size;
    var Type = req.body.Type;
    var Content = req.body.Content;
    var FileName_On_Server = req.body.Owner + '+' + FileName+ '.txt';        //write encrypted content of uploaded files in txt files 
    fs.writeFile(FileName_On_Server, Content, function (err) {
       if (err) {
        console.log(err);
       }
       else {
           var data = {Owner: Owner, Folder: Folder, FileName: FileName, Size: Size, Type: Type, FileLocation: path.join(__dirname + FileName_On_Server)};
           db.Files.insert(data, function (err, result) {
           console.log(err);
           console.log("Inserted a document into the Files collection.");
           var data = body;
          console.log(data);
          data = JSON.stringify(data);

          var options = {
              host: '',
              port: 1234,
              path: '/Upload',
              method: 'POST',
              keepAlive: false,
              headers: {
                  'Content-Type': "application/json",
                  'Content-Length': Buffer.byteLength(data)
              }
          };

          var reqs = http.request(options, function(resp) {
              resp.setEncoding('utf8');
              resp.on('data', function (chunk) {
                console.log(chunk);
              });
          });
            reqs.write(data);
            reqs.end();
          });
     }      
  });

    res.send("uploaded");

});

app.post('/GetFolderName', function (req, res) {
  var folder_id = new ObjectID(req.body.ID);
  db.Folders.find({"_id" : folder_id}, function (err, docs) {
        if(err) {
          console.log(err);
        }
        else {
          res.send(docs);
        }
      });
});

app.post('/UploadToFolder', function (req, res) {
    var Owner = new ObjectID(req.body.Owner);
    var Folder = new ObjectID(req.body.Folder);
    var FolderName = req.body.FolderName;
    var FileName = req.body.FileName;
    var Size = req.body.Size;
    var Type = req.body.Type;
    var Content = req.body.Content;
    var data1 = {FolderName: FolderName, FileName: FileName, Content: Content };
    var FileName_On_Server = req.body.Owner + '+' + FileName+ '.txt';        //write encrypted content of uploaded files in txt files 
    fs.writeFile(FileName_On_Server, Content, function (err) {
       if (err) {
        console.log(err);
       }
       else {
           var data = {Owner: Owner, Folder: Folder, FileName: FileName, Size: Size, Type: Type, FileLocation: path.join(__dirname + FileName_On_Server)};
           db.Files.insert(data, function (err, result) {
           console.log(err);
           console.log("Inserted a document into the Files collection.");
          });
     }      
  });

try {
          data1 = JSON.stringify(data1);
          var options = {
              host: '',
              port: 1234,
              path: '/Upload',
              method: 'POST',
              headers: {
                  'Content-Type': "application/json",
                  'Content-Length': Buffer.byteLength(data1)
              }
          };

          var reqs = http.request(options, function(resp) {
              resp.setEncoding('utf8');
              resp.on('data', function (chunk) {
                console.log(chunk);
              });
          });

          reqs.write(data1);
          reqs.end();
        }

        catch (e) {
          console.log(e);
        }
    res.send("uploaded");

});


app.get('/User/:_id', function (req, res) {
  console.log("A get user request!");
  console.log(logged_in_users);
  var id = req.params._id;
  var logged_in = false;
  for(i = 0; i < logged_in_users.length; i++) {
    console.log(JSON.parse(logged_in_users[i])._id);
    console.log(id);
      if( JSON.parse(logged_in_users[i])._id === id) {
        logged_in = true;
        console.log("yoohoooo");
      }
  }
          app.use(express.static('C:/Users/Aiza/Desktop/New folder (3)/SProj'));
          if(logged_in) {
          res.sendFile(path.join(__dirname + '/HomePage.html'));
          }
          else {
            res.send("You are not logged in");
          }


  // var all_files = "";
  // db.Users.findOne({"_id" : ObjectID(id)}, {"Owned_Files": 1}, function (err, docs) {           //user with user id specified in parameters
  //      docs = JSON.stringify(docs);
  //      console.log(JSON.parse(docs).Owned_Files);
  //      var file_array = JSON.parse(docs).Owned_Files.toString().split(',');

  //      //iterate over each file and add to all_files string to show on the webpage
  //      for(i = 0; i < file_array.length; i++) {
  //       db_Files.Files.findOne({"_id" : ObjectID(file_array[i])}, function (err, docs) {
  //           docs = JSON.stringify(docs);
  //           all_files = all_files + "FileName:         " + JSON.parse(docs).Name.toString() + "            "  + JSON.parse(docs).Content.toString() + " \n";  
  //           res.send(all_files);
  //         })
  //       }
  //       // console.log(all_files);

  //      });
  // console.log('test'); // <
});

var update_blocks = function(Filename, Block_Numbers, Updated_Blocks) {
      for(i = 0; i < Updated_Blocks.length; i++) {
              index_to_replace =Block_Numbers[i];
              var buf = new Buffer(Updated_Blocks[i]);
              console.log("writing: " + Updated_Blocks[i])
              console.log("on index" + index_to_replace)
              var foo = fs.openSync(Filename,'r+');
              fs.writeSync(foo, buf, 0, buf.length, index_to_replace*BLOCK_SIZE);
              console.log("content changed")
      }
}

app.post('/Update_Content', function (req, res) {
var updated_files = req.body.Updated_Blocks;
// var mychecksums = req.body.server_checksums;

//MAKE CHANGES TO THIS FUNCTION HERE TO INCORPORATE INSERTIONS ETC
for(i = 0; i < updated_files.length; i++) {
      var filedata = updated_files[i];
      var filename = filedata.file;
      if(filename != "Client.js") {
       var owner = filedata.Owner;
       var Block_Numbers = filedata.Block_Numbers;
       var Updated_Blocks = filedata.Updated_Blocks;
       var Filename = owner + '+' + filename+ '.txt'; 
       update_blocks(Filename, Block_Numbers, Updated_Blocks);
      }
  }

  res.send("content updated");
});

app.post('/get_checksums', function (req, res) {
  var data = {
    checksums: JSON.stringify(checksums)
  }
  res.send(data);
});

app.post('/get_blocks', function (req, res) { 
        console.log(req.body.block_number);
        var send_to_client = [];
        var indices = JSON.parse(req.body.block_number);
        indices = indices.toString().split(',');
        for(i = 0; i < indices.length; i++) {
                  var ind = parseInt(indices[i]);
                  var chunk = file_chunks[ind];
                  console.log(chunk);
                  send_to_client.push(chunk); 
                  console.log(send_to_client);     
            }
        res.send(send_to_client)
        }
);

app.post('/diff_blocks', function (req, res) {
  //  console.log(req.body.different_blocks);
    var replace_blocks = req.body.different_blocks;
    replace_blocks  =  JSON.parse(replace_blocks);
    replace_blocks = replace_blocks.split(',');
    if(replace_blocks.length > 0 ) {
                for(i = 0; i < diff_blocks.length; i++) {
                              index_to_replace = diff_blocks[i];
                              file_chunks[index_to_replace] = replace_blocks[i];
                              var buf = new Buffer(replace_blocks[i]);
                              console.log("writing: " + replace_blocks[i])
                              console.log("on index" + index_to_replace)
                              var foo = fs.openSync(file,'r+');
                              fs.writeSync(foo, buf, 0, buf.length, index_to_replace*BLOCK_SIZE);
                              console.log("content changed")
                              diff_blocks = [];
                }
    }
    file_chunks = [];
});




app.post('/sync', function (req, res) {
console.log(req.body.files);
var data_to_send = [];
var all_files = req.body.files;
var owner = req.body._id;
  for(file = 0; file < all_files.length; file++) {
        var File = all_files[file];
        var FileName = File.Filename;
        console.log(FileName);
        console.log(owner);
        var FileName_On_Server = owner + '+' + FileName+ '.txt'; 
        var diff_blocks = sync(FileName_On_Server, File.checksums);
        if (diff_blocks.length > 0 ) {
            var data = {Filename: FileName, Different_blocks: diff_blocks, Owner: owner}
            data_to_send.push(data);
        }
  }
  data_to_send = {BLOCKS_TO_SYNC: data_to_send}
   console.log(data_to_send);
   res.json(data_to_send);
});

var server = app.listen(3000, function () {
var host = server.address().address;
var port = server.address().port;

console.log('Example app listening at http://%s:%s', host, port);
});