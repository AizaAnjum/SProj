var forge = require('node-forge');

var key = forge.random.getBytesSync(16);
var fs = require('fs')
var iv = forge.random.getBytesSync(16);

fs.writeFileSync('C:/Users/Aiza/Desktop/Client/dec_key.txt', key)
fs.writeFileSync('C:/Users/Aiza/Desktop/Client/dec_iv.txt', iv)
var final_encryption = "";
fs.readFile('C:/Users/Aiza/Desktop/Client/File1.txt', function (err, data) {
	var someBytes = data.toString();
	for(i = 0; i < someBytes.length; i = i + 10) {
				var cipher = forge.cipher.createCipher('AES-ECB', key);
				cipher.start({iv: iv});
				var chunk = someBytes.substring(i, i+ 10)
				cipher.update(forge.util.createBuffer(chunk));
				cipher.finish();
				var encrypted = cipher.output;
				console.log(encrypted.toHex());

				final_encryption = final_encryption + encrypted.toHex();
				var decipher = forge.cipher.createDecipher('AES-ECB', key);
				decipher.start({iv: iv });
				decipher.update(encrypted);
				decipher.finish();
				console.log(decipher.output.toString());
	}

	// outputs decrypted hex
	console.log(decipher.output.toString());
	console.log(final_encryption);

    fs.writeFileSync('C:/Users/Aiza/Desktop/chat example/encrypted.dat', final_encryption);
		if(err) {
			console.log(err);
		}
})
