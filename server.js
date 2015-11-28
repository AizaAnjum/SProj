
var express = require('express');
var app = express();
var fs = require('fs');
var Future = require('future');
var crypto = require('crypto');
var router = express.Router();  
var BLOCK_SIZE = 44;
var uint8 = require('uint8')
var file_chunks = [];
var checksums = [];
var diff_blocks = [];
var body_parser = require('body-parser');
var mongojs = require('mongojs');
var ArrayBufferToBuffer = require('arraybuffer-to-buffer');
var ObjectID = require('mongodb').ObjectID;
var db  =  mongojs('FileSystemDatabase', ['Users', 'Files']);
var path = require('path');
var file = "";

app.use(express.static(path.join(__dirname, '/')));
app.use(body_parser.json({limit: '50mb'}));

app.post('/FILES', function (req, res) {
      console.log("INITI");
      console.log(req.body);
      var ID = req.body.ID;
      ID = ID.toString();
      var data = '';
      var all_files = fs.readdirSync(__dirname);
      console.log(all_files);
      for(file_num  = 0; file_num < all_files.length; file_num++) {
            var file_name = all_files[file_num];
            file_name = file_name.toString();
            if(file_name.indexOf(ID) > -1 ) {
                data = fs.readFileSync(file_name);
                console.log(data.toString());
            }
      }
      console.log(data);
      res.send(data.toString());
}); 

app.post('/new_user', function (req, res) {
  console.log("A new user wants to join in");
  console.log(req.body);
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
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
          res.send("Account Created Successfully");
        }
      }
  );
});

//login requests and then check if credentials exist or not. if not, give a login error. if they exist route to homepage
app.post('/Login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var message = "";
    console.log(req.body.password);
    db.Users.findOne({"email": email}, {"password": password}, function (err, docs) {
      if(err) {
        console.log(err);
      }
    console.log(docs);
    docs = JSON.stringify(docs);
    message = JSON.parse(docs)._id;
    console.log(JSON.parse(docs)._id);
    if(docs.length == 0) {
     message = "Authentication Error";
    }
    res.send(message);
    console.log(message);
  });
});


app.post('/upload', function (req, res){
    var Owner = new ObjectID(req.body.Owner);
    var FileName = req.body.FileName;
    var Size = req.body.Size;
    var Type = req.body.Type;
    var Content = req.body.Content;
    var FileName_On_Server = req.body.Owner + '+' + FileName+ '.txt';        //write encrypted content of uploaded files in txt files 
    fs.writeFile(FileName_On_Server, Content, function (err) {
       if (err) {
        console.log(err);
       }
       else {
           var data = {Owner: Owner, FileName: FileName, Size: Size, Type: Type, FileLocation: path.join(__dirname + FileName_On_Server)};
           db.Files.insert(data, function (err, result) {
           console.log(err);
           console.log("Inserted a document into the Files collection.");
          });
     }      
  });
});


app.get('/User/:_id', function (req, res) {
  console.log("A get user request!");
  var id = req.params._id;
          app.use(express.static('C:/Users/Aiza/Desktop/New folder (3)/SProj'));
          res.sendFile(path.join(__dirname + '/HomePage.html'));
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
  file = req.body.user + '+' + req.body.FileName+
  '.txt';
  //console.log(file);
  var data = fs.readFileSync(file);
        data = data.toString();
        console.log(data);
        for(character = 0; character < data.length; character = character + BLOCK_SIZE) {
                var chunk = data.substring(character, character+ BLOCK_SIZE)
                file_chunks.push(chunk);
                console.log("chunk is" + chunk);
                hash = crypto.createHash('md5').update(chunk).digest('hex');
                console.log("checksum is" + hash);
                checksums.push(hash);
        }
     //   // console.log(req.body.checksums);
         //console.log(checksums);
        client_checksums = req.body.checksums;
        client_checksums = JSON.parse(client_checksums);
        client_checksums = client_checksums.split(',');
        for(i = 0; i < client_checksums.length; i++) {
                if(checksums[i] != client_checksums[i]) {
                      console.log (checksums[i]);
                      console.log(client_checksums[i]);
                      diff_blocks.push(i);
                      console.log(i);
                      checksums[i] = client_checksums[i]; 
                }
        }
        if(diff_blocks.length > 0) {
                 res.send("diff_blocks:" + diff_blocks.toString());
        }
        else {
                console.log("Content Unchanged");
                 res.send("checksums received");
        }
         checksums = [];
});

var server = app.listen(3000, function () {
var host = server.address().address;
var port = server.address().port;

console.log('Example app listening at http://%s:%s', host, port);
});