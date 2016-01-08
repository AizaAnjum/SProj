//CLIENT SIDE EXECUTABLE NODE JS FILE
var fs = require('fs');
var content = [];
var files = [];
var USER_ID = "";
var http = require('http');
var path = require('path');
const PORT = 1234;
var request = require("request");
var querystring = require('querystring');
var crypto = require('crypto'),
    algorithm = 'aes-128-ecb',
    password = 'd6F3Efeq';
var enc = "";
var BLOCK_SIZE = 31;
var ENCRYPTED_BLOCK_SIZE = 44;
var encrypted_files = [];
function toHex(str) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}


function get_checksums(file) {
        var data = file;
        var checksums = [];
      //  console.log(data);
        for(character = 0; character < data.length; character = character + ENCRYPTED_BLOCK_SIZE) {
                var chunk = data.substring(character, character + ENCRYPTED_BLOCK_SIZE)
                var hash = crypto.createHash('md5').update(chunk).digest('hex');
              //  console.log("checksum is" + hash);
                checksums.push(hash);
        }
        return checksums;
}

function get_rolling_checksums(file) {
          var block = 0;
          var data = file;
          var rolling_checksums = [];
          var rolling_checksum = 0;
           for(character = 0; character < data.length; character = character + 1) {
             rolling_checksum = rolling_checksum + data[character].charCodeAt(0);
             block ++;
             if(block == ENCRYPTED_BLOCK_SIZE-1 || character == data.length - 1) {
              rolling_checksums.push(rolling_checksum);
              block = 0;
             }
          }
      return rolling_checksums;
}


function get_different_blocks (filename, block_array) {
  var blocks = [];
  for(i = 0;i < encrypted_files.length; i++) {
    var file = encrypted_files[i].Filename;
    if(file == filename) {
      var content = encrypted_files[i].encrypted_content;
      var parts = content.match(/[\s\S]{1,44}/g) || [];
      for(different = 0; different < block_array.length; different++) {
        var index = block_array[different];
        blocks.push(parts[index])
      }
        return blocks;
    }
  }
 // console.log(blocks);
  return blocks;
}
function encrypt(text){
  var password ='d6F3Efeq';
  var cipher = crypto.createCipher(algorithm,toHex(password))
  var crypted = cipher.update(text,'utf8','base64')
  crypted += cipher.final('base64');
  return crypted;
}
 
function decrypt(text){
  var password ='d6F3Efeq';
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'base64','utf8')
  dec += decipher.final('utf8');
  return dec;
}


//GET COMMAND LINE ARGS HERE (USERNAME AND PASSWORD)
var username = process.argv[2];
var password = process.argv[3];



//READ DIRECTORY CONTENT
var dirString = path.dirname(fs.realpathSync(__filename));

// output example: "/Users/jb/workspace/abtest"
console.log('directory to start walking...', dirString)

//READ FILES IN DIRECTORY AND STORE CONTENT
//add this in a promise and
function get_all_files() {
return new Promise( 
  function (resolve, reject) {
          fs.readdir(dirString, function(err, files) {
               if (err) {
                 console.log(err);
                 reject("error");
               }
                resolve(files);
            });
          }
  );
}

