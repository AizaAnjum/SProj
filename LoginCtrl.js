app.controller("LoginCtrl",  ['$scope', '$http', '$location', '$window', '$cookieStore', LoginCtrl]);
var user_id = "";
function LoginCtrl($scope, $http, $location, $window, $cookieStore) {
			$scope.user = {};		
      $scope.myArray = [];
      var authenticated = false;
      var authenticated_user = "";
			$scope.Login = function() {
	   		console.log($scope.user.email);
	   		$http.post("/Login", $scope.user).success(function (data, status) {
	   				console.log(data);
            data = data.split(',');
	   				user_id = data[0];
	   				console.log(user_id);
            authenticated = true;
            authenticated_user = user_id;
            $cookieStore.put(user_id, $scope.user.email);
		   			$window.location.href = "http://localhost:3000/User/" + user_id;
            });
	   	}

function onInitFs(fs) {
  listFiles(fs);
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

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function TimeCtrl($scope, $timeout) {
    $scope.clock = "loading clock..."; // initialise the time variable
    $scope.tickInterval = 1000 //ms

    var tick = function() {
        $scope.clock = Date.now() // get the current time
        $timeout(tick, $scope.tickInterval); // reset the timer
    }

    // Start the timer
    $timeout(tick, $scope.tickInterval);
}

(function($) {
var url = $window.location.href;
url = url.toString().split('/');
console.log(url);
var id = url[4];
var Cookie = $cookieStore.get(id);
console.log(Cookie);
$scope.user.folders = "/MyFolders.html";
console.log($scope.user.folders);
url = 'http://localhost:1234/JSONP?id='+id+'/&callback=?';

$.ajax({
   type: 'GET',
    url: url,
    async: false,
    contentType: "application/json",
    dataType: 'json',
    success: function(json) {
       console.log(json);
       var files = json.files;
       var content = json.Content;
       for(i = 0; i < files.length; i++) {
        console.log(files[i]);
        console.log(str2ab(content[i]));
        var blob = new Blob([str2ab(content[i])]); // pass a useful mime type here
        var url = URL.createObjectURL(blob);
        console.log(url);
          var table = document.getElementById("myTable");
          if(table != null) {
            var row = table.insertRow(0);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var name = files[i];
            cell2.innerHTML = "<a download" + "=" + name +  "  href="  + url + ">" + name + "</a>";
          }
       }
    },
    error: function(e) {
       console.log(e.message);
    }
})
})(jQuery);

// $http.jsonp('http://localhost:1234/JSONP?callback').success(function (data) {
//    console.log("data" + data);
//  });
//}


function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

  // Call the reader.readEntries() until no more results are returned.

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
        //uploaded file being
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
        var url = URL.createObjectURL(blob);
        console.log($scope.file);
        var name =  $scope.file_name;
        var string = "<a download" + "=" + name +  "  href="  + url + ">" + name + "</a>";
        var table = document.getElementById("myTable");
          var row = table.insertRow(0);
          var cell1 = row.insertCell(0);
          var cell2 = row.insertCell(1);
          cell1.innerHTML = name;
          cell2.innerHTML = string;

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