var BLOCK_SIZE = 31;
var file_chunks = [];
var checksums = [];
var different_blocks = [];
var key ='d6F3Efeq';
var total_hashes = 0;
var someBytes1 = "ABCDEFGHIJKLMNOPQRSTUVWXtZabcdefghijklmnopqrstuywxyz1234567891k151010101101010";
function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}

 function ab2str(buf) {
   var s = String.fromCharCode.apply(null, new Uint8Array(buf));
   return decode_utf8(decode_utf8(s))
 }

function str2ab(str) {
   var s = encode_utf8(str)
   var buf = new ArrayBuffer(s.length); 
   var bufView = new Uint8Array(buf);
   for (var i=0, strLen=s.length; i<strLen; i++) {
     bufView[i] = s.charCodeAt(i);
   }
   return bufView;
 }

function encrypt(message, key) {
                var keyHex = CryptoJS.enc.Utf8.parse(key);
                var encrypted = CryptoJS.AES.encrypt(message, keyHex, {
                mode: CryptoJS.mode.ECB,
                  });
         return (encrypted.toString());
        }

function decrypt(ciphertext, key) {
    var keyHex = CryptoJS.enc.Utf8.parse(key);
    var decrypted = CryptoJS.AES.decrypt({
        ciphertext: CryptoJS.enc.Base64.parse(ciphertext)
    }, keyHex, {
        mode: CryptoJS.mode.ECB,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}


app.controller("myEncryptionCtrl", function($scope, $http) {
	$scope.message = "";
    $scope.message1 = "";
    $scope.file_content;
	//load file here, create checksums and make file chunks here in this function
	$scope.load = function() {
	}; 


    $scope.get_from_server = function () {
        var encrypted_content = encrypt(someBytes1);
        var my_checksums = [];
        var server_checksums = [];
        var my_file_chunks = [];
        var different_chunk_indices = [];
        $scope.message  = "Initial Content: " + someBytes1;
        console.log(someBytes1);
        if(my_checksums.length < 1) {
            for(i = 0; i < someBytes1.length; i = i + BLOCK_SIZE) {
             var chunk = someBytes1.substring(i, i+ BLOCK_SIZE)
             var enc = encrypt(chunk, key);
             my_file_chunks.push(enc);
             hash = CryptoJS.MD5(enc);
             my_checksums.push(hash);
             console.log(my_checksums.toString());
        }}
                var data = {
            Message: "Send_Me_Checksums"
        };
        $http.post("/get_checksums", data).success(function (data, status) {
               console.log(data);
                data = data.checksums;
                data = JSON.parse(data);
                server_checksums = data.toString().split(',');
               console.log(data.checksums);
               for(i = 0; i < server_checksums.length; i++) {
                    if(my_checksums[i] != server_checksums[i]) {
                        different_chunk_indices.push(i);
                        console.log(my_checksums[i].toString());
                        console.log(server_checksums[i]);
                    }
               }
        
            if(different_chunk_indices.length > 0) {
                console.log(different_chunk_indices);
                var data = {
                    block_number: JSON.stringify(different_chunk_indices.toString())
                }
                 $http.post("/get_blocks", data).success(function (data, status) {
                        data = data.toString().split(',');
                        if(data.length > 0) {
                            for(i = 0; i < data.length; i++) {
                                    var ind = parseInt(different_chunk_indices[i]);
                                    my_file_chunks[ind] = data[i];
                                    console.log(data[i]);
                                    var decrypted = decrypt(data[i], key);
                                    console.log(decrypted);
                                    temp0 = someBytes1.substring(0,  ind*BLOCK_SIZE);
                                    temp2 = someBytes1.substring(ind*BLOCK_SIZE + BLOCK_SIZE, someBytes1.length);
                                    someBytes1 = temp0 + decrypted + temp2;

                            }
                        $scope.message1 = "Content changed to: " + someBytes1;
                        }
                 });
            }

        });
    };
    $scope.sync  = function () {
                var s = "";

        var data = {contents: new Uint8Array($scope.file).toString()};
        console.log(data);
        var dataView = new DataView($scope.file);
        console.log(new Uint8Array( $scope.file));
       $http.post("/checking", data).success(function (data, status) {})
        var someBytes = $scope.file;
        for(i = 0; i < someBytes.length; i = i + BLOCK_SIZE) {
            var chunk = someBytes.substring(i, i+ BLOCK_SIZE)
            var enc = encrypt(chunk, key);
            console.log(enc);
            file_chunks.push(enc);
            hash = CryptoJS.MD5(enc);
            checksums.push(hash);
            s = s + enc;
        }
        console.log(s);
        $scope.message  = file_chunks;
    	var data = {
    		checksums: JSON.stringify(checksums.toString())
    	};
        total_hashes = checksums.length;
        checksums = [];
    	$http.post("/sync", data).success(function (data, status) {
    	$scope.message  = "Hashes Sent  Successfully: " +  total_hashes + " hash(es) sent to server";
        var send_these_blocks = [];
        var indices = [];
       if(data.indexOf("diff_blocks:") > -1) {
                    var string = data.substring(12);
                    indices = string.split(',');
                    for(index = 0; index < indices.length; index++) {
                            var block_to_send = parseInt(indices[index]);
                            var chunk = file_chunks[block_to_send];
                            send_these_blocks.push(chunk)
                        }
                    console.log(send_these_blocks);
                    var data = {
                        different_blocks: JSON.stringify(send_these_blocks.toString())
                    };
                    $http.post("/diff_blocks", data).success(function (data, status) {
                        $scope.message  = "File Synced Successfully: " +  send_these_blocks.length + " block(s) sent to server";    
                    });
                }
            });
    	}
});


//