get_all_files().then(
function(data) {
                    var size = [];
                    console.log(data);
                    data.forEach(function(f) {
                    console.log(f);
                    files.push(f);
                    var stats = fs.statSync(f);
                    size.push(stats["size"]);
                    content.push(fs.readFileSync(f).toString());
                });
                  //ENCRYPT FILES HERE 
                          console.log("files read");
            for(file = 0; file < files.length; file++) {
               // console.log(file);
                var filename = files[file];
                var filesize = size[file];
                var data_to_encrypt  = content[file].toString();
                var enc = "";
             //   console.log("excuse me");
                 for(i = 0; i < data_to_encrypt.length; i = i + BLOCK_SIZE) {
                    var chunk = data_to_encrypt.substring(i, i+ BLOCK_SIZE);
                    enc = enc + encrypt(chunk);
                    //console.log("encrypted chunk" + enc);
                 }
                 var checksums = get_checksums(enc);
                 var rolling_checksums = get_rolling_checksums(enc);
                 console.log(filename);
                 console.log(rolling_checksums);
                 //encrypted files object contains all the files & their details
                 encrypted_files.push({Filename: filename, encrypted_content : enc, filesize: filesize, checksums: checksums, rolling_checksums: rolling_checksums});
            }
           

     //SEND LOGIN REQUEST AND CREDENTIALS TO MAIN SERVER SO THAT SERVER KNOWS WHO YOU ARE
         var login_function = function() {
          return new Promise ( 
          function (resolve, reject) {
          var data ={
                email: username,
                password: username
              };

          data = JSON.stringify(data);

          var options = {
              host: '',
              port: 3000,
              path: '/Login',
              method: 'POST',
              headers: {
                  'Content-Type': "application/json",
                  'Content-Length': Buffer.byteLength(data)
              }
          };

          var req = http.request(options, function(res) {
              res.setEncoding('utf8');
              res.on('data', function (chunk) {


                //GET USER ID
                  USER_ID = chunk;
                  resolve(USER_ID);
              });
          });

          req.write(data);
          req.end();
            }
          )
        }

        //SEND ENCRYPTED FILES TO SERVER IF FILES DONT EXIST ALREADY, SERVER WILL ADD THEM TO ITS DATABASE
        login_function().then(
          function (data) {
        console.log("user_id     " + USER_ID);
        var data = {
          _id : USER_ID,
          files : encrypted_files
        }
        data = JSON.stringify(data);
        var options = {
              host: '',
              port: 3000,
              path: '/Files',
              method: 'POST',
              headers: {
                  'Content-Type': "application/json",
                   'Content-Length': Buffer.byteLength(data)
              }
          };
          var req = http.request(options, function(res) {
              res.setEncoding('utf8');

              res.on('data', function (chunk) {
                //FOR EXISTING FILES(OWNED), GET CHECKSUMS FOR SERVER AND SYNC THEM TO SERVER(INCORPORATE CHANGES)
                
                //SEND YOUR USER ID AND YOUR FILE DETAILS TO SERVER (INCLUDING YOUR VERSION OF CHECKSUMS)
                  var data = {
                    _id : USER_ID,
                    files : encrypted_files
                  }
                    data = JSON.stringify(data);
                          var options = {
                          host: '',
                          port: 3000,
                          path: '/sync',
                          method: 'POST',
                          headers: {
                              'Content-Type': "application/json",
                               'Content-Length': Buffer.byteLength(data)
                          }
                   };

                  //FOR EXISTING FILES(OWNED), GET CHECKSUMS FOR SERVER AND SYNC THEM TO SERVER(INCORPORATE CHANGES)
                  var req = http.request(options, function (res) {
                       var sync_to_server = [];
                      res.on('data', function (chunk) {
                            var file_data = chunk.toString();
                            var different_blocks = JSON.parse(file_data).BLOCKS_TO_SYNC;
                            for(i = 0 ; i < different_blocks.length; i++) {
                              var set = different_blocks[i];
                              var diff = get_different_blocks(set.Filename, set.Different_blocks);
                              var changes = {file: set.Filename, Updated_Blocks: diff, Block_Numbers: set.Different_blocks, Owner: set.Owner};
                              sync_to_server.push(changes);
                              console.log("done");
                            }

                            var data = {
                              Updated_Blocks: sync_to_server
                            }

                            data = JSON.stringify(data);
                            var options = {
                              host: '',
                              port: 3000,
                              path: '/Update_Content',
                              method: 'POST',
                              headers: {
                                   'Content-Type': "application/json",
                                   'Content-Length': Buffer.byteLength(data)
                                }
                             };

                             var req = http.request(options, function (res) {
                              res.on('data', function (chunk) {
                                 console.log(chunk.toString());
                              });
                             });
                             req.write(data);
                             req.end();

                      });
                   });
                   req.write(data);
                   req.end();
              });
          });
          req.write(data);
          req.end();

            }
          )

    }
);





//FOR EXISTING FILES(SHARED), SYNC BASED ON LAST MODIFIED








//KEEP LISTENING TO REQUESTS FROM SERVER IF FILE TO BE SYNCED (IF SERVER HAS A DIFF, MORE MODIFIED FILE)
var express = require('express');
var app = express();
var router = express.Router();  
var body_parser = require('body-parser');
app.use(express.static(path.join(__dirname, '/')));
app.use(body_parser.json({limit: '50mb'}));
app.set('jsonp callback name', 'callback');
app.get('/JSONP', function (req, res) {
  console.log(req.url);
  console.log("hello");
  var obj = {
    'files': files,
    'Content': content
  }
  res.jsonp(obj);
});

var server = app.listen(PORT, function () {
var host = server.address().address;
var port = server.address().port;
console.log('Example app listening at http://%s:%s', host, port);
});