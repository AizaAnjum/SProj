
var express = require('express');
var app = express();
var fs = require('fs');
var crypto = require('crypto');
var router = express.Router();  
var BLOCK_SIZE = 44;
var file_chunks = [];
var checksums = [];
var diff_blocks = [];
var data = fs.readFileSync('encrypted.dat');
var body_parser = require('body-parser');
var mongojs = require('mongojs');
var ObjectID = require('mongodb').ObjectID;
var db  =  mongojs('Users', ['Users']);
var db_Files = mongojs('Files', ['Files']);
data = data.toString();
console.log(data);



for(character = 0; character < data.length; character = character + BLOCK_SIZE) {
                var chunk = data.substring(character, character+ BLOCK_SIZE)
                file_chunks.push(chunk);
                hash = crypto.createHash('md5').update(chunk).digest('hex');
                checksums.push(hash);
        }
  console.log("hash"  + checksums)
  app.use(express.static('C:/Users/Aiza/Desktop/New folder (3)'));
  app.use(body_parser.json());




app.get('/index.html', function (req, res) {
});






app.get('/users/:_id', function (req, res) {
  console.log("A get user request!");
  var id = req.params._id;
  var all_files = "";
  db.Users.findOne({"_id" : ObjectID(id)}, {"Owned_Files": 1}, function (err, docs) {           //user with user id specified in parameters
       docs = JSON.stringify(docs);
       console.log(JSON.parse(docs).Owned_Files);
       var file_array = JSON.parse(docs).Owned_Files.toString().split(',');

       //iterate over each file and add to all_files string to show on the webpage
       for(i = 0; i < file_array.length; i++) {
        db_Files.Files.findOne({"_id" : ObjectID(file_array[i])}, function (err, docs) {
            docs = JSON.stringify(docs);
            all_files = all_files + "FileName:         " + JSON.parse(docs).Name.toString() + "            "  + JSON.parse(docs).Content.toString() + " \n";  
            res.send(all_files);
          })
        }
        // console.log(all_files);

       });
  console.log('test'); // <
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
    console.log(req.body.different_blocks);
    var replace_blocks = req.body.different_blocks;
    replace_blocks  =  JSON.parse(replace_blocks);
    replace_blocks = replace_blocks.split(',');
    if(replace_blocks.length > 0 ) {
                for(i = 0; i < replace_blocks.length; i++) {
                              index_to_replace = diff_blocks[i];
                              file_chunks[index_to_replace] = replace_blocks[i];
                              var buf = new Buffer(replace_blocks[i]);
                              console.log("writing: " + replace_blocks[i])
                              console.log("on index" + index_to_replace)
                              var foo = fs.openSync('encrypted.dat','r+');
                              fs.writeSync(foo, buf, 0, buf.length, index_to_replace*BLOCK_SIZE);
                              console.log("content changed")
                              diff_blocks = [];
                }
    }
  console.log(file_chunks);
});

app.post('/sync', function (req, res) {
        console.log(req.body.checksums);
        client_checksums = req.body.checksums;
        client_checksums = JSON.parse(client_checksums);
        client_checksums = client_checksums.split(',');
    //    client_checksums.splice(0,1);
        console.log(client_checksums);
        for(i = 0; i < client_checksums.length; i++) {
                if(checksums[i] != client_checksums[i]) {
                      console.log (checksums[i]);
                      console.log(client_checksums[i]);
                      diff_blocks.push(i);
                      checksums[i] = client_checksums[i]; 
                }
        }
        if(diff_blocks.length > 0) {
                 res.send("diff_blocks:" + diff_blocks.toString());
        }
        else {
                 res.send("checksums received");
        }
});

var server = app.listen(3000, function () {
var host = server.address().address;
var port = server.address().port;

console.log('Example app listening at http://%s:%s', host, port);
});