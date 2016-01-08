app.controller("SignUpCtrl",  ['$scope', '$http', '$location', '$window',  SignUpCtrl]);
var user_id = "";
function SignUpCtrl($scope, $http, $location, $window) {
	$scope.user = {};
	$scope.show_GoToLogin = false;
	var reader;
    var progress = document.querySelector('.percent');

  // function abortRead() {
  //   reader.abort();
  // }

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
    if (evt.lengthComputable) {
      var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
      // Increase the progress bar length.
      if (percentLoaded < 100) {
        progress.style.width = percentLoaded + '%';
        progress.textContent = percentLoaded + '%';
      }
    }
  }

  function handleFileSelect(evt) {
    // Reset progress indicator on new file selection.
    progress.style.width = '0%';
    progress.textContent = '0%';

    reader = new FileReader();
    reader.onerror = errorHandler;
    reader.onprogress = updateProgress;
    reader.onabort = function(e) {
      alert('File read cancelled');
    };
    reader.onloadstart = function(e) {
      document.getElementById('progress_bar').className = 'loading';
    };
    reader.onload = function(e) {
      // Ensure that the progress bar displays 100% at the end.
      progress.style.width = '100%';
      progress.textContent = '100%';
      console.log(reader.result);
      $scope.user.cert = reader.result;
      setTimeout("document.getElementById('progress_bar').className='';", 2000);
    }

    // Read in the image file as a binary string.
    reader.readAsBinaryString(evt.target.files[0]);
  }
    function handleFileSelect2(evt) {
    // Reset progress indicator on new file selection.
    progress.style.width = '0%';
    progress.textContent = '0%';

    reader = new FileReader();
    reader.onerror = errorHandler;
    reader.onprogress = updateProgress;
    reader.onabort = function(e) {
      alert('File read cancelled');
    };
    reader.onloadstart = function(e) {
      document.getElementById('progress_bar').className = 'loading';
    };
    reader.onload = function(e) {
      // Ensure that the progress bar displays 100% at the end.
      progress.style.width = '100%';
      progress.textContent = '100%';
      console.log(reader.result);
      $scope.user.picture = reader.result;
      setTimeout("document.getElementById('progress_bar').className='';", 2000);
    }

    // Read in the image file as a binary string.
    reader.readAsBinaryString(evt.target.files[0]);
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
  document.getElementById('file2').addEventListener('change', handleFileSelect2, false);
    // $scope.upload_pic =  function () {
    //     console.log($scope.user.cert);
    //     console.log($scope.user.picture);
    // }
    $scope.Register = function () {
	   		console.log($scope.user.cert);
	   		if($scope.user.password == $scope.user.confirm_password) {
	   		$http.post("/new_user", $scope.user).success(function (data, status) {
	   			$scope.message = data;
	   			$scope.show_GoToLogin = true;
            });
	   		}
	   		else {
	   			$scope.message = "Passwords do not Match. Please Re Enter";
	   		}
    	};
    };
    SignUpCtrl.$inject = ['$scope', '$http', '$location'];


// app.controller("SignUpCtrl",  function ($scope, $http) {
// 	$scope.user = {};
// 	$scope.show_GoToLogin = false;
// 		// $scope.username = "vdfvdfvdfvd";
// 	   $scope.upload_pic =  function () {
// 	   		console.log($scope.file);
// 	   };
// });