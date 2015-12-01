app.controller("LoginCtrl",  ['$scope', '$http', '$location', '$window',  LoginCtrl]);
var user_id = "";
function LoginCtrl($scope, $http, $location, $window) {
			$scope.user = {};		
      $scope.myArray = [];
      var authenticated = false;
      var authenticated_user = "";
			$scope.Login = function() {
	   		console.log($scope.user.email);
	   		$http.post("/Login", $scope.user).success(function (data, status) {
	   				console.log(data);
	   				user_id = data;
	   				console.log(user_id);
            authenticated = true;
            authenticated_user = user_id;
		   			$window.location.href = "http://localhost:3000/User/" + user_id;
            });
	   	}

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
}, function(e) {
console.log('Error', e);
});

function onInitFs(fs) {
  listFiles(fs);
}

// $http.post("/FILES", "dryfugih").success(function (data, status)  {

// });
function blobToFile(theBlob, fileName){
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
}

var BLOCK_SIZE = 31;
var file_chunks = [];
var checksums = [];
var different_blocks = [];
var key ='d6F3Efeq';
var total_hashes = 0;
var someBytes1 = 0;

function chunkString(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

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


function listFiles(fs) {
                var dirReader = fs.root.createReader();
                var entries = [];

                function fetchEntries() {
                    dirReader.readEntries(function (results) {
                      console.log(results.name);
                    }, errorHandler);
                };

                fetchEntries();
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
	  $scope.message = "";
    $scope.message1 = "";
    $scope.file_content;
    var tempppppp= [];
	//load file here, create checksums and make file chunks here in this function
      var url = $window.location.href;
      url = url.toString().split('/');
      // console.log(url);
      var id = url[4];
      var data = {
        ID: id
      }
      // console.log(data);
     $http.post("/FILES", data).success(function (data, status) {
            // console.log(data);
            for(files = 0; files < data.length; files++) {
            // console.log(files);
            var file_name = data[files].file_name;
            // console.log(file_name);
            var content = data[files].file_content.toString();
            var b = chunkString(content, 44);
            // console.log(b);
            var filetype = data[files].file_type;
            var decrypted_string = "";
            for(i = 0; i < b.length; i++) {
                decrypted_string = decrypted_string + decrypt(b[i], key);
                // console.log(decrypted_string);
                // console.log(b[i]);
            }
            // console.log(decrypted_string);
                          decrypted_string = decrypted_string.split(',');
                          console.log(decrypted_string);
                          var uint8Array  = new Uint8Array(decrypted_string);
                          var arrayBuffer = uint8Array.buffer;
                          var blob        = new File([arrayBuffer], filetype);
                          var urlCreator = window.URL || window.webkitURL; 
                          var dataurl = urlCreator.createObjectURL(blob);
                          tempppppp= {
                          display: file_name ,
                          URL : dataurl};
                          $scope.myArray.push(tempppppp);
                          // console.log( $scope.myArray);
                  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
                  window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
                  window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
              }, function(e) {
              console.log('Error', e);
              });
                  function onInitFs(fs) {
                  fs.root.getFile(file_name, {create:true}, function(fileEntry) {
                  fileEntry.createWriter(function(fileWriter) {
                  fileWriter.onwriteend = function(e) {
                    console.log('Write completed.');
                  };

                  fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString());
                  };
                  // Create a new Blob and write it to log.txt.
                    var uint8Array  = new Uint8Array(decrypted_string);
                          var arrayBuffer = uint8Array.buffer;
                          var blob        = new File([arrayBuffer], filetype);
                  console.log(blob);
                  fileWriter.write(blob);
            }, errorHandler);

         }, errorHandler);
        listFiles(fs);
      }
        }});
        $scope.get_from_server = function () {
        var my_checksums = [];
        var server_checksums = [];
        var my_file_chunks = [];
        var different_chunk_indices = [];
        var array = someBytes1;
        someBytes1 = someBytes1.toString();
        // console.log(someBytes1);
         var encrypted_content = encrypt(someBytes1);
        // console.log(someBytes1);
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

    $scope.upload =  function () {
      	var s = "";
        var url = $window.location.href;
        url = url.toString().split('/');
        console.log(url);
        var id = url[4];
        console.log($scope.file);
        var someBytes = new Uint8Array($scope.file).toString();
        console.log(someBytes);
        var done = false;
        for(i = 0; i < someBytes.length; i = i + BLOCK_SIZE) {
          console.log(i);
          console.log(someBytes.length);
            var chunk = someBytes.substring(i, i+ BLOCK_SIZE)
            var enc = encrypt(chunk, key);
            console.log(enc);
            file_chunks.push(enc);
            hash = CryptoJS.MD5(enc);
            checksums.push(hash);
            s = s + enc;
            if(i >= someBytes.length-1) {
              done = true;
            }
        }
      console.log(s);
      done = true;
      if(done == true) {
          console.log($scope.user);
          var filename = $scope.file_name;
          console.log(s);
          var data = {
               Owner: id,
               FileName : filename.toString(),
               Size : $scope.file_size,
               Type : $scope.file_type,
               Content   : s
          }
          console.log(data);
        $http.post("/upload", data).success(function (data, status) {
        console.log("File uploaded success");
        var blob = new File([$scope.file],$scope.file.file_type);
        console.log($scope.file);
   //     fileWriter.write(blob);
        var urlCreator = window.URL || window.webkitURL; 
        var dataurl = urlCreator.createObjectURL(blob);
        tempppppp= {
        display: $scope.file_name ,
        URL : dataurl};
        $scope.myArray.push(tempppppp);
        console.log($scope.myArray[$scope.myArray.length-1]);
          function onInitFs(fs) {
  fs.root.getFile($scope.file_name, {create: true}, function(fileEntry) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function(fileWriter) {

      fileWriter.onwriteend = function(e) {
        console.log('Write completed.');
      };

      fileWriter.onerror = function(e) {
        console.log('Write failed: ' + e.toString());
      };
        var blob = new File([$scope.file],$scope.file.file_type);
        console.log($scope.file);
        fileWriter.write(blob);
    }, errorHandler);

  }, errorHandler);

}

window.requestFileSystem(window.PERSISTENT, 1024*1024, onInitFs, errorHandler);
        });
     }
    }

    
    $scope.sync  = function () {
        var s = "";
        checksums = [];
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
        console.log(checksums.toString());
        $scope.message  = file_chunks;
        var url = $window.location.href.toString();
        url = url.toString().split('/');
        var user = url[4];
    	var data = {
    		checksums: JSON.stringify(checksums.toString()),
        FileName: $scope.file_name,
        user : user
    	};
        total_hashes = checksums.length;
        checksums = [];
    	$http.post("/sync", data).success(function (data, status) {
        checksums = [];
    	$scope.message  = "Hashes Sent  Successfully: " +  total_hashes + " hash(es) sent to server";
        var send_these_blocks = [];
        var indices = [];
       if(data.indexOf("diff_blocks:") > -1) {
                    var string = data.substring(12);
                    indices = string.split(',');
                    console.log(indices);
                    for(index = 0; index < indices.length; index++) {
                            var block_to_send = parseInt(indices[index]);
                            var chunk = file_chunks[block_to_send];
                            send_these_blocks.push(chunk)
                        }
                    console.log(send_these_blocks);
                    var data = {
                        different_blocks: JSON.stringify(send_these_blocks.toString()),
                        file: $scope.file_name
                    };
                    $http.post("/diff_blocks", data).success(function (data, status) {
                        $scope.message  = "File Synced Successfully: " +  send_these_blocks.length + " block(s) sent to server";    
                    });
                    send_these_blocks = [];
                    indices = [];
                }
            });
    	}
    };
  LoginCtrl.$inject = ['$scope', '$http', '$location'];