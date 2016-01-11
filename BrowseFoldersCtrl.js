app.controller("BrowseFoldersCtrl",  ['$scope', '$http', '$location', '$window', '$cookieStore', BrowseFoldersCtrl]);
var user_id = "";
function BrowseFoldersCtrl($scope, $http, $location, $window, $cookieStore) {
      $scope.folder = {};     
      var url = $window.location.href;
      url = url.toString().split('/');
      console.log(url);
      var user_id = url[4];
      var folder_id = url[5];
        var reader;
    var progress = document.getElementById("animated_progress");
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
      $scope.folder.file = reader.result;
      //setTimeout("document.getElementById('animated_progress').className='';", 2000);
    }

    // Read in the image file as a binary string.
    reader.readAsArrayBuffer(evt.target.files[0]);
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
      //ASK LOCAL FILES FOR EXISTING FILES AND DISPLAY THEM 
       // $http.post("/GetFolders", data).success(function (data, status) {
       //  });
    };
    BrowseFoldersCtrl.$inject = ['$scope', '$http', '$location'];