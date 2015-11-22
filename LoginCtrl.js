app.controller("LoginCtrl",  ['$scope', '$http', '$location', '$window',  LoginCtrl]);
function LoginCtrl($scope, $http, $location, $window) {
			$scope.user = {};		
			$scope.Login = function() {
	   		console.log($scope.user.email);
	   		$window.location.href = "localhost:3000/PPPPP";
	   		$http.post("/Login", $scope.user).success(function (data, status) {
	   				console.log(data);
	   				var user_id = data;
	   				console.log(user_id);
	   				var req_string = "users/" + user_id;
	   			    $http.get(req_string).success(function (err) {
		   			console.log(err);
		   			$window.location.href = "http://localhost:3000/HomePage.html";
	   			   });
	   			//}
            });
	   	}
    };
  LoginCtrl.$inject = ['$scope', '$http', '$location'];