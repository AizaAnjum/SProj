
app.controller("SignUpCtrl",  ['$scope', '$http', '$location', '$window',  SignUpCtrl]);
var user_id = "";
function SignUpCtrl($scope, $http, $location, $window) {
	$scope.user = {};
  $scope.user.cert = "";
	$scope.show_GoToLogin = false;
	var reader;

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


  function handleFileSelect(evt) {
    reader = new FileReader();
    reader.onerror = errorHandler;
    reader.onloadstart = function(e) {
    };
    reader.onload = function(e) {
      console.log(reader.result);
      $scope.user.cert = new Uint8Array(reader.result).toString();
       console.log($scope.user.cert);
    }

    // Read in the image file as Array Buffer
    reader.readAsArrayBuffer(evt.target.files[0]);
  }

    function handleFileSelect2(evt) {
    // Reset progress indicator on new file selection.
    reader = new FileReader();
    reader.onerror = errorHandler;
    reader.onloadstart = function(e) {
    };
    reader.onload = function(e) {
      console.log(reader.result);
      $scope.user.picture = new Uint8Array(reader.result).toString();
       console.log($scope.user.picture);
    }
    reader.readAsArrayBuffer(evt.target.files[0]);
  }


  var f1 = document.getElementById('file1');
  var f2 = document.getElementById('file2');

  if(f1 !== null && f2 !== null) {
    document.getElementById('file1').addEventListener('change', handleFileSelect, false);
    document.getElementById('file2').addEventListener('change', handleFileSelect2, false);
    console.log(f1);
    console.log(f2);
  }

    // $scope.upload_pic =  function () {
    //     console.log($scope.user.cert);
    //     console.log($scope.user.picture);
    // }
    $scope.Register = function () {
	   		console.log($scope.user);
        $scope.message = "";
	   		if($scope.user.password == $scope.user.confirm_password  && $scope.username != "" && $scope.user.cert != "" &&
          $scope.user.email != "") {
	   		$http.post("/new_user", $scope.user).success(function (data, status) {
	   			$scope.message = data;
	   			$scope.show_GoToLogin = true;
            });
	   		}
	   	  if($scope.user.password != $scope.user.confirm_password) {
	   			$scope.message = "Passwords do not Match. Please Re Enter.";
	   		}
        if($scope.user.cert == "") {
          $scope.message = $scope.message + "\n" + "Public Certificate is essential!";
        }
        if($scope.user.username == "") {
          $scope.message = $scope.message + "\n"  + "Please Enter a username";
        }
        if($scope.user.email == "") {
          $scope.message = $scope.message + "\n"  + "Please Enter an email id";
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