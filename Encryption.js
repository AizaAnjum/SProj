var fs = require('fs')
var crypto = require('crypto'),
    algorithm = 'aes-128-ecb',
    password = 'd6F3Efeq';
var enc = "";
var BLOCK_SIZE = 31;

function toHex(str) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return hex;
}
 


function encrypt(text){
  var cipher = crypto.createCipher(algorithm,toHex(password))
  var crypted = cipher.update(text,'utf8','base64')
  crypted += cipher.final('base64');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'base64','utf8')
  dec += decipher.final('utf8');
  return dec;
}
 
	fs.readFile('C:/Users/Aiza/Desktop/Client1/File1.txt', function (err, data) {
		console.log(toHex(password));
		if(err) {
			console.log(err)
		}

		data = data.toString();
		 for(i = 0; i < data.length; i = i + BLOCK_SIZE) {
		 	var chunk = data.substring(i, i+ BLOCK_SIZE)
		 	console.log(chunk);
		 	enc = enc + encrypt(chunk);
		 	console.log("encrypted chunk" + enc);
		 }
		     fs.writeFileSync('C:/Users/Aiza/Desktop/New folder (3)/encrypted.dat', enc);
	});

