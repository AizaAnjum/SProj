var BLOCK_SIZE = 31;
var file_chunks = [];
var checksums = [];
var different_blocks = [];
var key ='d6F3Efeq';
var total_hashes = 0;
var someBytes1 = 0;
function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
  window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
}, function(e) {
  console.log('Error', e);
});

function onInitFs(fs) {

    fs.root.getFile('Hello.txt', {}, function(fileEntry) {
    fileEntry.file(function(file) {
       var reader = new FileReader();
       reader.onloadend = function(e) {
         someBytes1 = new Uint8Array(this.result);
         console.log(someBytes1);
       };

       reader.readAsArrayBuffer(file);
    }, errorHandler);

  }, errorHandler);
}
window.requestFileSystem(window.PERSISTENT, 5*1024*1024 /*5MB*/, onInitFs, errorHandler);

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
	$scope.load = function() {}; 


    $scope.get_from_server = function () {
//        var someBytes1 = 
        var my_checksums = [];
        var server_checksums = [];
        var my_file_chunks = [];
        var different_chunk_indices = [];
        var array = someBytes1;
        someBytes1 = someBytes1.toString();
        console.log(someBytes1);
         var encrypted_content = encrypt(someBytes1);
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
                console.log(data);
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
                        console.log(data);
                        var dec = "";
                        var temp = array.toString();
                        console.log(temp);
                        var temp0 = "";
                        if(data.length > 0) {
                            for(i = 0; i < data.length; i++) {
                                    var ind = parseInt(different_chunk_indices[i]);
                                    my_file_chunks[ind] = data[i];
                                    console.log(data[i]);
                                    var decrypted = decrypt(data[i], key);
                                    dec = dec + decrypted;
                                    temp0 = temp.substring(0,  ind*BLOCK_SIZE);
                                    temp2 = temp.substring(ind*BLOCK_SIZE + BLOCK_SIZE, someBytes1.length)
                                    temp = temp0+dec+temp2;
                             //       someBytes1 = Uint8Array.from(someBytes1);
                                   }
                                   for (i = 0; i < temp.length; i++) {
                                    array[i] = temp[i];
                                   }
                                   console.log(array);


                        $scope.message1 = "Content changed to: " + someBytes1;
                        }
                 });
            }

        });
    };
    $scope.sync  = function () {
        var s = "";
        var someBytes = new Uint8Array($scope.file).toString();
        console.log(someBytes);
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