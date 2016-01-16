app.controller("BrowseFoldersCtrl",  ['$scope', '$http', '$location', '$window', '$cookieStore', BrowseFoldersCtrl]);
var user_id = "";
function BrowseFoldersCtrl($scope, $http, $location, $window, $cookieStore) {
      $scope.folder = {};     
      var BLOCK_SIZE = 31;
      var key ='d6F3Efeq';
      var file_chunks = [];
      var checksums = [];
      var different_blocks = [];
      var url = $window.location.href;
      url = url.toString().split('/');
      console.log(url);
      var user_id = url[4];
      var folder_id = url[5];
       $scope.folder.folder_id = folder_id;
       $scope.folder.user_id = user_id;
      var navbar = document.getElementById("URLS");
      var home = "/User/"+ user_id;
      var folders = "/Folders/" + user_id;
      navbar.innerHTML = "<li id = 'Home'><a href=" + home + ">Home</a></li>" + 
          "<li id = 'Profile'>" + "<a href='#'>Profile</a></li>" +
          "<li class='active'>" + "<a href="+folders+">My Folders</a></li>" + 
          "<li><a href='#'>" + "Shared Folders</a></li>" +
          "<li><a href = '/Index.html'>" + "Logout </a> </li>";
      var data = {
        ID: folder_id
      }
      $http.post("/GetFolderName", data).success(function (data, status) {
          console.log(data[0].FolderName);
           $scope.folder.FolderName = data[0].FolderName;
      });
      var reader;
      var progress = document.getElementById("animated_progress");

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

  function errorHandler(evt) {
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert('An error occurred reading this file.');
    };
  }

  function updateProgress(evt) {
    // evt is an ProgressEvent.
    var progress = document.getElementById("progbar");
    if (evt.lengthComputable) {
      var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
      // Increase the progress bar length.
      if (percentLoaded < 100) {
       progress.innerHTML = "<div id = 'animated_progress'" +
        "class='progress-bar progress-bar-striped active'" +
         "role='progressbar' aria-valuenow= + "+percentLoaded+" +"+  
         "aria-valuemin='0' aria-valuemax='100'"+ 
         "style='width:" + percentLoaded + "%'>"+
          "<div class='percent'>"+
        percentLoaded+"%"+
      "</div>"
    "</div>";
      }
    }
  }

  function handleFileSelect(evt) {
    // Reset progress indicator on new file selection.
    var progress = document.getElementById("progbar");
     progress.innerHTML = "<div id = 'animated_progress'" +
        "class='progress-bar progress-bar-striped active'" +
         "role='progressbar' aria-valuenow= + "+0+" +"+  
         "aria-valuemin='0' aria-valuemax='100'"+ 
         "style='width:" + 0 + "%'>"+
          "<div class='percent'>"+
        0+"%"+
      "</div>"
    "</div>";

    reader = new FileReader();
    reader.onerror = errorHandler;
    reader.onprogress = updateProgress;
    reader.onabort = function(e) {
      alert('File read cancelled');
    };
    reader.onloadstart = function(e) {
     // document.getElementById('animated_progress').className = 'loading';
    };
    reader.onload = function(e) {
      // Ensure that the progress bar displays 100% at the end.
     var progress = document.getElementById("progbar");
     progress.innerHTML = "<div id = 'animated_progress'" +
        "class='progress-bar progress-bar-striped active'" +
         "role='progressbar' aria-valuenow= + "+100+" +"+  
         "aria-valuemin='0' aria-valuemax='100'"+ 
         "style='width:" + 100 + "%'>"+
          "<div class='percent'>"+
        100+"%"+
      "</div>"
    "</div>";
      console.log(reader.result);
      console.log(reader.name);
      $scope.folder.file = reader.result;
      //setTimeout("document.getElementById('animated_progress').className='';", 2000);
    }

    // Read in the image file as a binary string.
    $scope.folder.file_name = evt.target.files[0].name;
    $scope.folder.file_type = evt.target.files[0].type;
    $scope.folder.file_size = evt.target.files[0].size;
    reader.readAsArrayBuffer(evt.target.files[0]);
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
      //ASK LOCAL FILES FOR EXISTING FILES AND DISPLAY THEM 
       // $http.post("/GetFolders", data).success(function (data, status) {
       //  });

    $scope.Share = function() {
      console.log($scope.folder.ShareWith);
      var data = {
        User_ID: user_id,
        Folder_ID: folder_id,
        Users: $scope.folder.ShareWith
      }
        $http.post("/ShareFolder", data).success(function (data, status) {
        console.log("data");
      });
      //SEND FOLDER SHARE REQUEST TO SERVER

    }

    $scope.Upload = function() {
        var progress = document.getElementById("progbar");
         progress.innerHTML = "<div id = 'animated_progress'" +
            "class='progress-bar progress-bar-striped active'" +
             "role='progressbar' aria-valuenow= + "+0+" +"+  
             "aria-valuemin='0' aria-valuemax='100'"+ 
             "style='width:" + 0 + "%'>"+
              "<div class='percent'>"+
            0+"%"+
          "</div>"
        "</div>";
        console.log($scope.folder.file);
          var s = "";
        var someBytes = new Uint8Array($scope.folder.file).toString();
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
      console.log("trrrrrrrrrrrrrrrrrrruuuueeeee");
      done = true;
      if(done == true) {
          var filename = $scope.folder.file_name;
          console.log(filename);
          var size = $scope.folder.file_size;
          console.log(size);
          var type = $scope.folder.file_type;
          console.log(type);
          var foldername = $scope.folder.FolderName;

          var data = {
               Owner: user_id,
               FolderName: foldername,
               Folder: folder_id,
               FileName : filename.toString(),
               Size : size,
               Type : type,
               Content   : s
          }
          console.log(data);
        $http.post("/UploadToFolder", data).success(function (data, status) {
          console.log("File uploaded success");
          var blob = new File([$scope.folder.file],$scope.folder.file_type);
          var url = URL.createObjectURL(blob);
          console.log(url);
          console.log($scope.folder.file);
          var name =  $scope.folder.file_name;
          var string = "<a download" + "=" + name +  "  href="  + url + ">";
          var table = document.getElementById("ListFiles");
            var s = table.innerHTML;
            var temp = "<div class = 'col-xs-2 col-lg-2'>"+
            "<div>"+ string + "<img class = 'group-list-group-image' src = '/Folder-icon.png' style = 'width:50px; height:50px'/></a>"
            + "<h4 class= 'group inner list-group-item-heading'>"+ name + "</h4>" +
            "</div>"+
            "</div>";
            s = s + temp;
          table.innerHTML = s;
            });
       }
      }
    };
    BrowseFoldersCtrl.$inject = ['$scope', '$http', '$location'];