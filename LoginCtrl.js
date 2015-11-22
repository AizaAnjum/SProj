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
		   			$window.location.href = "http://localhost:3000/User/" + user_id;
            });
	   	}
    };
  LoginCtrl.$inject = ['$scope', '$http', '$location'];