var express = require('express');
var app = express();
var fs = require('fs');
var math = require('math');
var Future = require('future');
var crypto1 = require("crypto");
var crypto = require('crypto');
var tc = require("timezonecomplete"); 
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
var db  =  mongojs('FileSystemDatabase', ['Users', 'Files', 'Folders', 'SharedFolders', 'Blocks']);
var path = require('path');
var file = "";
var dirString = path.dirname(fs.realpathSync(__filename));


function get_new_data(str1, temp, str2_length) {
  var Data = temp[0].split(',');
  var Pos = temp[1].split(',');
  console.log(Data);
  console.log(Pos);
for(i = 0; i < Data.length; i++) {
  var index = parseInt(Pos[i]);
    str1 = str1.substring(0, index) + Data[i] + str1.substring(index);
}
return str1.substring(0,str2_length);
}

function get_rolling_checksums(file) {
          var block = 0;
          var data = file;
          var rolling_checksums = [];
          var rolling_checksum = 0;
           for(character = 0; character < data.length; character = character + 1) {
              rolling_checksum = rolling_checksum + data[character].charCodeAt(0);
              block++;
              if(block == BLOCK_SIZE || character == data.length-1) {
                rolling_checksums.push(rolling_checksum);
                rolling_checksum = 0;
                block = 0;
              }

          }
      return rolling_checksums;
}
//(OLDER VERSION, NEWER VERSION)
function compare_for_insertions(str2, checksums2, checksums1) {
  var complete = false;
var pos = 0;
var Data = [];
var Pos = [];
var tempstr2 = str2;
while (true) {
    if(checksums2.length == 0) {
    complete = true;
    }
  if(complete) {
    break;
  }
  if(checksums1[0] == checksums2[0]) {
    checksums1.shift();
    checksums2.shift();
    str2 = str2.substring(BLOCK_SIZE);
    pos = pos + BLOCK_SIZE;
  }
  else if(checksums2[0] != checksums1[0]) {
    var data = "";
    while(true) {
    if(checksums2.length == 0) {
      complete = true;
      break;
    }
    if(typeof(checksums1[0]) === "undefined") {
      data = str2.substring(0,BLOCK_SIZE);
      str2 = str2.substring(BLOCK_SIZE);
      Data.push(data);
      checksums2.shift();
      Pos.push(pos);
      pos = pos + BLOCK_SIZE;
      break;
    }
    else if(typeof(checksums1[0]) != "undefined" && checksums1[0] != checksums2[0]) {
      data = data + str2[0];
      str2 = str2.substring(1);
      checksums2 = get_rolling_checksums(str2);
        if(checksums2.length == 0) {
        Data.push(data);
        console.log(pos);
        Pos.push(pos);
        }
    }
    else if(checksums2[0] == checksums1[0]) {
        checksums1.shift();
        checksums2.shift();
        Data.push(data);
        Pos.push(pos);
        str2 = str2.substring(BLOCK_SIZE);
        pos = pos + data.length + BLOCK_SIZE;
        break;
    }
    else if(checksums2.length == 0) {
        Data.push(data);
        Pos.push(pos);
        complete = true;
        break;
    }
  }
  }
}
return Data+ "SPLIT"+ Pos;
}



//(NEWER VERSION, OLDER VERSION)
function compare_for_deletions(smaller, bigger) {
  var checksums1 = smaller
  var checksums2 = get_rolling_checksums(string2);
  var points_of_deletion = [];
  var data_to_delete = [];
  var index = -1;
    if(checksums1.length < checksums2.length) {
      for(var i = 0; i < checksums2.length; i++) {
          if(checksums1[i] != checksums2[i]) {
            points_of_deletion.push(i);
             index++;
             while(true) {
             if(data_to_delete[index] == null) {
              data_to_delete[index] = string2[i];
             }
             else {
              data_to_delete[index] = data_to_delete[index] + string2[i];
             }
             string2 = string2.slice(0, i) + string2.slice(i+1);
             console.log(string2);
             checksums2 =  get_rolling_checksums(string2);
              if(checksums1[i] == checksums2[i]) {
                break;
              }
              else if(i == checksums1.length) {
                break;
              }
            }
          }       
      }
  }
  console.log(data_to_delete);
  console.log(points_of_deletion);
};

function existsSync(filePath){
  try{
    fs.statSync(filePath);
  }catch(err){
    if(err.code == 'ENOENT') return false;
  }
  return true;
};

app.use(express.static(path.join(__dirname, '/')));
app.use(body_parser.json({limit: '500mb'}));
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

var insert = function(FileName_On_Server, Content, FileName, Owner, Size, Type, last_modified) {
                 // console.log(FileName_On_Server + "  "  + Content);
                  fs.writeFile(FileName_On_Server, Content, function (err) {
                   if (err) {
                    console.log(err);
                   }
                   else {
                       var data = {Owner: Owner, FileName: FileName, Size: Size, Type: Type, LastModified: last_modified};
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

//THIS FUNCTION SYNCS EXISTING FILES
var sync =  function (Filename, Owner, LastModified, Size) {
  console.log("Syncing " + Filename);
  var Owner = new ObjectID(Owner);
  var name = Filename.split('/');
  if(name.length == 2) {
  name = name[name.length-1];
  }
  else {
    var temp = name[0];
    for(i = 1; i < name.length;i++) {
        temp  = temp + '/' + name[i];
    }
    name= temp;
  }
  console.log(name);
  var ret = "No Changespl" + name;
  return new promise(function (resolve, reject) {
  db.Files.findOne({$and : [{Owner: Owner}, {FileName: name} ]}, function (err, docs) {
      if (err) {
        console.log(err);
      }
      else if(docs != null) {

          var last_mod = docs.LastModified;
              console.log(LastModified);
              var server = new tc.DateTime(last_mod);
              var client  = new tc.DateTime(LastModified);
              var duration = client.diff(server);
              console.log(client + " " + Size);
              console.log(server);
              if(duration.minutes() > 0) {
                if(Size == docs.Size) {
                  ret = "ModifyMe";
                }
                  else if(Size < docs.Size) {
                    ret = "DeleteMe";
                  }
                  else {
                    ret = "InsertMe ";
                  }
              }
              //server more updated
              else if (duration.minutes() < 0) {
                console.log(duration.minutes());
                  if(Size == docs.Size) {
                  ret = "ModifyYourspl"+ name;
                  }
                  else if(Size < docs.Size) {
                   ret = "InsertYourspl"+ name;
                  }
                  else {
                    ret = "DeleteYourspl"+ name;
                  }
              }

      }    
    resolve(ret);
    });
});
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

app.post('/RollingCheckSums', function (req, res) {
        console.log("YAHOOOOOOOOOOOOOOOOOOO"+ dirString+ '/' + req.body.Owner + '/' + req.body.FileName + '.txt');
        fs.readFile(dirString+ '/' + req.body.Owner + '/' + req.body.FileName + '.txt', function (err, data)  {
            if(err) {
              console.log(err);
            }
            var rolling_checksums = get_rolling_checksums(data.toString());
            rolling_checksums = rolling_checksums.toString();
            console.log(rolling_checksums);
            if (data == "") {
              rolling_checksums = "[]";
            }
            res.send(rolling_checksums.toString());
        });
});

app.post('/Insertions', function (req, res) {
    var lastmodtime = req.body.LastMod;
    var LastMod = new Date(req.body.LastMod);
    var atime = new Date(req.body.atime);
    console.log(LastMod);
    console.log(atime);
    var Size = req.body.Size;
    var File = req.body.File;
    var Owner = req.body.Owner;
      db.Files.update(
                        { $and: [{"Owner": new ObjectID(Owner)}, {FileName: File}]},
                           {$set:
                              {
                                LastModified: lastmodtime,
                                Size: Size
                              }
                           }
                        );
    var Blocks = req.body.Blocks;
    var str_length  = req.body.string_length;
    var filename = dirString + '/' + Owner + '/' + File + '.txt';
    var l = 0;
    var file_content = fs.readFileSync(filename).toString();
    if(req.body.Method == "Insert") {
    Blocks = Blocks.toString().split('SPLIT');
    console.log(Blocks);
    file_content = get_new_data(file_content, Blocks, str_length);
  //  console.log(file_content);
    fs.writeFile(filename, file_content, function (err, data) {
      if(err) {
        console.log(err);
      }
      else {
        fs.utimes(filename, atime, LastMod, function (err, callback) {
        console.log("lol");
        });
        res.send("Hmmm");
      }
    });
    }
    else if(req.body.Method == "InsertAll") {
      file_content = Blocks;
      console.log(file_content);
    fs.writeFile(filename, file_content, function (err, data) {
      if(err) {
        console.log(err);
      }
      else {
            fs.utimes(filename, atime, LastMod, function (err, callback) {
            console.log("lol");
            });
        res.send("Hmmm");
      }
    });
    }
    else if(req.body.Method == "Delete") {
        console.log("Delete");
        //DO STUFF HERE AIZA 
    }
    else {
      var fd = fs.openSync(filename, 'r+');
      console.log("MODIFYING");
      for(i = 0; i < Blocks.length; i = i + 2) {
          var position = parseInt(Blocks[i])*BLOCK_SIZE;
          var data = new Buffer(Blocks[i+1]);
          fs.write(fd, data, 0, data.length, position, function (err, callback) {
            if(err) {
              console.log(err);
            }
            else {
                fs.utimes(filename, atime, LastMod, function (err, callback) {
                if(err) {}
                  else {
                  }
                });
              console.log("modified");
            }
          });
      }
      res.send("Hmmm");
    }
    
});


app.post('/Files', function (req, res) {
  //FROM LOCAL CLIENT APPLICATION
//IF FILE DOES NOT EXIST AT SERVER, IT WILL BE ADDED TO THE DATABASE WITH THE RELEVANT DETAILS
//IF FILE EXISTS, SYNC TAKES PLACE
//  console.log("INSERTING NEW FILES IN DATABASE");
  var files = req.body.files;
  var total_files= req.body.files.length;
  var Owner = new ObjectID(req.body._id);
  for(file = 0; file < total_files; file++) {
    var f = files[file];
    var FileName = f.Filename;
    FileName = FileName.split('/');
    FileName_On_Server = Owner;
    for(var i = 1; i < FileName.length; i++) {
           FileName_On_Server = FileName_On_Server + '/' + FileName[i];
      }
       FileName_On_Server =  FileName_On_Server + '.txt';
     FileName =  FileName[FileName.length - 1];
    console.log(FileName_On_Server);
    var Size = f.filesize;
    var checksums = f.checksums;
    var Type = "";
    var Content = f.encrypted_content;
    //console.log(Content);
    var last_modified  = f.last_modified;
          if (existsSync(FileName_On_Server)) {
              console.log(FileName_On_Server + " " + "Exists on server already");
          }
          else if(existsSync(FileName_On_Server) == false) {
            insert(FileName_On_Server, Content, FileName,  Owner, Size, Type, last_modified);
          }
    
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
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress||req.connection.socket.remoteAddress;
 console.log("INSERTING NEW FOLDER IN DATABASE");
 var foldername = req.body.folder_name;
 var Owner = new ObjectID(req.body.Owner);
 var data = {FolderName: foldername, Owner: Owner, Shared: "No", Shared_Owners: []};
 
 db.Folders.findOne({$and :[{FolderName: foldername}, {Owner:Owner}]}, function (err, docs) {
  if(err) {
    console.log(err);
  }
  else if(docs == null) {
 mkdirp(dirString + '/' + Owner + '/'+ foldername, function(err) { 
      if(err) {
        console.log(err);
      }
    });

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
              host: ip,
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
}});

  res.send("Inserted");
});

app.post('/Change', function (req, res) {
  var Owner = new ObjectID(req.body.Owner);
  var File =req.body.File;
  var Content = req.body.Content;
  var Size = req.body.Size;
  var LastModified = req.body.LastModified;
    var file_on_server = File.split('/');
    file_on_server = file_on_server[file_on_server.length-1];
  File = Owner + '/' + File + '.txt';
  fs.writeFile(File, Content, function (err, data) {
      if (err) {
        console.log(err);
      }
      else {
        db.Files.findOne({$and:[{Owner: Owner}, {FileName: file_on_server}]}, function (err, docs) {
            if(err) {
              console.log(err);
            }
            else {
              var _id = docs._id;
              var Folder = docs.Folder;
              var FileName = docs.FileName;
              var data = {_id: _id, Owner: Owner, FileName:FileName, LastModified:LastModified, Size:Size};
              console.log(data);
              if(Folder !== null) {
                var data = {_id: _id, Owner: Owner, Folder: Folder,FileName:FileName, LastModified:LastModified, Size:Size};
              } 
                       db.Files.update(
                        { $and: [{"Owner": Owner}, {_id: _id}]},
                           {$set:
                              {
                                LastModified: LastModified,
                                Size: Size
                              }
                           }
                        );
              res.send("Done");
            }
        })
      }
  });


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


app.post('/GetBlocks', function (req, res) {
    var Owner = req.body.Owner;
    var Blocks = req.body.diff_blocks;
    var File = req.body.File;
    var data_to_send = [];
    var Chunk = [];
    File = Owner+ '/' + File+ '.txt';
    console.log(File);
    db.Files.findOne({$and:[{FileName: req.body.File}, {Owner: new ObjectID(Owner)}]}, function (err, docs) {
      if(err) {
        console.log(err);
      }
      else if(docs != null) {
        console.log("OMGGGGGGGGGGGG"+docs)
    fs.readFile(Owner+ '/' + docs.FileName+ '.txt', function (err, data) {
          if(err) {
            console.log(err);
            }
        else {
            data = data.toString();
            for(character = 0; character < data.length; character = character + BLOCK_SIZE) {
                  var chunk = data.substring(character, character + BLOCK_SIZE)
                  Chunk.push(chunk);
            }
           for(i = 0; i < Blocks.length; i++) {
                data_to_send.push(Chunk[parseInt(Blocks[i])]);
           }
            res.send(data_to_send + "SPLIT" + Blocks + "SPLIT" + docs.FileName+"SPLIT" + docs.LastModified);
          }
      });
    }
  });

});

app.post('/ModifyClient', function (req, res) {
    var Owner = new ObjectID(req.body.Owner);
    var File = req.body.File;
    db.Files.findOne({$and: [{Owner: Owner}, {FileName: File}]}, function (err, docs) {
        if(err) {
          console.log(err);
        }
        var temp = "";
            temp = dirString + '/'+ Owner + '/' + File + '.txt';
            fs.readFile(temp, function (err, data) {
                if(err) {
                  console.log(err);
                }
                else {
                  console.log(docs);
                  var result = data;
                  var LastModified = docs.LastModified;
                  var Size = docs.Size; 
                  res.send(get_checksums(result.toString()) +"SPLIT"+File);
                }
            });
    });
});

app.post('/ModifyServer', function (req, res){
  var Owner = new ObjectID(req.body.Owner);
  var File = req.body.Filename;
  var client_last_mod = req.body.LastModified;
  var Client_Checksums = req.body.checksums;
  console.log(File);
});


function get_checksums(data) {

 var checksums = [];
      //  console.log(data);
        for(character = 0; character < data.length; character = character + BLOCK_SIZE) {
                var chunk = data.substring(character, character + BLOCK_SIZE)
                var hash = crypto1.createHash('md5').update(chunk).digest('hex');
                checksums.push(hash);
        }
        return checksums;
}


app.post('/ShareFolder', function (req, res) {
var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress||req.connection.socket.remoteAddress;
  //ADD CHECK HERE IF FOLDER SHARED ALREADY THEN JUST ASK FOR ENCRYPTION KEY

  //if folder shared = yes, give owner his encryption key, give shared users pub key just ask for encrypted key for user



  //INITITALIZATIONS
  var Owner= new ObjectID(req.body.User_ID);
  var share_with = req.body.Users;
  var Folder = new ObjectID(req.body.Folder_ID);
  var FolderName = req.body.FolderName;

//CHECK IF USER YOU WANT TO SHARE WITH EXISTS OR NOT
  db.Users.find({"email": share_with}, function (err, docs) {
      if(err) {
        console.log(err);
      }
      else if (docs.length > 0) {
        //IF EXISTS, GET THE USERS PUBLIC KEY 
        console.log(docs[0]._id);
        console.log('/' + docs[0]._id + '/' + docs[0]._id+ ".pem");
        fs.readFile(dirString + '/' + docs[0]._id + '/' + docs[0]._id+ ".pem", function (err, data) {
            var cert = data;
            console.log(cert);
                                 mkdirp(dirString + '/' + docs[0]._id + '/'+ FolderName, function(err) { 
                              if(err) {
                                console.log(err);
                              }
                            });
            //CHECK IF OWNER AND FOLDER ID CORRECT
            db.Folders.find({$and: [{"Owner": Owner}, {"_id": Folder}]}, function (err, docs) {
                if(err) {
                  console.log(err);
                }
                else {
                  console.log(docs);
                  if(docs.length == 0) {
                    console.log('fffffffffffffffffffffff');
                    res.send("nope");
                  }
                  if(docs.length > 0) {

                      //SEND REQUEST TO LOCAL APP TO RE ENCRYPT SHARED FOLDER SEND USERS PUBLIC KEY ALSO
                  var data = { "Key": cert, "FolderName": FolderName, "Email": share_with};
                  var data1 = JSON.stringify(data);
                              var options = {
                              host: ip,
                              port: 1234,
                              path: '/ShareFolder',
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
                  }
                }
              });
        });
      }
  }); 
});


app.post('/REENCRYPT', function (req, res) {
        res.send("ok");
        var request = JSON.parse(JSON.stringify(req.body));
        var Owner = new ObjectID(request.Owner);
        var Folder = request.Folder;
        var filenames = request.FileNames;
        var content = request.Content;
        var shared_users_key = request.UsersKey;
        var owners_key = request.MyKey;
//        console.log(content);

        //modify encrypted files on server
        console.log(filenames[0]);
        var counter = 0;
        for(var i = 0; i < filenames.length; i++) {
          var name = filenames[i];
          name = name + '.txt';
          var re_encrypted_content = content[i];
          name = name.split('/');
          name = name[name.length-1];
          name = dirString + '/' + Owner + '/' + Folder + '/' + name;
          console.log(name);
          fs.writeFile(name, re_encrypted_content, function (err) {
              if(err) {
                console.log(err);
              }
              db.Users.findOne({"email": request.Email}, function (err, docs) {
                name = name.split('/');
                name = name[name.length-1];
              fs.writeFileSync(dirString + '/' + docs._id + '/' + Folder + '/' + name, re_encrypted_content);
            
            });
                counter++;
              console.log("file modified");

              //IF ALL FILES WRITTEN, 

              if(counter == filenames.length) {
                  console.log("Modifying database");
                  db.Users.findOne({"email": request.Email}, function (err, docs) {
                    console.log("Got the shared user");
                  console.log(docs._id);
                  var shared_user = new ObjectID((docs._id).toString());

                  console.log(shared_user);
                    db.Folders.findOne({$and: [{"Owner": Owner}, {"FolderName": Folder}]}, function (err, docs) {
                       var folder_id = new ObjectID((docs._id).toString());
                                    //LABEL FOLDER AS SHARED
                        if (err) {
                          console.log(err);
                        }
                        console.log("Got folder to modify");
                        var shared = docs.Shared_Owners;
                        db.Folders.update(
                        { $and: [{"Owner": Owner}, {"FolderName": Folder}]},
                           {$set:
                              {
                                Shared: "Yes",
                                Key: owners_key,
                              }
                           }
                        );

                        //ADD SHARED USER TO FOLDERS SHARED OWNERS
                        db.Folders.update(
                           {
                            $and: [{"Owner": Owner}, {"FolderName": Folder}]},
                            { 
                              $push: { 
                              "Shared_Owners": shared_user 
                            } 
                          }
                        );

                       //CREATE NEW SHARED FOLDER FOR SECOND USER AND MAKE ORIGINAL OWNER AND SHARED OWNER ATTRIBUTES
                       db.SharedFolders.insert({"ParentFolder": folder_id, "PrimaryOwner": Owner, "SharedOwner": shared_user,
                        "Key": shared_users_key});
                  });

                });
             }
         });
      }
        
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
    password: password,
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
    console.log(req.body.initialized);
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


app.post('/GetFileData', function (req, res) {
var filename = req.body.File;
console.log("Getting file data for" + " " + filename);
var Owner = req.body.Owner;
var port = req.body.Port;
var path = dirString + '/' + Owner + '/' +filename+'.txt';
console.log(filename);
      db.Files.findOne({$and:[{Owner: new ObjectID(Owner)}, {FileName: filename}]}, function (err, docs) {
        if(err) {
          console.log(err);
        }
        else if (docs == null) {
          filename = filename.split('/');
          folder = filename[0];
          db.Folders.findOne({$and :[{Shared_Owners: new ObjectID(Owner)}, {FolderName: folder}]}, function (err, docs2) {
                //found folder associated with the file that was shared
                if (docs2 != null) {
                var foldername = docs2.FolderName;
                var folder_id = docs2._id;
                console.log(folder_id);
                db.Files.findOne({$and :[{Folder: new ObjectID(folder_id.toString())}, {FileName: filename[filename.length-1]}]}, function (err, docs3) {
                  console.log(docs3);
                    if (err) {
                      console.log(err);
                    }
                    else if (docs3 != null) {
                      var last_mod = docs3.LastModified;
                      var filename = foldername + '/' + docs3.FileName
                      console.log(last_mod +"derferwff");
                      console.log(path);
                      var content = fs.readFileSync(path).toString();
                      console.log("content is" + content);
                    var data = {
                      LastMod : last_mod,
                      Data : filename + "SPLIT" + content
                    }
                    data = JSON.stringify(data);
                            var options = {
                            host: '',
                            port: port,
                            path: '/FileData',
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
                            res.send("Ok");
                    }
                });
              }
          });
        }

        else if(docs != null){
            if(docs.length > 1) {
                docs = docs[0];
              }
              var last_mod = docs.LastModified;
        console.log(last_mod);
        var content = fs.readFileSync(path).toString();
      var data = {
        LastMod : last_mod,
        Data : filename + "SPLIT" + content
      }
      data = JSON.stringify(data);
              var options = {
              host: '',
              port: port,
              path: '/FileData',
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
               res.send("Ok");
          }
      });
});

app.post('/FreshSync', function (req, res) {
    console.log(req.body.Owner + "FreshSync");
    var counter = 0;
    var Files = [];
    var Owner = new ObjectID(req.body.Owner);
    db.Files.find({Owner: Owner}, function (err, docs) {
      if (err) {
        console.log(err);
      }
      else {
        if (docs.length == 0) {
          console.log("I AM HERE");
            db.Folders.find({Shared_Owners: Owner} , function (err, docs1) {
                if (err) {
                  console.log(err);
                }
                else if (docs1.length > 0) {
                  //loop over all shared folders and get their files
                  var counter = 0;
                  console.log(docs1.length);

                    for (i = 0; i < docs1.length; i++) {
                        var foldername = docs1[i].FolderName;
                        console.log(foldername); 
                        db.Files.find({"Folder" : new ObjectID(docs1[i]._id.toString())}, function (err, docs2) {
                            if (err) {
                              console.log(err);
                            }
                            else if (docs2.length > 0) {
                              console.log(docs2);
                              for(i = 0; i < docs2.length; i++) {
                                  Files.push(foldername + '/' + docs2[i].FileName)
                                }
                            }
                             counter++;
                        if(counter == docs1.length) {
                          console.log(Files);
                          res.send(Files);
                        }
                         
                        });
                        console.log(counter);
                    }
                }
                else if (docs1.length == 0) {
                  res.send(Files);
                }
            }); 
          }
        else if (docs.length > 0) {
          for (i = 0; i < docs.length; i++) {
            Files.push(docs[i].FileName);
          }
          db.Folders.find({Shared_Owners: Owner} , function (err, docs1) {
                if (err) {
                  console.log(err);
                }
                else if (docs1.length > 0) {
                  //loop over all shared folders and get their files
                  counter = 0;
                    for (i = 0; i < docs1.length; i++) {
                        var foldername = docs1[i].FolderName; 
                        db.Files.find({"Folder" : new ObjectID(docs1[i]._id.toString())}, function (err, docs2) {
                            if (err) {
                              console.log(err);
                            }
                            else if (docs2.length > 0) {
                                for(i = 0; i < docs2.length; i++) {
                                  Files.push(foldername + '/' + docs2[i].FileName)
                                }
                            }
                          counter++;
                        });
                        if(counter == docs1.length) {
                          res.send(Files);
                        }
                    }
                }
                else if (docs1.length == 0) {
                  res.send(Files);
                }
            });    
        }
      }
    });
});



app.post('/upload', function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress||req.connection.socket.remoteAddress;
    var Owner = new ObjectID(req.body.Owner);
    var body = req.body;
    var FileName = req.body.FileName;
    var Folder = "Default";
    var Size = req.body.Size;
    var Type = req.body.Type;
    var Content = req.body.Content;
    var FileName_On_Server = dirString + '/' + req.body.Owner + '/' + FileName+ '.txt';        //write encrypted content of uploaded files in txt files 
    fs.writeFile(FileName_On_Server, Content, function (err) {
       if (err) {
        console.log(err);
       }
       else {
           var data = {Owner: Owner, Folder: Folder, FileName: FileName, Size: Size, Type: Type};
           db.Files.insert(data, function (err, result) {
           console.log(err);
           console.log("Inserted a document into the Files collection.");
           var data = body;
          console.log(data);
          data = JSON.stringify(data);

          var options = {
              host: ip,
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
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress||req.connection.socket.remoteAddress;
    console.log("IP" + ip);
    var Owner = new ObjectID(req.body.Owner);
    var Folder = new ObjectID(req.body.Folder);
    var FolderName = req.body.FolderName;
    var FileName = req.body.FileName;
    var Size = req.body.Size;
    var Type = req.body.Type;
    var Content = req.body.Content;
    var data1 = {FolderName: FolderName, FileName: FileName, Content: Content };
    var FileName_On_Server = dirString+'/' + req.body.Owner + '/' + FolderName + '/' + FileName+ '.txt';        //write encrypted content of uploaded files in txt files 
    fs.writeFile(FileName_On_Server, Content, function (err) {
       if (err) {
        console.log(err);
       }
       else {
           var data = {Owner: Owner, Folder: Folder, FileName: FileName, Size: Size, Type: Type};
           db.Files.insert(data, function (err, result) {
           console.log(err);
           console.log("Inserted a document into the Files collection.");
          });
     }      
  });

try {
          data1 = JSON.stringify(data1);
          var options = {
              host: ip,
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
          // if(logged_in) {
           res.sendFile(path.join(__dirname + '/HomePage.html'));
          // }
          // else {
          //   res.send("You are not logged in");
          // }


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

app.get('/SharedFolders/:_id', function (req, res) {
  res.sendFile(path.join(__dirname + '/MySharedFolders.html'));
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

function simple_insert(hash, index) {
    return new promise(function (resolve, reject) {
        db.Blocks.insert({Hash: hash, Index: index}, function (err, data) {
                      if (err) {
                        console.log(err);
                      }
                      else {
                        resolve(index + 1 );
                      }
                });
    });
}
         
app.post('/FileUploadFromApp', function (req, res) {
    console.log(req.body);
    var Folder = req.body.Folder;
    var Owner = new ObjectID(req.body.Owner);
    var FileName = req.body.FileName;
    var Content = req.body.Content;
    var Size = req.body.Size;
    var LastModified = req.body.LastModified;
    console.log(req.body.Content);
    var hash_array = [];
    var data_chunk = req.body.Content.match(/[\s\S]{1,44}/g) || [];
    //console.log(data_chunk);

    for(i = 0; i < data_chunk.length; i++) {
    var hash = crypto1.createHash('md5').update(data_chunk[i]).digest('hex')
    hash_array.push(hash);
    }

    var root = tree(hash_array, data_chunk);

    console.log("Root of file is:" + root);

});

function tree(hash, chunks) {
  if(hash.length == 1) {
    console.log("Success");
     db.Blocks.createIndex( { Hash:1 }, { unique:true, dropDups:true } );
    db.Blocks.find({Hash: hash, Data: chunks[0]},function (err, docs) {
      if(docs.length == 0) {
        db.Blocks.insert({Hash: hash, Data: chunks[0]}, function (err) {
          if (err) {
              console.log(err);
          }
        });
      }
    });
    return hash;
  }
  else {
    var block_array = [];
    var hashes = [];
    for(i = 0; i < hash.length; i = i + 2) { 
      if (chunks[i+1] != null) {
        var temp = chunks[i];
        var temp1 = chunks[i+1];
        var block = crypto1.createHash('md5').update(temp).digest('hex') + crypto1.createHash('md5').update(temp1).digest('hex');
        var hash = crypto1.createHash('md5').update(block).digest('hex');
        block_array.push(block);
        hashes.push(hash);
        db.Blocks.find({Hash: hash, Data: block},function (err, docs) {
            if(docs.length == 0) {
              db.Blocks.insert({Hash: hash, Data: block}, function (err) {
                if (err) {
                    console.log(err);
                }
              });
            }
        });
        db.Blocks.ensureIndex( { Hash:1 }, { unique:true, dropDups:true } );
        //console.log(block_array);
       // console.log(hashes);
      }
      else if (chunks [i] != null) {
        var temp = chunks[i];
//        console.log(temp);
        var hash = crypto1.createHash('md5').update(temp).digest('hex');
        block_array.push(temp);
        hashes.push(hash);
         db.Blocks.find({Hash: hash, Data: temp},function (err, docs) {
            if(docs.length == 0) {
              db.Blocks.insert({Hash: hash, Data: temp}, function (err) {
                if (err) {
                    console.log(err);
                }
              });
            }
        });
         db.Blocks.ensureIndex( { Hash:1 }, { unique:true, dropDups:true } );
      }
    }
    // console.log(block_array);
    // console.log(hashes);
    return tree(hashes, block_array);
  }
}

function get_index (hash, length) {
   return new promise(function (resolve, reject) {
  db.Blocks.findOne({Hash: hash}, function (err, docs) {
    if (err) {
      console.log(err);
    }
    else if (docs != null) {
 //     console.log(docs);
      resolve(docs.Index + "," + docs.Hash + "," + length);
    }
  });
});
}

function add_blocks(hash) {
   return new promise(function (resolve, reject) {
    db.Blocks.find({Hash: hash}, function (err, docs) {
                      if (err) {
                        console.log(err);
                      }
                      //if block doesnt exist already, insert it at new index
                      if (docs.length == 0) {
                            db.Blocks.find(function (err, docs1) {
                                var index = docs1.length + 1;
                                db.Blocks.insert({Hash: hash, Index: index}, function (err, data) {
                                          if (err) {
                                            console.log(err);
                                          }
                                          else {
                                            resolve("ok");
                                          }
                                });
                            });
                      }
                      else if (docs.length > 0) {
                        console.log(docs);
                        resolve("ok");
                      }
                  });
   });
}

app.post('/ChangedFile', function (req, res) {
         var Owner = new ObjectID(req.body.Owner);
         var File = req.body.File;
          console.log(File.split("\\"));
         if(File.split("\\").length > 1) {
          File = File.split("\\");
          File = File[File.length-1];
          console.log(File);
         }
         var Size = req.body.Size;
         var LastModified = req.body.LastModified;
         console.log(File);
         db.Files.findOne({$and: [{Owner: Owner}, {FileName: File}]}, function (err, docs) {
            if(err) {
              console.log(err);
            }
            else if(docs != null) {
              console.log(docs);
              if(docs.length > 1) {
                docs = docs[0];
              }
              var last_mod = docs.LastModified;
              console.log(last_mod);
              var server = new tc.DateTime(last_mod);
              var client  = new tc.DateTime(LastModified);
              var duration = client.diff(server);
              //client more update
              if(duration.minutes() > 0) {
                if(Size == docs.Size) {
                  res.send("ModifyMe");
                }
                  else if(Size < docs.Size) {
                    res.send("DeleteMe");
                  }
                  else {
                    res.send("InsertMe");
                  }
              }
              //server more updated
              else if(duration.minutes() > -0.5){
                console.log(duration.minutes());
                  if(Size == docs.Size) {
                  res.send("ModifyYour");
                  }
                  else if(Size < docs.Size) {
                    res.send("InsertYour");
                  }
                  else {
                    res.send("DeleteYour");
                  }
              }
            }
         });

});

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


app.post('/GetSharedFolders', function (req, res) {
        var owner = new ObjectID(req.body.USER_ID);
        db.Folders.find({$and: [{"Shared": "Yes"}, { Shared_Owners: { $in: [owner]}  }]}, function (err, docs) {
          if (err) {
            console.log(err);
          }
          else {
            res.send(docs);
          }
        });

});

app.post('/sync', function (req, res) {
// console.log(req.body.files);
var data_to_send = [];
var counter = 0;
      var all_files = req.body.files;
      //console.log(req.body);
      var owner = req.body._id;
        for(file = 0; file < all_files.length; file++) {
              var File = all_files[file];
              var FileName = File.Filename;
              FileName = FileName.split('/');
              FileName_On_Server = owner;
              for(var i = 1; i < FileName.length; i++) {
                  FileName_On_Server = FileName_On_Server + '/' + FileName[i];
              }
              console.log(FileName_On_Server);
                       sync(FileName_On_Server, owner, File.last_modified, File.filesize).then(function (data) {
                            console.log(data);
                            counter++;
                           var data = {Filename:data.split("spl")[1], Method: data.split("spl")[0]}
                           data_to_send.push(data);
                            console.log(data);
                      // if (diff_blocks.length > 0 ) {
                        console.log(counter);
                      if(counter == all_files.length) {
                       data_to_send = {'SYNC': data_to_send}
                        console.log(data_to_send.SYNC);
                       res.send(JSON.stringify(data_to_send));
               }
              });
          // }
        }
        if(all_files.length == 0) {
          res.send("");
        }
});




var server = app.listen(3000, function () {
var host = server.address().address;
var port = server.address().port;

console.log('Example app listening at http://%s:%s', host, port);
});